# pipeline.py  –  Modal GPU worker
# Deploy with:  modal deploy pipeline.py
# Supabase Database Webhook (model_jobs INSERT) → this webhook → T4 GPU runs pipeline

import os
import subprocess
from pathlib import Path

import modal

volume = modal.Volume.from_name("ethnoverse-ply-storage", create_if_missing=True)
image = (
    modal.Image.from_registry(
        "nvidia/cuda:11.8.0-devel-ubuntu22.04",
        add_python="3.11",
    )
    .env({
        "CUDA_HOME": "/usr/local/cuda",
        "TORCH_CUDA_ARCH_LIST": "7.5",
    })
    .apt_install(
        "ffmpeg",
        "colmap",
        "git",
        "build-essential",
        "cmake",
        "ninja-build",
        "libgl1",
        "libglib2.0-0",
        "clang",
    )
    .run_commands(
        "pip install setuptools>=68 wheel packaging",
        "pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 --index-url https://download.pytorch.org/whl/cu118",
        "pip install numpy==1.26.4 supabase cloudinary requests pycolmap plyfile tqdm Pillow scipy fastapi",
        "git clone --recursive https://github.com/graphdeco-inria/gaussian-splatting /opt/gaussian-splatting",
        "pip install setuptools>=68 wheel",
        "pip install numpy==1.26.4 supabase cloudinary requests pycolmap plyfile tqdm Pillow scipy fastapi opencv-python-headless",
        "TORCH_CUDA_ARCH_LIST='7.5' pip install --no-build-isolation /opt/gaussian-splatting/submodules/diff-gaussian-rasterization",
        "TORCH_CUDA_ARCH_LIST='7.5' pip install --no-build-isolation /opt/gaussian-splatting/submodules/simple-knn",
    )
)

app = modal.App("ethnoverse-3dgs", image=image)
secrets = [modal.Secret.from_name("ethnoverse-secrets")]


def update_job(supabase, job_id: str, **kwargs):
    supabase.table("model_jobs").update(kwargs).eq("id", job_id).execute()


@app.function(
    gpu="T4",
    timeout=60 * 120,           # bumped to 120 min — 30k iterations takes longer
    secrets=secrets,
    ephemeral_disk=524288,
    volumes={"/mnt/ply_storage": volume},
)
def run_pipeline(job_id: str, video_url: str, object_name: str, community_id: str):
    import shutil
    import requests
    import cloudinary
    import cloudinary.uploader
    import pycolmap
    from supabase import create_client

    supabase = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_KEY"],
    )
    cloudinary.config(
        cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
        api_key=os.environ["CLOUDINARY_API_KEY"],
        api_secret=os.environ["CLOUDINARY_API_SECRET"],
    )

    GS_REPO = Path("/opt/gaussian-splatting")

    try:
        # ── Step 1: Setup folders (5%) ─────────────────────────────────────────
        update_job(supabase, job_id, status="processing", progress=5, message="Setting up folders")

        BASE       = Path("/tmp/scene/pipeline")
        FRAMES     = BASE / "images"
        SPARSE_OUT = BASE / "sparse"
        DB_PATH    = BASE / f"colmap/{object_name}/database.db"
        MODEL_OUT  = Path(f"/tmp/output/{object_name}")
        VIDEO_PATH = BASE / f"{object_name}.mp4"

        for folder in [FRAMES, SPARSE_OUT, DB_PATH.parent, MODEL_OUT]:
            folder.mkdir(parents=True, exist_ok=True)
        if DB_PATH.exists():
            DB_PATH.unlink()

        # ── Step 2: Download video (10%) ───────────────────────────────────────
        update_job(supabase, job_id, progress=10, message="Downloading video")

        r = requests.get(video_url, stream=True)
        r.raise_for_status()
        with open(VIDEO_PATH, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Downloaded video → {VIDEO_PATH}")

        # ── Step 3: Extract frames (15%) ───────────────────────────────────────
        # FIX #2: bumped fps from 5 → 12 for better COLMAP overlap on handheld video
        update_job(supabase, job_id, progress=15, message="Extracting frames")

        subprocess.run([
            "ffmpeg", "-i", str(VIDEO_PATH),
            "-vf", "fps=12",                    # was fps=5 — too sparse for handheld rotation
            str(FRAMES / "frame_%04d.jpg"),
        ], check=True)

        frame_count = len(list(FRAMES.glob("*.jpg")))
        print(f"Extracted {frame_count} frames")

        # Copy frames to input/ (gaussian-splatting expects this layout)
        input_path = BASE / "input"
        if not input_path.exists():
            shutil.copytree(str(FRAMES), str(input_path))

        # ── Step 4: COLMAP feature extraction (25%) ────────────────────────────
        update_job(supabase, job_id, progress=25, message="Running COLMAP feature extraction")
        pycolmap.extract_features(database_path=DB_PATH, image_path=FRAMES)

        # ── Step 5: Match features (40%) ──────────────────────────────────────
        update_job(supabase, job_id, progress=40, message="Matching features")
        pycolmap.match_exhaustive(database_path=DB_PATH)

        # ── Step 6: Sparse reconstruction (55%) ───────────────────────────────
        update_job(supabase, job_id, progress=55, message="Sparse reconstruction")
        maps = pycolmap.incremental_mapping(
            database_path=DB_PATH,
            image_path=FRAMES,
            output_path=SPARSE_OUT,
        )
        print(f"Reconstructed {len(maps)} model(s)")

        # FIX #4: validate COLMAP actually registered enough images
        if not maps:
            raise RuntimeError("COLMAP produced no reconstructions")

        best_map = max(maps.values(), key=lambda m: len(m.images))
        registered = len(best_map.images)
        print(f"COLMAP registered {registered} images (best reconstruction)")

        if registered < 10:
            raise RuntimeError(
                f"COLMAP only registered {registered} images — "
                "reconstruction too sparse to train. Try better lighting or slower camera movement."
            )
        print(f"COLMAP registered {registered} images")
        if not maps or registered < 10:
            raise RuntimeError(
                f"COLMAP only registered {registered} images — "
                "reconstruction too sparse to train. Try better lighting or slower camera movement."
            )

        # ── Step 7: Undistort images (60%) ────────────────────────────────────
        update_job(supabase, job_id, progress=60, message="Converting COLMAP output")

        UNDISTORTED_OUT = BASE / "undistorted"
        UNDISTORTED_OUT.mkdir(parents=True, exist_ok=True)

        result = subprocess.run([
            "colmap", "image_undistorter",
            "--image_path",  str(input_path),
            "--input_path",  str(SPARSE_OUT / "0"),
            "--output_path", str(UNDISTORTED_OUT),
            "--output_type", "COLMAP",
        ], capture_output=True, text=True)

        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr[-1000:])
        if result.returncode != 0:
            raise Exception(f"image_undistorter failed: {result.stderr[-500:]}")

        UNDIST_SPARSE   = UNDISTORTED_OUT / "sparse"
        UNDIST_SPARSE_0 = UNDIST_SPARSE / "0"
        UNDIST_SPARSE_0.mkdir(parents=True, exist_ok=True)

        for f in ["cameras.bin", "images.bin", "points3D.bin"]:
            src = UNDIST_SPARSE / f
            dst = UNDIST_SPARSE_0 / f
            if src.exists() and not dst.exists():
                shutil.copy(str(src), str(dst))
                print(f"Copied {f} → sparse/0/")

        subprocess.run([
            "colmap", "model_converter",
            "--input_path",  str(UNDIST_SPARSE_0),
            "--output_path", str(UNDIST_SPARSE_0),
            "--output_type", "TXT",
        ], check=True)

        # ── Step 8: Train 3DGS (65%) ───────────────────────────────────────────
        # FIX #1: bumped iterations 7000 → 30000 (full training — pruning/densification complete)
        # FIX #3: explicit -s path pointing to undistorted output, not ambiguous cwd
        update_job(supabase, job_id, progress=65, message="Training 3DGS (~15-20 min)")

        result = subprocess.run([
            "python", str(GS_REPO / "train.py"),
            "-s", str(UNDISTORTED_OUT),         # FIX #3: explicit, correct source path
            "-m", str(MODEL_OUT),
            "--iterations", "30000",             # FIX #1: was 7000 — floaters never pruned at 7k
        ], capture_output=True, text=True)

        print("STDOUT:", result.stdout[-2000:])
        print("STDERR:", result.stderr[-500:])
        if result.returncode != 0:
            raise Exception(f"train.py failed: {result.stderr[-500:]}")

        print("✅ Training complete!")

        # ── Step 9: Save .ply to Modal Volume (90%) ───────────────────────────
        update_job(supabase, job_id, progress=90, message="Saving model to storage")

        ply_path = MODEL_OUT / "point_cloud" / "iteration_30000" / "point_cloud.ply"
        if not ply_path.exists():
            # fallback: find whatever iteration folder was created
            candidates = list((MODEL_OUT / "point_cloud").glob("iteration_*/*.ply"))
            if not candidates:
                raise FileNotFoundError(f"No .ply found under {MODEL_OUT / 'point_cloud'}")
            ply_path = sorted(candidates)[-1]   # take highest iteration
            print(f"Using fallback ply: {ply_path}")

        dest_dir = Path(f"/mnt/ply_storage/{object_name}")
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / "point_cloud.ply"
        shutil.copy(str(ply_path), str(dest_path))
        volume.commit()

        model_path = f"{object_name}/point_cloud.ply"

        # ── Step 10: Mark done (100%) ──────────────────────────────────────────
        update_job(supabase, job_id,
                   status="done", progress=100,
                   message="Complete", model_url=model_path)

        supabase.table("communities").update({
            "tour_url": model_path
        }).eq("community_id", community_id).execute()

        print(f"✅ Done! tour_url written to community {community_id}")

    except Exception as e:
        update_job(supabase, job_id,
                   status="failed",
                   message=f"Error: {str(e)[:300]}")
        raise


@app.function(
    volumes={"/mnt/ply_storage": volume},
    secrets=secrets,
)
@modal.web_endpoint(method="GET")
def download_ply(object_name: str):
    from fastapi import Response
    ply_path = Path(f"/mnt/ply_storage/{object_name}/point_cloud.ply")
    if not ply_path.exists():
        return Response(content="Not found", status_code=404)

    data = ply_path.read_bytes()
    return Response(
        content=data,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{object_name}_point_cloud.ply"',
            "Access-Control-Allow-Origin": "*",
        }
    )


# ── Webhook endpoint ───────────────────────────────────────────────────────────
@app.function(secrets=secrets)
@modal.web_endpoint(method="POST")
def webhook(payload: dict):
    record = payload.get("record", {})

    job_id       = record.get("id")
    video_url    = record.get("video_url")
    object_name  = record.get("object_name")
    community_id = record.get("community_id")
    status       = record.get("status")

    if status != "queued":
        return {"ok": True, "skipped": True, "reason": f"status={status}"}

    if not all([job_id, video_url, object_name, community_id]):
        return {"ok": False, "error": "Missing required fields", "record": record}

    run_pipeline.spawn(
        job_id=job_id,
        video_url=video_url,
        object_name=object_name,
        community_id=community_id,
    )

    return {"ok": True, "job_id": job_id, "message": "Pipeline started on T4"}