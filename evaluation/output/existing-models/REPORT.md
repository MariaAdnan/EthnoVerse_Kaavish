# Existing-model reconstruction evaluation

## Result

The four already-trained PLY assets were evaluated against the photographs in
`items.zip`; no model was retrained or modified. The PLY files are the source
models corresponding to the compressed SPZ assets referenced by the production
3D-tour configuration.

| Asset | Captured N | Registered N | Evaluated N | Splats | Foreground PSNR (dB) | Foreground SSIM | Full-frame PSNR (dB) | Full-frame SSIM | Metric pass (min) |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Matka | 54 | 46 (85.2%) | 8 | 6,944 | 14.019 ± 5.964 | 0.504 ± 0.184 | 8.255 | 0.680 | 0.073 |
| Bangles 1 | 93 | 93 (100.0%) | 8 | 10,868 | 12.341 ± 0.577 | 0.142 ± 0.019 | 6.330 | 0.466 | 0.087 |
| Bangles 2 | 105 | 105 (100.0%) | 8 | 2,527 | 11.352 ± 1.767 | 0.303 ± 0.139 | 5.932 | 0.308 | 0.048 |
| Outfit | 140 | 72 (51.4%) | 8 | 91,188 | 15.101 ± 2.386 | 0.156 ± 0.111 | 6.790 | 0.352 | 0.409 |

Across all 32 evaluated views, mean foreground PSNR
was 13.203 dB and mean foreground SSIM was
0.276. The capture archive contained
392 photographs in total.

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
