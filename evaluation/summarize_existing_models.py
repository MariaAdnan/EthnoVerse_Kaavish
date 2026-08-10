#!/usr/bin/env python3
"""Aggregate existing-model evaluation outputs into CSV, JSON, and Markdown."""

from __future__ import annotations

import csv
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent / "output" / "existing-models"
ITEM_DIRS = ("matka", "bangles-1", "bangles-2", "outfit")


def fmt(value: float, digits: int = 3) -> str:
    return f"{value:.{digits}f}"


def main() -> int:
    summaries = [json.loads((ROOT / item / "summary.json").read_text()) for item in ITEM_DIRS]
    per_view: list[dict[str, object]] = []
    for directory, summary in zip(ITEM_DIRS, summaries):
        with (ROOT / directory / "per_view_metrics.csv").open(newline="") as stream:
            for row in csv.DictReader(stream):
                if row.get("error"):
                    continue
                per_view.append({
                    "item": summary["item"],
                    "image": row["image"],
                    **{key: float(row[key]) for key in (
                        "full_psnr_db", "full_ssim", "foreground_psnr_db", "foreground_ssim"
                    )},
                })

    rows = []
    for summary in summaries:
        quality = summary["quality_mean"]
        deviation = summary["quality_std"]
        rows.append({
            "item": summary["item"],
            "captured_images_n": summary["captured_images_n"],
            "registered_images_n": summary["registered_images_n"],
            "registration_percent": summary["registration_percent"],
            "evaluated_views_n": summary["evaluated_registered_views_n"],
            "model_splats_n": summary["model_splats_n"],
            "model_size_mib": summary["model_bytes"] / (1024 * 1024),
            "foreground_psnr_db_mean": quality["foreground_psnr_db"],
            "foreground_psnr_db_std": deviation["foreground_psnr_db"],
            "foreground_ssim_mean": quality["foreground_ssim"],
            "foreground_ssim_std": deviation["foreground_ssim"],
            "full_psnr_db_mean": quality["full_psnr_db"],
            "full_ssim_mean": quality["full_ssim"],
            "metric_pass_minutes": summary["evaluation_runtime_minutes"],
            "original_training_minutes": "unavailable",
        })

    fields = list(rows[0])
    with (ROOT / "summary.csv").open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader(); writer.writerows(rows)

    metric_keys = ("foreground_psnr_db", "foreground_ssim", "full_psnr_db", "full_ssim")
    overall_quality = {
        key: sum(float(row[key]) for row in per_view) / len(per_view) for key in metric_keys
    }
    overall = {
        "evaluation_type": "observed/training-view reconstruction fidelity",
        "assets_n": len(summaries),
        "captured_images_n": sum(item["captured_images_n"] for item in summaries),
        "registered_images_in_selected_camera_models_n": sum(item["registered_images_n"] for item in summaries),
        "evaluated_views_n": len(per_view),
        "quality_mean_over_all_evaluated_views": overall_quality,
        "metric_pass_minutes_sum": sum(item["evaluation_runtime_minutes"] for item in summaries),
        "original_training_minutes": None,
        "original_training_minutes_note": (
            "The existing PLY/SPZ assets contain no training-duration metadata and no training logs were supplied."
        ),
    }
    (ROOT / "summary.json").write_text(json.dumps({"items": rows, "overall": overall}, indent=2) + "\n")

    table_lines = [
        "| Asset | Captured N | Registered N | Evaluated N | Splats | Foreground PSNR (dB) | Foreground SSIM | Full-frame PSNR (dB) | Full-frame SSIM | Metric pass (min) |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for row in rows:
        table_lines.append(
            f"| {row['item']} | {row['captured_images_n']} | {row['registered_images_n']} "
            f"({fmt(row['registration_percent'], 1)}%) | {row['evaluated_views_n']} | "
            f"{row['model_splats_n']:,} | {fmt(row['foreground_psnr_db_mean'])} ± "
            f"{fmt(row['foreground_psnr_db_std'])} | {fmt(row['foreground_ssim_mean'])} ± "
            f"{fmt(row['foreground_ssim_std'])} | {fmt(row['full_psnr_db_mean'])} | "
            f"{fmt(row['full_ssim_mean'])} | {fmt(row['metric_pass_minutes'])} |"
        )

    report = f"""# Existing-model reconstruction evaluation

## Result

The four already-trained PLY assets were evaluated against the photographs in
`items.zip`; no model was retrained or modified. The PLY files are the source
models corresponding to the compressed SPZ assets referenced by the production
3D-tour configuration.

{chr(10).join(table_lines)}

Across all {overall['evaluated_views_n']} evaluated views, mean foreground PSNR
was {fmt(overall_quality['foreground_psnr_db'])} dB and mean foreground SSIM was
{fmt(overall_quality['foreground_ssim'])}. The capture archive contained
{overall['captured_images_n']} photographs in total.

## Method

- HEIC inputs were auto-oriented, resized to at most 1600 pixels on the long
  edge, and stripped of EXIF before camera recovery.
- COLMAP 3.12.6 recovered camera intrinsics and poses. Eight evenly spaced
  registered views per asset were evaluated (32 total).
- Existing GraphDeco-style PLY Gaussian parameters were parsed directly. The
  CPU renderer evaluates degree-3 spherical harmonics, projects anisotropic
  covariance, and alpha-composites front-to-back at a 400-pixel maximum output
  dimension.
- Model coordinates were aligned to the selected COLMAP sparse model with PCA
  initialization and trimmed symmetric similarity ICP. Bangles 2 has a
  rotationally ambiguous cylindrical geometry, so its alignment was additionally
  gravity-corrected from recovered camera up-vectors and calibrated to observed
  silhouettes; its score therefore includes observed-view registration
  refinement.
- Primary metrics use pixels in the largest connected component where rendered
  alpha is at least 0.30. Holes are not filled, so jewellery negative space is
  excluded. PSNR uses unit-range RGB MSE. SSIM uses an 11-pixel-equivalent
  Gaussian window (sigma 1.5), constants K1=0.01 and K2=0.03, and is averaged
  inside the same foreground mask.
- Full-frame metrics are retained for auditability, but they are secondary:
  the models reconstruct isolated objects over white, while the references
  contain rooms, paper, carpet, people, and other background content.

## Interpretation and limitations

These are **observed/training-view reconstruction-fidelity scores**, not a
held-out or novel-view benchmark. The existing models may have been trained on
all source photographs, and their PLY/SPZ files contain neither the original
camera metadata nor a train/test manifest. The values can support a statement
about how faithfully the existing assets reproduce observed captures, but they
must not be presented as evidence of unseen-view generalization.

Camera recovery registered 46/54 Matka views, 93/93 Bangles 1 views, 105/105
Bangles 2 views, and 72/140 views in the selected largest Outfit component.
The Outfit captures formed additional disconnected COLMAP components under the
sequence-aware recovery used here; only the largest consistent camera model was
used for scoring.

Original training time in minutes is **unavailable**. PLY and SPZ files do not
store training duration, and `items.zip` contains only photographs. The reported
metric-pass timing is the current render-and-measure pass with saved cameras and
alignments; it is not training time and should not be labeled as such in a paper.
To publish training minutes, the original Modal/training logs are required (or a
new controlled retraining run, which was intentionally not performed here).

## Reproducibility artifacts

- `evaluate_existing_models.py`: parser, alignment, renderer, PSNR/SSIM, and
  per-view report generation.
- `summary.csv` and `summary.json`: aggregate machine-readable results.
- Each item directory contains `summary.json`, `per_view_metrics.csv`, the saved
  alignment, and eight reference/render/alpha comparison images.
"""
    (ROOT / "REPORT.md").write_text(report)
    print(json.dumps(overall, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
