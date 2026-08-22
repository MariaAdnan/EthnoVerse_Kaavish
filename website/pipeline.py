# pipeline.py  –  Modal GPU worker
# Deploy with:  modal deploy pipeline.py
# Supabase Database Webhook (model_jobs INSERT) → this webhook → T4 GPU runs pipeline

import hmac
import os
import shutil
import subprocess
import time
from pathlib import Path

import modal
from fastapi import HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from pipeline_security import (
    model_path,
    validate_object_name,
    validate_source_url,
    validate_uuid,
    validated_image_members,
)

MAX_DOWNLOAD_BYTES = 300 * 1024 * 1024
DEFAULT_SOURCE_HOSTS = {"res.cloudinary.com"}

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
        "pip install setuptools==80.9.0 wheel==0.45.1 packaging==25.0",
        "pip install torch==2.1.0+cu118 torchvision==0.16.0+cu118 --index-url https://download.pytorch.org/whl/cu118",
        "pip install numpy==1.26.4 supabase==2.18.1 requests==2.32.5 pycolmap==3.13.0 plyfile==1.1.3 tqdm==4.67.1 Pillow==11.3.0 scipy==1.16.2 fastapi==0.116.1 opencv-python-headless==4.11.0.86",
        "git clone https://github.com/graphdeco-inria/gaussian-splatting /opt/gaussian-splatting",
        "cd /opt/gaussian-splatting && git checkout 54c035f7834b564019656c3e3fcc3646292f727d && git submodule update --init --recursive submodules/diff-gaussian-rasterization submodules/simple-knn",
        "TORCH_CUDA_ARCH_LIST='7.5' pip install --no-build-isolation /opt/gaussian-splatting/submodules/diff-gaussian-rasterization",
        "TORCH_CUDA_ARCH_LIST='7.5' pip install --no-build-isolation /opt/gaussian-splatting/submodules/simple-knn",
    )
)

app = modal.App("ethnoverse-3dgs", image=image)
secrets = [modal.Secret.from_name("ethnoverse-secrets")]


def update_job(supabase, job_id: str, **kwargs):
    supabase.table("model_jobs").update(kwargs).eq("id", job_id).execute()


def allowed_source_hosts() -> set[str]:
    configured = os.environ.get("RECONSTRUCTION_SOURCE_HOSTS", "")
    return {host.strip() for host in configured.split(",") if host.strip()} or DEFAULT_SOURCE_HOSTS


def supabase_service_key() -> str:
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    if not key:
        raise RuntimeError("Supabase worker credentials are not configured")
    return key


def validate_job_inputs(job_id: str, images_zip_url: str, object_name: str, community_id: str):
    return (
        validate_uuid(job_id, "Job"),
        validate_source_url(images_zip_url, allowed_source_hosts()),
        validate_object_name(object_name),
        validate_uuid(community_id, "Community"),
    )


def valid_download_signature(object_name: str, expires: int, signature: str) -> bool:
    secret = os.environ.get("MODEL_DOWNLOAD_SIGNING_SECRET", "")
    if not secret or expires < int(time.time()) or expires > int(time.time()) + 600:
        return False
    expected = hmac.new(
        secret.encode(), f"{object_name}:{expires}".encode(), "sha256"
    ).hexdigest()
    return hmac.compare_digest(signature, expected)


@app.function(
    gpu="T4",
    timeout=60 * 120,           # bumped to 120 min — 30k iterations takes longer
    secrets=secrets,
    ephemeral_disk=524288,
    volumes={"/mnt/ply_storage": volume},
)
def run_pipeline(job_id: str, images_zip_url: str, object_name: str, community_id: str):
    import zipfile
    import warnings
    import requests
    import pycolmap
    from PIL import Image
    from supabase import create_client

    supabase = create_client(
        os.environ["SUPABASE_URL"],
        supabase_service_key(),
    )
    job_id, images_zip_url, object_name, community_id = validate_job_inputs(
        job_id, images_zip_url, object_name, community_id
    )
    GS_REPO = Path("/opt/gaussian-splatting")
    BASE = Path("/tmp/ethnoverse") / job_id
    MODEL_OUT = Path("/tmp/output") / job_id

    try:
        # ── Step 1: Setup folders (5%) ─────────────────────────────────────────
        update_job(supabase, job_id, status="processing", progress=5, message="Setting up folders")

        FRAMES     = BASE / "images"
        SPARSE_OUT = BASE / "sparse"
        DB_PATH    = BASE / f"colmap/{object_name}/database.db"
        ZIP_PATH   = BASE / f"{object_name}.zip"

        for folder in [FRAMES, SPARSE_OUT, DB_PATH.parent, MODEL_OUT]:
            folder.mkdir(parents=True, exist_ok=True)
        if DB_PATH.exists():
            DB_PATH.unlink()

        # ── Step 2: Download zip (10%) ─────────────────────────────────────────
        update_job(supabase, job_id, progress=10, message="Downloading images zip")

        r = requests.get(
            images_zip_url,
            stream=True,
            timeout=(10, 120),
            allow_redirects=False,
        )
        r.raise_for_status()
        content_length = int(r.headers.get("content-length", "0") or 0)
        if content_length > MAX_DOWNLOAD_BYTES:
            raise RuntimeError("Image ZIP exceeds the compressed-size limit")
        downloaded = 0
        with open(ZIP_PATH, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                downloaded += len(chunk)
                if downloaded > MAX_DOWNLOAD_BYTES:
                    raise RuntimeError("Image ZIP exceeds the compressed-size limit")
                f.write(chunk)
        print(f"Downloaded zip → {ZIP_PATH}")

        # ── Step 3: Extract images (15%) ───────────────────────────────────────
        update_job(supabase, job_id, progress=15, message="Extracting images")

        Image.MAX_IMAGE_PIXELS = 50_000_000
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        with zipfile.ZipFile(ZIP_PATH, "r") as zf:
            for info in validated_image_members(zf.infolist()):
                filename = Path(info.filename).name
                dest = FRAMES / filename
                with zf.open(info) as src, open(dest, "wb") as dst:
                    shutil.copyfileobj(src, dst, length=1024 * 1024)
                with Image.open(dest) as image_file:
                    image_file.verify()

        frame_count = len(list(FRAMES.glob("*")))
        print(f"Extracted {frame_count} images")

        if frame_count < 10:
            raise RuntimeError(
                f"Only {frame_count} images found in zip — need at least 10 for a good reconstruction."
            )

        # Copy images to input/ (gaussian-splatting expects this layout)
        input_path = BASE / "input"
        if not input_path.exists():
            shutil.copytree(str(FRAMES), str(input_path))

        # ── Step 4: COLMAP feature extraction (25%) ────────────────────────────
        update_job(supabase, job_id, progress=25, message="Running COLMAP feature extraction")
        pycolmap.extract_features(database_path=DB_PATH, image_path=FRAMES)

        # ── Step 5: Match features (40%) ──────────────────────────────────────
        update_job(supabase, job_id, progress=40, message="Matching features")
        pycolmap.match_exhaustive(database_path=DB_PATH)

        # ── Step 6: Sparse reconstruction (55%) ───────────────────────────────────────
        update_job(supabase, job_id, progress=55, message="Sparse reconstruction")
        maps = pycolmap.incremental_mapping(
            database_path=DB_PATH,
            image_path=FRAMES,
            output_path=SPARSE_OUT,
        )
        print(f"Reconstructed {len(maps)} model(s)")

        if not maps:
            raise RuntimeError("COLMAP produced no reconstructions")

        best_key = max(maps.keys(), key=lambda k: len(maps[k].images))
        best_map = maps[best_key]
        registered = len(best_map.images)
        print(f"Best reconstruction: key={best_key}, registered={registered} images")

        if registered < 10:
            raise RuntimeError(
                f"COLMAP only registered {registered} images — "
                "reconstruction too sparse to train. Try better lighting or slower camera movement."
            )

        # ── Step 7: Undistort images (60%) ────────────────────────────────────────────
        update_job(supabase, job_id, progress=60, message="Converting COLMAP output")

        UNDISTORTED_OUT = BASE / "undistorted"
        UNDISTORTED_OUT.mkdir(parents=True, exist_ok=True)

        result = subprocess.run([
            "colmap", "image_undistorter",
            "--image_path",  str(input_path),
            "--input_path",  str(SPARSE_OUT / str(best_key)),  # ← uses best reconstruction
            "--output_path", str(UNDISTORTED_OUT),
            "--output_type", "COLMAP",
        ], capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"image_undistorter failed: {result.stderr[-500:]}")
        # ── Step 7b: Convert sparse model to text format ──────────────────────────────
        # Debug: print what image_undistorter actually created
        print("=== UNDISTORTED_OUT contents ===")
        for root, dirs, files in os.walk(str(UNDISTORTED_OUT)):
            print(root, files)

        # image_undistorter outputs sparse/ directly (no numbered subfolder)
        # but model_converter needs the folder containing .bin files
        sparse_bin_dir = UNDISTORTED_OUT / "sparse"
        if (sparse_bin_dir / "cameras.bin").exists():
            # Files are directly in sparse/ — convert in place
            converter_input = str(sparse_bin_dir)
            converter_output = str(sparse_bin_dir)
        elif (sparse_bin_dir / "0" / "cameras.bin").exists():
            # Files are in sparse/0/
            converter_input = str(sparse_bin_dir / "0")
            converter_output = str(sparse_bin_dir / "0")
        else:
            raise FileNotFoundError(f"Cannot find cameras.bin under {sparse_bin_dir}")

        result_conv = subprocess.run([
            "colmap", "model_converter",
            "--input_path",  converter_input,
            "--output_path", converter_output,
            "--output_type", "TXT",
        ], capture_output=True, text=True)

        print("Converter STDOUT:", result_conv.stdout)
        print("Converter STDERR:", result_conv.stderr)
        if result_conv.returncode != 0:
            raise RuntimeError(f"model_converter failed: {result_conv.stderr}")

        # train.py always looks for sparse/0/images.txt — ensure that structure exists
        target_sparse_0 = UNDISTORTED_OUT / "sparse" / "0"
        if not target_sparse_0.exists() and (UNDISTORTED_OUT / "sparse" / "images.txt").exists():
            # Files ended up directly in sparse/ — move them into sparse/0/
            target_sparse_0.mkdir(parents=True, exist_ok=True)
            for f in (UNDISTORTED_OUT / "sparse").iterdir():
                if f.is_file():
                    f.rename(target_sparse_0 / f.name)
            print("Moved sparse/*.txt → sparse/0/")
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
            ply_path = max(
                candidates,
                key=lambda candidate: int(
                    candidate.parent.name.removeprefix("iteration_")
                ),
            )
            print(f"Using fallback ply: {ply_path}")

        dest_dir = model_path(Path("/mnt/ply_storage"), object_name).parent
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest_path = dest_dir / "point_cloud.ply"
        shutil.copy(str(ply_path), str(dest_path))
        volume.commit()

        stored_model_path = f"{object_name}/point_cloud.ply"

        # ── Step 10: Mark done (100%) ──────────────────────────────────────────
        update_job(supabase, job_id,
                   status="done", progress=100,
                   message="Complete", model_url=stored_model_path)

        supabase.table("communities").update({
            "tour_url": stored_model_path
        }).eq("community_id", community_id).execute()

        print(f"✅ Done! tour_url written to community {community_id}")

    except Exception as e:
        update_job(supabase, job_id,
                   status="failed",
                   message=f"Error: {str(e)[:300]}")
        raise
    finally:
        shutil.rmtree(BASE, ignore_errors=True)
        shutil.rmtree(MODEL_OUT, ignore_errors=True)


@app.function(
    volumes={"/mnt/ply_storage": volume},
    secrets=secrets,
)
@modal.fastapi_endpoint(method="GET")
def download_ply(object_name: str, expires: int, signature: str):
    try:
        object_name = validate_object_name(object_name)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    if not valid_download_signature(object_name, expires, signature):
        raise HTTPException(status_code=401, detail="Invalid or expired download link")
    ply_path = model_path(Path("/mnt/ply_storage"), object_name)
    if not ply_path.exists():
        return Response(content="Not found", status_code=404)

    def iter_file():
        with ply_path.open("rb") as model_file:
            while chunk := model_file.read(1024 * 1024):
                yield chunk

    return StreamingResponse(
        iter_file(),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f'attachment; filename="{object_name}_point_cloud.ply"',
            "Content-Length": str(ply_path.stat().st_size),
            "Cache-Control": "private, no-store",
            "Access-Control-Allow-Origin": "*",
        }
    )


# ── Webhook endpoint ───────────────────────────────────────────────────────────
@app.function(secrets=secrets)
@modal.fastapi_endpoint(method="POST")
def webhook(request: Request, payload: dict):
    expected_secret = os.environ.get("WEBHOOK_SHARED_SECRET", "")
    if not expected_secret:
        raise HTTPException(
            status_code=503,
            detail="Webhook authentication is not configured",
        )

    provided_secret = request.headers.get("x-ethnoverse-webhook-secret", "")
    if not hmac.compare_digest(provided_secret, expected_secret):
        raise HTTPException(status_code=401, detail="Invalid webhook credentials")

    # Supabase sends `record: null` for DELETE webhooks.  Treat that exactly
    # like an absent record so this endpoint returns a useful validation error
    # rather than crashing while accessing `.get` below.
    record = payload.get("record") or {}

    job_id = record.get("id")
    images_zip_url = record.get("images_zip_url")
    object_name = record.get("object_name")
    community_id = record.get("community_id")
    status          = record.get("status")

    if status != "queued":
        return {"ok": True, "skipped": True, "reason": f"status={status}"}

    if not all([job_id, images_zip_url, object_name, community_id]):
        raise HTTPException(status_code=422, detail="Missing required record fields")

    try:
        job_id, images_zip_url, object_name, community_id = validate_job_inputs(
            job_id, images_zip_url, object_name, community_id
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    from supabase import create_client

    supabase = create_client(os.environ["SUPABASE_URL"], supabase_service_key())
    claim = (
        supabase.table("model_jobs")
        .update({"status": "processing", "progress": 1, "message": "Worker starting"})
        .eq("id", job_id)
        .eq("status", "queued")
        .execute()
    )
    if not claim.data:
        return {"ok": True, "skipped": True, "reason": "job already claimed"}

    try:
        run_pipeline.spawn(
            job_id=job_id,
            images_zip_url=images_zip_url,
            object_name=object_name,
            community_id=community_id,
        )
    except Exception as error:
        update_job(supabase, job_id, status="failed", message="Worker could not be started")
        raise HTTPException(status_code=503, detail="Worker could not be started") from error

    return {"ok": True, "job_id": job_id, "message": "Pipeline started on T4"}
