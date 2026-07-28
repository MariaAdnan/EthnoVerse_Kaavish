# Reconstruction benchmark

`run_benchmark.py` provides the paper's reproducible held-out-view evaluation
path without changing production uploads:

1. deterministically split captures into 80% training and 20% held-out images;
2. invoke the existing COLMAP/3DGS and rendering commands supplied by the
   researcher;
3. compare same-named held-out reference and rendered images;
4. write per-image PSNR/SSIM plus aggregate quality and timing data.

Install the small evaluation-only dependency set:

```bash
python -m pip install -r evaluation/requirements.txt
```

Validate a capture set and write its split manifest:

```bash
python evaluation/run_benchmark.py captures/ --dry-run
```

Run a benchmark using the existing worker/pipeline wrapper and a renderer:

```bash
python evaluation/run_benchmark.py captures/ \
  --pipeline-command 'your-existing-pipeline-wrapper --images {train_dir} --output {workspace}' \
  --render-command 'your-existing-render-wrapper --tests {test_dir} --output {render_dir}'
```

The command templates receive absolute paths for `{train_dir}`, `{test_dir}`,
`{render_dir}`, and `{workspace}`. This keeps environment-specific GPU/Modal
invocation outside the methodology code and ensures the benchmark calls the
same reconstruction implementation as `website/pipeline.py`.

If held-out renders already exist:

```bash
python evaluation/run_benchmark.py captures/ --renders benchmark-renders/
```

Rendered filenames must match their held-out source filenames. Results are
written to `evaluation/output/latest/summary.json` and
`per_image_metrics.csv`.
