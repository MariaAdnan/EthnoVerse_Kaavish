# pipeline/pipeline.py
import os
import subprocess
import pycolmap
from pathlib import Path

VIDEO = "videos/ketchup.mp4"
FRAMES = Path("images")
DB_PATH = Path("colmap/ketchup/database.db")   #  DB in its own folder
SPARSE_OUT = Path("sparse")                     # COLMAP will create sparse/0/ itself
GS_REPO = Path("../gaussian-splatting")         # path to your gaussian-splatting clone
MODEL_OUT = Path("output/ketchup")

FRAMES.mkdir(parents=True, exist_ok=True)
SPARSE_OUT.mkdir(parents=True, exist_ok=True)
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
MODEL_OUT.mkdir(parents=True, exist_ok=True)

# Start fresh
if DB_PATH.exists():
    DB_PATH.unlink()

print("Step 1: Extracting frames...")
subprocess.run([
    "ffmpeg", "-i", VIDEO, "-vf", "fps=5",
    str(FRAMES / "frame_%04d.jpg")
], check=True)

print("Step 2: Feature extraction...")
pycolmap.extract_features(database_path=DB_PATH, image_path=FRAMES)

print("Step 3: Matching features...")
pycolmap.match_exhaustive(database_path=DB_PATH)

print("Step 4: Sparse reconstruction...")
maps = pycolmap.incremental_mapping(
    database_path=DB_PATH,
    image_path=FRAMES,
    output_path=SPARSE_OUT
)
print(f"Done! Reconstructed {len(maps)} model(s)")

print("Step 5: 3DGS Training...")
subprocess.run([
    "python", str(GS_REPO / "train.py"),
    "-s", str(Path(".").resolve()),   # pipeline/ folder as source
    "-m", str(MODEL_OUT.resolve()),
    "--iterations", "7000"            # use 7000 for a quick demo, 30000 for quality
], check=True)

print(f"Training done! Model saved to {MODEL_OUT}")