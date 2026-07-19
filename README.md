# EthnoVerse: A Digital Framework for Cultural Archiving

A full-stack digital archival platform documenting Pakistan's Indigenous tribal communities through searchable multimedia, paired with an experimental 3D Gaussian Splatting pipeline for immersive virtual tours of community environments.

**Team:** Maria Adnan, Sara Baloch, Afifah Uzair — Dhanani School of Science and Engineering, Habib University
**Supervisor:** Dr. Syeda Saleha Raza
**Status:** Bachelor's Kaavish (capstone) project, Spring 2022–2026

---

## Overview

Indigenous tribal communities in Pakistan are largely absent from the country's archival infrastructure — existing institutions like the Citizens Archive of Pakistan and the Punjab Digital Library hold colonial, bureaucratic, or purely textual records, with little to no multimedia documentation of contemporary tribal life. This gap surfaced directly out of a Tehqiq 2025 ethnographic study on tattoo traditions among Sindh's Indigenous Hindu tribes, where the team found living cultural practices largely undocumented in any public or scholarly archive.

EthnoVerse addresses this with a web-based repository for text, images, oral histories, and video, organized through searchable metadata — plus an experimental module that reconstructs physical community spaces in 3D using **3D Gaussian Splatting (3DGS)**, letting users take immersive, low-latency virtual tours. The proof-of-concept dataset documents the Kolhi community in Tharparkar.

## Key Features

- **Public archive** — browse communities, search/filter by keyword, tag, media type, or date; view media detail pages with transcripts for audio/oral history content
- **3D virtual tours** — navigable, real-time-rendered reconstructions of community environments, embedded directly in the browser via Three.js
- **Admin console** — secure authenticated uploads, metadata editing, content moderation, and audit logging
- **Ethical-by-design metadata** — consent documentation is required before any community media is published

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Tailwind |
| Backend | Node.js + Express (RESTful API, JWT auth) |
| Database | Supabase |
| Media storage | Cloud object storage (Cloudinary) |
| 3D reconstruction | Python service — COLMAP (camera pose / SfM) + 3D Gaussian Splatting |
| 3D rendering | Three.js |
| Search | Full-text indexing over metadata + transcripts |

## System Architecture

```
User Layer (Public / Administrator)
        │  HTTPS
        ▼
Frontend (React.js + Tailwind) — Web Interface, Search & Filter, Admin Dashboard
        │  REST API
        ▼
Backend (Node.js + Express) — API Gateway, Media Controller, JWT Auth, Metadata Manager
        │                              │
        ▼                              ▼
Database (Supabase)          Media Storage (Cloudinary)
        │
        ▼
3D Reconstruction Engine (Python: COLMAP + 3DGS) ──▶ Three.js viewer (frontend)
```

Uploads trigger an async pipeline: transcoding/thumbnailing → speech-to-text transcript generation → search indexing → (optionally) a 3DGS scene build job on a GPU worker, with a 360° panoramic fallback if reconstruction fails or resources are constrained.

## 3D Reconstruction Pipeline

Originally prototyped with **NeRF** (Neural Radiance Fields), the team pivoted to **3D Gaussian Splatting** after finding NeRF's training time and rendering latency incompatible with real-time, web-based deployment.

1. **Capture** — 20–200 overlapping multi-angle photographs of a community site
2. **Pose estimation** — Structure-from-Motion via COLMAP produces camera intrinsics/extrinsics and a sparse point cloud
3. **Initialization** — sparse point cloud seeds the initial set of Gaussian primitives
4. **Optimization** — Gaussian parameters (position, covariance, color, opacity) are optimized via gradient descent to minimize photometric reconstruction error
5. **Rendering** — rasterization-based alpha compositing (not ray marching) enables real-time playback at 30–60 FPS in-browser

## Data Model

Core entities: `User`, `Community`, `MediaItem`, `Transcript`, `Scene3D`, `AuditLog` — full attribute/method breakdown is in the report's SDS chapter. Notably, every `MediaItem` carries a `consentDocUri` and `visible` flag, and every mutating action is written to `AuditLog` for accountability.

## Repository Structure

*(inferred from system architecture — adjust to match your actual folders)*

```
ethnoverse/
├── frontend/          # React.js client (web portal + admin dashboard)
├── backend/           # Node.js + Express REST API
├── reconstruction/    # Python 3DGS/COLMAP reconstruction service
├── docs/              # SRS, SDS, diagrams
└── report/            # Kaavish report (this project's full writeup)
```

## Getting Started

```bash
git clone https://github.com/habib-university/Kaavish-Template.git
cd Kaavish-Template

# backend
cd backend && npm install && npm run dev

# frontend
cd ../frontend && npm install && npm run dev

# 3D reconstruction service
cd ../reconstruction && pip install -r requirements.txt
python reconstruct.py --images ./sample_images --output ./scenes/kolhi
```

A mid-range GPU (e.g., NVIDIA RTX 3060 or equivalent) is recommended for running the reconstruction service.

## Evaluation & Results

The system was evaluated on reconstruction quality, rendering performance, scene load time, search accuracy, and interface usability. 3DGS outperformed the initial NeRF prototype specifically on rendering speed and interactivity, which was the deciding factor for a web-deployed, user-facing tool.

## Limitations & Future Work

- Currently scoped to a single community (Kolhi); multi-community scaling needs more robust indexing and storage
- 3D reconstruction is GPU-bound and doesn't yet handle dynamic scenes or moving subjects well
- Planned: mobile-based field data collection, AI-assisted tagging/semantic search, VR/AR tour support, and community-driven upload/curation with consent-management dashboards

## Novelty

To the team's knowledge, this is Pakistan's first searchable multimedia archive specifically for Indigenous communities, and one of the first applications of Gaussian Splatting within a cultural-heritage archival workflow — combining ethnographic fieldwork methodology with full-stack engineering and computer vision.

## Acknowledgments

Developed as a Kaavish capstone project under Dr. Syeda Saleha Raza, Habib University. Grounded in fieldwork and consent-based data collection with the Kolhi community of Tharparkar, and informed by a Tehqiq 2025 ethnographic study on tattoo traditions among Sindh's Indigenous Hindu tribes.

## Selected References

- Mildenhall, B., et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis. *ECCV*.
- Flinn, A. (2011). Archival Activism: Independent and Community-Led Archives. *Archival Science*, 11(1), 1–23.
- The 1947 Partition Archive — https://www.1947partitionarchive.org/
- Citizens Archive of Pakistan — https://citizensarchive.org/

Full reference list and citations are in the project report.
