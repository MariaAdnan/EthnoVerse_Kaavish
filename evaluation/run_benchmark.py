#!/usr/bin/env python3
"""Reproducible held-out-view benchmark for EthnoVerse reconstructions.

The script never modifies the capture directory. It creates an 80/20 split in
an isolated workspace, optionally invokes the existing reconstruction/render
workflow through command templates, and computes PSNR/SSIM for rendered
held-out views.
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import shlex
import shutil
import subprocess
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image
from skimage.metrics import peak_signal_noise_ratio, structural_similarity

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff"}


@dataclass(frozen=True)
class ImageMetric:
    filename: str
    psnr_db: float
    ssim: float


def discover_images(directory: Path) -> list[Path]:
    """Return supported capture images in stable filename order."""
    return sorted(
        (
            path
            for path in directory.iterdir()
            if path.is_file() and path.suffix.lower() in IMAGE_SUFFIXES
        ),
        key=lambda path: path.name.casefold(),
    )


def split_images(
    images: Iterable[Path],
    test_fraction: float = 0.2,
    seed: int = 2026,
) -> tuple[list[Path], list[Path]]:
    """Create a deterministic randomized train/test split."""
    image_list = list(images)
    if len(image_list) < 5:
        raise ValueError("At least five capture images are required for an 80/20 split.")
    if not 0 < test_fraction < 1:
        raise ValueError("test_fraction must be between 0 and 1.")

    shuffled = image_list.copy()
    random.Random(seed).shuffle(shuffled)
    test_count = max(1, round(len(shuffled) * test_fraction))
    test_names = {path.name for path in shuffled[:test_count]}
    train = [path for path in image_list if path.name not in test_names]
    test = [path for path in image_list if path.name in test_names]
    return train, test


def stage_split(paths: Iterable[Path], destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for source in paths:
        shutil.copy2(source, destination / source.name)


def format_command(template: str, **paths: Path) -> list[str]:
    values = {name: str(path.resolve()) for name, path in paths.items()}
    return shlex.split(template.format(**values))


def run_command(template: str, label: str, **paths: Path) -> float:
    command = format_command(template, **paths)
    started_at = time.perf_counter()
    subprocess.run(command, check=True)
    elapsed = time.perf_counter() - started_at
    print(f"{label} completed in {elapsed:.2f}s")
    return elapsed


def load_rgb(path: Path) -> np.ndarray:
    with Image.open(path) as image:
        return np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0


def calculate_metrics(reference_path: Path, render_path: Path) -> ImageMetric:
    reference = load_rgb(reference_path)
    rendered = load_rgb(render_path)
    if rendered.shape != reference.shape:
        rendered_image = Image.fromarray(
            np.clip(rendered * 255.0, 0, 255).astype(np.uint8)
        )
        rendered = np.asarray(
            rendered_image.resize(
                (reference.shape[1], reference.shape[0]),
                Image.Resampling.LANCZOS,
            ),
            dtype=np.float32,
        ) / 255.0

    psnr = (
        float("inf")
        if np.array_equal(reference, rendered)
        else peak_signal_noise_ratio(reference, rendered, data_range=1.0)
    )
    ssim = structural_similarity(
        reference,
        rendered,
        channel_axis=2,
        data_range=1.0,
    )
    return ImageMetric(reference_path.name, float(psnr), float(ssim))


def evaluate_renders(test_dir: Path, render_dir: Path) -> list[ImageMetric]:
    metrics: list[ImageMetric] = []
    for reference in discover_images(test_dir):
        rendered = render_dir / reference.name
        if not rendered.exists():
            raise FileNotFoundError(
                f"Missing held-out render for {reference.name}: {rendered}"
            )
        metrics.append(calculate_metrics(reference, rendered))
    return metrics


def write_reports(
    output_dir: Path,
    metrics: list[ImageMetric],
    train_count: int,
    test_count: int,
    seed: int,
    pipeline_seconds: float | None,
    render_seconds: float | None,
    metric_seconds: float,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    with (output_dir / "per_image_metrics.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["filename", "psnr_db", "ssim"])
        writer.writeheader()
        writer.writerows(asdict(metric) for metric in metrics)

    summary = {
        "split": {
            "train_images": train_count,
            "test_images": test_count,
            "test_fraction": test_count / (train_count + test_count),
            "seed": seed,
        },
        "quality": {
            "mean_psnr_db": float(np.mean([metric.psnr_db for metric in metrics])),
            "mean_ssim": float(np.mean([metric.ssim for metric in metrics])),
        },
        "timing_seconds": {
            "pipeline": pipeline_seconds,
            "render": render_seconds,
            "metrics": metric_seconds,
        },
    }
    (output_dir / "summary.json").write_text(
        json.dumps(summary, indent=2) + "\n",
        encoding="utf-8",
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run an isolated 80/20 held-out-view PSNR/SSIM benchmark."
    )
    parser.add_argument("captures", type=Path, help="Directory of source captures")
    parser.add_argument(
        "--workspace",
        type=Path,
        default=Path("evaluation/output/latest"),
        help="Isolated benchmark workspace",
    )
    parser.add_argument("--seed", type=int, default=2026)
    parser.add_argument("--test-fraction", type=float, default=0.2)
    parser.add_argument(
        "--pipeline-command",
        help=(
            "Existing pipeline command template. Available placeholders: "
            "{train_dir}, {test_dir}, {render_dir}, {workspace}."
        ),
    )
    parser.add_argument(
        "--render-command",
        help="Held-out render command template using the same placeholders.",
    )
    parser.add_argument(
        "--renders",
        type=Path,
        help="Existing held-out render directory; filenames must match test images.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Create and report the split without running reconstruction or metrics.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    captures = args.captures.resolve()
    workspace = args.workspace.resolve()
    if not captures.is_dir():
        raise FileNotFoundError(f"Capture directory not found: {captures}")
    if workspace == captures or captures in workspace.parents:
        raise ValueError("Workspace must not be the capture directory or inside it.")

    images = discover_images(captures)
    train, test = split_images(images, args.test_fraction, args.seed)
    train_dir = workspace / "split" / "train"
    test_dir = workspace / "split" / "test"
    render_dir = (args.renders or workspace / "renders").resolve()

    if workspace.exists():
        shutil.rmtree(workspace)
    stage_split(train, train_dir)
    stage_split(test, test_dir)

    manifest = {
        "seed": args.seed,
        "test_fraction": args.test_fraction,
        "train": [path.name for path in train],
        "test": [path.name for path in test],
    }
    (workspace / "split_manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Staged {len(train)} train and {len(test)} held-out images in {workspace}")

    if args.dry_run:
        return 0

    command_paths = {
        "train_dir": train_dir,
        "test_dir": test_dir,
        "render_dir": render_dir,
        "workspace": workspace,
    }
    pipeline_seconds = (
        run_command(args.pipeline_command, "Pipeline", **command_paths)
        if args.pipeline_command
        else None
    )
    render_seconds = (
        run_command(args.render_command, "Held-out rendering", **command_paths)
        if args.render_command
        else None
    )

    if not render_dir.is_dir():
        raise FileNotFoundError(
            "No render directory found. Supply --renders or --render-command. "
            "Use --pipeline-command to invoke the same COLMAP/3DGS workflow as "
            "website/pipeline.py rather than duplicating it here."
        )

    metric_started = time.perf_counter()
    metrics = evaluate_renders(test_dir, render_dir)
    metric_seconds = time.perf_counter() - metric_started
    write_reports(
        workspace,
        metrics,
        len(train),
        len(test),
        args.seed,
        pipeline_seconds,
        render_seconds,
        metric_seconds,
    )
    print(
        "Mean PSNR: "
        f"{np.mean([metric.psnr_db for metric in metrics]):.3f} dB; "
        f"mean SSIM: {np.mean([metric.ssim for metric in metrics]):.5f}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
