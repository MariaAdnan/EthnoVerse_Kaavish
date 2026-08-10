#!/usr/bin/env python3
"""Evaluate existing 3D Gaussian Splatting PLY assets against capture views.

This is an observed-view reconstruction check, not a held-out benchmark: the
PLY files were trained before this script is run and may have seen every source
photo.  COLMAP data is used only to recover camera poses.  No model is trained,
fine-tuned, or modified.

The implementation intentionally has no dependency on the training repository.
It reads GraphDeco-style Gaussian PLY files, aligns them to a recovered COLMAP
sparse model, renders selected registered cameras on the CPU, and records both
full-frame and foreground-only PSNR/SSIM.
"""

from __future__ import annotations

import argparse
import csv
import itertools
import json
import math
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
from scipy.spatial import cKDTree


C0 = 0.28209479177387814
C1 = 0.4886025119029199
C2 = (1.0925484305920792, -1.0925484305920792,
      0.31539156525252005, -1.0925484305920792, 0.5462742152960396)
C3 = (-0.5900435899266435, 2.890611442640554, -0.4570457994644658,
      0.3731763325901154, -0.4570457994644658, 1.445305721320277,
      -0.5900435899266435)


@dataclass
class Camera:
    model: str
    width: int
    height: int
    params: np.ndarray


@dataclass
class RegisteredImage:
    name: str
    camera_id: int
    rotation: np.ndarray
    translation: np.ndarray
    observations: np.ndarray
    point_ids: np.ndarray


def sigmoid(value: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(value, -30.0, 30.0)))


def quaternion_to_rotation(q: np.ndarray) -> np.ndarray:
    q = np.asarray(q, dtype=np.float64)
    q /= np.linalg.norm(q)
    w, x, y, z = q
    return np.array([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ])


def read_gaussian_ply(path: Path) -> dict[str, np.ndarray]:
    with path.open("rb") as stream:
        header_lines: list[str] = []
        while True:
            raw = stream.readline()
            if not raw:
                raise ValueError(f"PLY header is incomplete: {path}")
            line = raw.decode("ascii").strip()
            header_lines.append(line)
            if line == "end_header":
                break
        if "format binary_little_endian 1.0" not in header_lines:
            raise ValueError(f"Only binary little-endian PLY is supported: {path}")
        vertex_line = next(line for line in header_lines if line.startswith("element vertex "))
        count = int(vertex_line.split()[-1])
        properties = [line.split()[-1] for line in header_lines if line.startswith("property float ")]
        dtype = np.dtype([(name, "<f4") for name in properties])
        vertices = np.fromfile(stream, dtype=dtype, count=count)

    def columns(prefix: str) -> np.ndarray:
        names = sorted(
            (name for name in properties if name.startswith(prefix)),
            key=lambda name: int(name.rsplit("_", 1)[1]),
        )
        return np.column_stack([vertices[name] for name in names]).astype(np.float64)

    xyz = np.column_stack([vertices[axis] for axis in "xyz"]).astype(np.float64)
    dc = columns("f_dc_")
    rest_flat = columns("f_rest_")
    if rest_flat.shape[1] % 3:
        raise ValueError(f"Unexpected SH property count in {path}")
    # GraphDeco stores all coefficients for R, then G, then B.
    rest = rest_flat.reshape(len(xyz), 3, -1).transpose(0, 2, 1)
    sh = np.concatenate([dc[:, None, :], rest], axis=1)
    rotations = columns("rot_")
    rotations /= np.maximum(np.linalg.norm(rotations, axis=1, keepdims=True), 1e-12)
    return {
        "xyz": xyz,
        "sh": sh,
        "opacity": sigmoid(vertices["opacity"].astype(np.float64)),
        "rotation": rotations,
        "scale": np.exp(columns("scale_")),
    }


def read_colmap_text(model_dir: Path) -> tuple[dict[int, Camera], dict[int, RegisteredImage], dict[int, np.ndarray]]:
    cameras: dict[int, Camera] = {}
    for line in (model_dir / "cameras.txt").read_text().splitlines():
        if not line or line.startswith("#"):
            continue
        fields = line.split()
        camera_id = int(fields[0])
        cameras[camera_id] = Camera(
            model=fields[1], width=int(fields[2]), height=int(fields[3]),
            params=np.asarray(fields[4:], dtype=np.float64),
        )

    images: dict[int, RegisteredImage] = {}
    lines = (model_dir / "images.txt").read_text().splitlines()
    index = 0
    while index < len(lines):
        pose_line = lines[index]
        index += 1
        if not pose_line or pose_line.startswith("#"):
            continue
        fields = pose_line.split()
        if index >= len(lines):
            raise ValueError("Missing COLMAP points2D line")
        point_fields = lines[index].split()
        index += 1
        observations = np.asarray(point_fields, dtype=object).reshape(-1, 3) if point_fields else np.empty((0, 3), dtype=object)
        images[int(fields[0])] = RegisteredImage(
            name=fields[9], camera_id=int(fields[8]),
            rotation=quaternion_to_rotation(np.asarray(fields[1:5], dtype=float)),
            translation=np.asarray(fields[5:8], dtype=float),
            observations=observations[:, :2].astype(float) if len(observations) else np.empty((0, 2)),
            point_ids=observations[:, 2].astype(np.int64) if len(observations) else np.empty(0, dtype=np.int64),
        )

    points: dict[int, np.ndarray] = {}
    for line in (model_dir / "points3D.txt").read_text().splitlines():
        if not line or line.startswith("#"):
            continue
        fields = line.split()
        points[int(fields[0])] = np.asarray(fields[1:4], dtype=np.float64)
    return cameras, images, points


def camera_intrinsics(camera: Camera) -> tuple[float, float, float, float]:
    if camera.model in {"SIMPLE_PINHOLE", "SIMPLE_RADIAL", "RADIAL"}:
        f, cx, cy = camera.params[:3]
        return float(f), float(f), float(cx), float(cy)
    if camera.model in {"PINHOLE", "OPENCV", "FULL_OPENCV"}:
        fx, fy, cx, cy = camera.params[:4]
        return float(fx), float(fy), float(cx), float(cy)
    raise ValueError(f"Unsupported COLMAP camera model: {camera.model}")


def central_sparse_points(
    cameras: dict[int, Camera], images: dict[int, RegisteredImage], points: dict[int, np.ndarray],
    radius_squared: float = 0.36,
) -> np.ndarray:
    radii: dict[int, list[float]] = {}
    for image in images.values():
        camera = cameras[image.camera_id]
        for (x, y), point_id in zip(image.observations, image.point_ids):
            if point_id < 0:
                continue
            dx = (x - camera.width / 2.0) / (camera.width / 2.0)
            dy = (y - camera.height / 2.0) / (camera.height / 2.0)
            radii.setdefault(int(point_id), []).append(float(dx * dx + dy * dy))
    selected = [points[point_id] for point_id, values in radii.items()
                if point_id in points and np.median(values) < radius_squared]
    target = np.asarray(selected, dtype=np.float64)
    if len(target) < 50:
        target = np.asarray(list(points.values()), dtype=np.float64)
    center = np.median(target, axis=0)
    distance = np.linalg.norm(target - center, axis=1)
    return target[distance <= np.percentile(distance, 92)]


def pca_basis(points: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    center = np.median(points, axis=0)
    centered = points - center
    covariance = centered.T @ centered / max(1, len(points))
    values, vectors = np.linalg.eigh(covariance)
    return center, vectors[:, np.argsort(values)[::-1]]


def umeyama(source: np.ndarray, target: np.ndarray) -> tuple[float, np.ndarray, np.ndarray]:
    source_center = source.mean(axis=0)
    target_center = target.mean(axis=0)
    x = source - source_center
    y = target - target_center
    covariance = y.T @ x / len(x)
    u, singular, vt = np.linalg.svd(covariance)
    correction = np.eye(3)
    if np.linalg.det(u @ vt) < 0:
        correction[-1, -1] = -1
    rotation = u @ correction @ vt
    variance = np.mean(np.sum(x * x, axis=1))
    scale = float(np.sum(singular * np.diag(correction)) / max(variance, 1e-12))
    translation = target_center - scale * (rotation @ source_center)
    return scale, rotation, translation


def align_model(model_xyz: np.ndarray, target_xyz: np.ndarray, seed: int = 2026) -> tuple[float, np.ndarray, np.ndarray, float]:
    rng = np.random.default_rng(seed)
    source_center = np.median(model_xyz, axis=0)
    source_distance = np.linalg.norm(model_xyz - source_center, axis=1)
    source_pool = model_xyz[source_distance <= np.percentile(source_distance, 98)]
    if len(source_pool) > 2500:
        source = source_pool[rng.choice(len(source_pool), 2500, replace=False)]
    else:
        source = source_pool
    if len(target_xyz) > 3000:
        target = target_xyz[rng.choice(len(target_xyz), 3000, replace=False)]
    else:
        target = target_xyz

    source_center, source_basis = pca_basis(source)
    target_center, target_basis = pca_basis(target)
    source_radius = np.median(np.linalg.norm(source - source_center, axis=1))
    target_radius = np.median(np.linalg.norm(target - target_center, axis=1))
    initial_scale = target_radius / max(source_radius, 1e-12)
    target_tree = cKDTree(target)
    best: tuple[float, float, np.ndarray, np.ndarray] | None = None

    for permutation in itertools.permutations(range(3)):
        permutation_matrix = np.eye(3)[:, permutation]
        for signs in itertools.product((-1.0, 1.0), repeat=3):
            orientation = permutation_matrix @ np.diag(signs)
            rotation = target_basis @ orientation @ source_basis.T
            if np.linalg.det(rotation) < 0:
                continue
            scale = initial_scale
            translation = target_center - scale * (rotation @ source_center)
            for _ in range(24):
                transformed = scale * (source @ rotation.T) + translation
                forward_distance, forward_index = target_tree.query(transformed)
                reverse_distance, reverse_index = cKDTree(transformed).query(target)
                forward_keep = forward_distance <= np.percentile(forward_distance, 70)
                reverse_keep = reverse_distance <= np.percentile(reverse_distance, 70)
                paired_source = np.concatenate([source[forward_keep], source[reverse_index[reverse_keep]]])
                paired_target = np.concatenate([target[forward_index[forward_keep]], target[reverse_keep]])
                scale, rotation, translation = umeyama(paired_source, paired_target)
            transformed = scale * (source @ rotation.T) + translation
            forward = target_tree.query(transformed)[0]
            reverse = cKDTree(transformed).query(target)[0]
            score = math.sqrt((np.mean(np.sort(forward)[:max(1, int(.7 * len(forward)))] ** 2)
                               + np.mean(np.sort(reverse)[:max(1, int(.7 * len(reverse)))] ** 2)) / 2.0)
            candidate = (score, scale, rotation, translation)
            if best is None or candidate[0] < best[0]:
                best = candidate
    if best is None:
        raise RuntimeError("No proper-rotation alignment candidate was found")
    score, scale, rotation, translation = best
    return scale, rotation, translation, score


def quaternion_covariances(rotations: np.ndarray, scales: np.ndarray) -> np.ndarray:
    w, x, y, z = rotations.T
    matrices = np.empty((len(rotations), 3, 3), dtype=np.float64)
    matrices[:, 0, 0] = 1 - 2 * (y * y + z * z)
    matrices[:, 0, 1] = 2 * (x * y - z * w)
    matrices[:, 0, 2] = 2 * (x * z + y * w)
    matrices[:, 1, 0] = 2 * (x * y + z * w)
    matrices[:, 1, 1] = 1 - 2 * (x * x + z * z)
    matrices[:, 1, 2] = 2 * (y * z - x * w)
    matrices[:, 2, 0] = 2 * (x * z - y * w)
    matrices[:, 2, 1] = 2 * (y * z + x * w)
    matrices[:, 2, 2] = 1 - 2 * (x * x + y * y)
    scaled = matrices * scales[:, None, :]
    return scaled @ np.transpose(scaled, (0, 2, 1))


def evaluate_sh(sh: np.ndarray, directions: np.ndarray) -> np.ndarray:
    x, y, z = directions.T
    result = C0 * sh[:, 0]
    if sh.shape[1] >= 4:
        result += (-C1 * y[:, None] * sh[:, 1] + C1 * z[:, None] * sh[:, 2]
                   - C1 * x[:, None] * sh[:, 3])
    if sh.shape[1] >= 9:
        xx, yy, zz = x * x, y * y, z * z
        xy, yz, xz = x * y, y * z, x * z
        result += (C2[0] * xy[:, None] * sh[:, 4]
                   + C2[1] * yz[:, None] * sh[:, 5]
                   + C2[2] * (2 * zz - xx - yy)[:, None] * sh[:, 6]
                   + C2[3] * xz[:, None] * sh[:, 7]
                   + C2[4] * (xx - yy)[:, None] * sh[:, 8])
    if sh.shape[1] >= 16:
        result += (C3[0] * (y * (3 * x * x - y * y))[:, None] * sh[:, 9]
                   + C3[1] * (x * y * z)[:, None] * sh[:, 10]
                   + C3[2] * (y * (4 * z * z - x * x - y * y))[:, None] * sh[:, 11]
                   + C3[3] * (z * (2 * z * z - 3 * x * x - 3 * y * y))[:, None] * sh[:, 12]
                   + C3[4] * (x * (4 * z * z - x * x - y * y))[:, None] * sh[:, 13]
                   + C3[5] * (z * (x * x - y * y))[:, None] * sh[:, 14]
                   + C3[6] * (x * (x * x - 3 * y * y))[:, None] * sh[:, 15])
    return np.clip(result + 0.5, 0.0, 1.0)


def render_gaussians(
    model: dict[str, np.ndarray], camera: Camera, image: RegisteredImage,
    alignment: tuple[float, np.ndarray, np.ndarray], max_dimension: int,
) -> tuple[np.ndarray, np.ndarray]:
    scale, alignment_rotation, translation = alignment
    xyz_model = model["xyz"]
    xyz_world = scale * (xyz_model @ alignment_rotation.T) + translation
    xyz_camera = xyz_world @ image.rotation.T + image.translation
    depth = xyz_camera[:, 2]
    fx, fy, cx, cy = camera_intrinsics(camera)
    output_scale = max_dimension / max(camera.width, camera.height)
    width = max(1, round(camera.width * output_scale))
    height = max(1, round(camera.height * output_scale))
    fx, fy, cx, cy = fx * output_scale, fy * output_scale, cx * output_scale, cy * output_scale
    u = fx * xyz_camera[:, 0] / depth + cx
    v = fy * xyz_camera[:, 1] / depth + cy

    covariance_model = quaternion_covariances(model["rotation"], model["scale"])
    world_rotation = alignment_rotation[None, :, :]
    covariance_world = (scale * scale) * (world_rotation @ covariance_model @ np.transpose(world_rotation, (0, 2, 1)))
    camera_rotation = image.rotation[None, :, :]
    covariance_camera = camera_rotation @ covariance_world @ np.transpose(camera_rotation, (0, 2, 1))
    jacobian = np.zeros((len(depth), 2, 3), dtype=np.float64)
    jacobian[:, 0, 0] = fx / depth
    jacobian[:, 0, 2] = -fx * xyz_camera[:, 0] / (depth * depth)
    jacobian[:, 1, 1] = fy / depth
    jacobian[:, 1, 2] = -fy * xyz_camera[:, 1] / (depth * depth)
    covariance_2d = jacobian @ covariance_camera @ np.transpose(jacobian, (0, 2, 1))
    covariance_2d[:, 0, 0] += 0.3
    covariance_2d[:, 1, 1] += 0.3

    eigenvalues = np.linalg.eigvalsh(covariance_2d)
    radius = 3.0 * np.sqrt(np.maximum(eigenvalues[:, 1], 1e-8))
    valid = (depth > 1e-4) & np.isfinite(radius) & (radius > 0.1) & (radius < max_dimension)
    valid &= (u + radius >= 0) & (u - radius < width) & (v + radius >= 0) & (v - radius < height)
    indices = np.flatnonzero(valid)
    indices = indices[np.argsort(depth[indices])]

    camera_center_world = -image.rotation.T @ image.translation
    camera_center_model = ((camera_center_world - translation) @ alignment_rotation) / scale
    directions = xyz_model - camera_center_model
    directions /= np.maximum(np.linalg.norm(directions, axis=1, keepdims=True), 1e-12)
    colors = evaluate_sh(model["sh"], directions)

    accumulated = np.zeros((height, width, 3), dtype=np.float64)
    alpha = np.zeros((height, width), dtype=np.float64)
    for gaussian_index in indices:
        gaussian_radius = min(float(radius[gaussian_index]), 80.0)
        x0 = max(0, int(math.floor(u[gaussian_index] - gaussian_radius)))
        x1 = min(width, int(math.ceil(u[gaussian_index] + gaussian_radius + 1)))
        y0 = max(0, int(math.floor(v[gaussian_index] - gaussian_radius)))
        y1 = min(height, int(math.ceil(v[gaussian_index] + gaussian_radius + 1)))
        if x1 <= x0 or y1 <= y0:
            continue
        covariance = covariance_2d[gaussian_index]
        determinant = covariance[0, 0] * covariance[1, 1] - covariance[0, 1] * covariance[1, 0]
        if determinant <= 1e-12:
            continue
        inverse = np.array([[covariance[1, 1], -covariance[0, 1]],
                            [-covariance[1, 0], covariance[0, 0]]]) / determinant
        grid_x = np.arange(x0, x1, dtype=np.float64) - u[gaussian_index]
        grid_y = np.arange(y0, y1, dtype=np.float64) - v[gaussian_index]
        dx, dy = np.meshgrid(grid_x, grid_y)
        exponent = -0.5 * (inverse[0, 0] * dx * dx
                           + (inverse[0, 1] + inverse[1, 0]) * dx * dy
                           + inverse[1, 1] * dy * dy)
        gaussian_alpha = np.minimum(0.99, model["opacity"][gaussian_index] * np.exp(exponent))
        gaussian_alpha[gaussian_alpha < (1.0 / 255.0)] = 0.0
        transmittance = 1.0 - alpha[y0:y1, x0:x1]
        weight = transmittance * gaussian_alpha
        accumulated[y0:y1, x0:x1] += weight[:, :, None] * colors[gaussian_index]
        alpha[y0:y1, x0:x1] += weight
    white_composite = accumulated + (1.0 - alpha[:, :, None])
    return np.clip(white_composite, 0.0, 1.0), np.clip(alpha, 0.0, 1.0)


def resize_reference(path: Path, width: int, height: int) -> np.ndarray:
    with Image.open(path) as source:
        image = source.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
    return np.asarray(image, dtype=np.float64) / 255.0


def ssim_map(reference: np.ndarray, rendered: np.ndarray) -> np.ndarray:
    sigma = 1.5
    mu_x = ndimage.gaussian_filter(reference, sigma=(sigma, sigma, 0), mode="reflect", truncate=3.5)
    mu_y = ndimage.gaussian_filter(rendered, sigma=(sigma, sigma, 0), mode="reflect", truncate=3.5)
    sigma_x = ndimage.gaussian_filter(reference * reference, sigma=(sigma, sigma, 0), mode="reflect", truncate=3.5) - mu_x * mu_x
    sigma_y = ndimage.gaussian_filter(rendered * rendered, sigma=(sigma, sigma, 0), mode="reflect", truncate=3.5) - mu_y * mu_y
    sigma_xy = ndimage.gaussian_filter(reference * rendered, sigma=(sigma, sigma, 0), mode="reflect", truncate=3.5) - mu_x * mu_y
    numerator = (2 * mu_x * mu_y + 0.01 ** 2) * (2 * sigma_xy + 0.03 ** 2)
    denominator = (mu_x * mu_x + mu_y * mu_y + 0.01 ** 2) * (sigma_x + sigma_y + 0.03 ** 2)
    return np.mean(numerator / np.maximum(denominator, 1e-12), axis=2)


def largest_foreground(alpha: np.ndarray, threshold: float = 0.30) -> np.ndarray:
    mask = alpha >= threshold
    mask = ndimage.binary_closing(mask, iterations=2)
    labels, count = ndimage.label(mask)
    if count:
        sizes = ndimage.sum(mask, labels, range(1, count + 1))
        mask = labels == (int(np.argmax(sizes)) + 1)
    # Do not fill holes: the negative space inside jewellery is background, not
    # reconstructed foreground, and including it would bias object-only scores.
    return mask


def metrics(reference: np.ndarray, rendered: np.ndarray, alpha: np.ndarray) -> dict[str, float | int]:
    squared_error = (reference - rendered) ** 2
    full_mse = float(np.mean(squared_error))
    full_psnr = float("inf") if full_mse == 0 else -10.0 * math.log10(full_mse)
    similarity = ssim_map(reference, rendered)
    foreground = largest_foreground(alpha)
    if np.count_nonzero(foreground) < 64:
        raise ValueError("Rendered foreground mask is too small for a reliable metric")
    masked_mse = float(np.mean(squared_error[foreground]))
    masked_psnr = float("inf") if masked_mse == 0 else -10.0 * math.log10(masked_mse)
    return {
        "foreground_pixels": int(np.count_nonzero(foreground)),
        "full_psnr_db": full_psnr,
        "full_ssim": float(np.mean(similarity)),
        "foreground_psnr_db": masked_psnr,
        "foreground_ssim": float(np.mean(similarity[foreground])),
    }


def save_comparison(path: Path, reference: np.ndarray, rendered: np.ndarray, alpha: np.ndarray, label: str) -> None:
    ref = Image.fromarray(np.uint8(np.clip(reference * 255, 0, 255)))
    out = Image.fromarray(np.uint8(np.clip(rendered * 255, 0, 255)))
    mask = Image.fromarray(np.uint8(np.repeat(alpha[:, :, None], 3, axis=2) * 255))
    canvas = Image.new("RGB", (ref.width * 3, ref.height + 28), "white")
    canvas.paste(ref, (0, 28)); canvas.paste(out, (ref.width, 28)); canvas.paste(mask, (2 * ref.width, 28))
    ImageDraw.Draw(canvas).text((8, 7), f"{label} | reference | existing PLY render | alpha", fill="black")
    canvas.save(path, quality=92)


def choose_views(images: dict[int, RegisteredImage], count: int) -> list[RegisteredImage]:
    ordered = sorted(images.values(), key=lambda item: item.name.casefold())
    if len(ordered) <= count:
        return ordered
    indices = np.linspace(0, len(ordered) - 1, count, dtype=int)
    return [ordered[index] for index in indices]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True)
    parser.add_argument("--model", required=True, type=Path)
    parser.add_argument("--captures", required=True, type=Path)
    parser.add_argument("--colmap-model", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--captured-count", required=True, type=int)
    parser.add_argument("--views", type=int, default=8)
    parser.add_argument("--max-dimension", type=int, default=400)
    parser.add_argument("--alignment", type=Path, help="Reuse a saved .npz alignment")
    parser.add_argument(
        "--alignment-note",
        help="Method disclosure appended to the result when a supplied alignment was refined.",
    )
    args = parser.parse_args()

    started = time.perf_counter()
    args.output.mkdir(parents=True, exist_ok=True)
    model = read_gaussian_ply(args.model)
    cameras, images, points = read_colmap_text(args.colmap_model)
    if args.alignment and args.alignment.exists():
        saved = np.load(args.alignment)
        alignment = (float(saved["scale"]), saved["rotation"], saved["translation"])
        alignment_score = float(saved["score"]) if "score" in saved else None
    else:
        target = central_sparse_points(cameras, images, points)
        scale, rotation, translation, alignment_score = align_model(model["xyz"], target)
        alignment = (scale, rotation, translation)
        np.savez(args.output / "alignment.npz", scale=scale, rotation=rotation,
                 translation=translation, score=alignment_score)

    rows: list[dict[str, float | int | str]] = []
    for registered in choose_views(images, args.views):
        camera = cameras[registered.camera_id]
        rendered, alpha = render_gaussians(model, camera, registered, alignment, args.max_dimension)
        reference = resize_reference(args.captures / registered.name, rendered.shape[1], rendered.shape[0])
        try:
            row = {"image": registered.name, **metrics(reference, rendered, alpha)}
        except ValueError as error:
            row = {"image": registered.name, "error": str(error)}
        rows.append(row)
        save_comparison(args.output / f"comparison-{Path(registered.name).stem}.jpg",
                        reference, rendered, alpha, registered.name)

    numeric_rows = [row for row in rows if "error" not in row]
    quality_keys = ("full_psnr_db", "full_ssim", "foreground_psnr_db", "foreground_ssim")
    method_notes = [
        "No retraining or model modification was performed.",
        "Cameras were recovered from the supplied capture sequence with COLMAP.",
        "Foreground metrics use the largest connected component of render alpha >= 0.30.",
        "Full-frame metrics are background-sensitive because the object-only PLY renders over white.",
        "These are not novel-view generalization scores because the existing model may have seen all source photographs.",
    ]
    if args.alignment_note:
        method_notes.append(args.alignment_note)
    summary = {
        "item": args.name,
        "evaluation_type": "observed/training-view reconstruction fidelity",
        "captured_images_n": args.captured_count,
        "registered_images_n": len(images),
        "registration_percent": 100.0 * len(images) / args.captured_count,
        "evaluated_registered_views_n": len(numeric_rows),
        "model_splats_n": len(model["xyz"]),
        "model_bytes": args.model.stat().st_size,
        "alignment_trimmed_symmetric_rmse": alignment_score,
        "quality_mean": {key: float(np.mean([row[key] for row in numeric_rows])) for key in quality_keys},
        "quality_std": {key: float(np.std([row[key] for row in numeric_rows], ddof=1)) if len(numeric_rows) > 1 else 0.0 for key in quality_keys},
        "original_training_minutes": None,
        "original_training_minutes_note": "Not recoverable from an existing PLY/SPZ file; training logs were not supplied.",
        "evaluation_runtime_minutes": (time.perf_counter() - started) / 60.0,
        "method_notes": method_notes,
    }
    (args.output / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")
    fields = ["image", "foreground_pixels", *quality_keys, "error"]
    with (args.output / "per_view_metrics.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields, extrasaction="ignore")
        writer.writeheader(); writer.writerows(rows)
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
