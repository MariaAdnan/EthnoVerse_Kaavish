// src/app/components/ModelProcessing.tsx
import React, { useEffect, useState } from 'react';
import { getJobById, subscribeToJobUpdates, ModelJob } from '../../services/jobs';

interface ModelProcessingProps {
  onNavigate: (view: string) => void;
  view: string; // e.g. "model-processing:2361398f-e50d-..."
}

export default function ModelProcessing({ onNavigate, view }: ModelProcessingProps) {
  const jobId = view.startsWith('model-processing:') ? view.split(':')[1] : null;

  const [job, setJob] = useState<ModelJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('No job ID provided.');
      setLoading(false);
      return;
    }

    let channel: Awaited<ReturnType<typeof subscribeToJobUpdates>> | null = null;

    async function init() {
      try {
        const initialJob = await getJobById(jobId!);
        setJob(initialJob);
        setLoading(false);

        channel = await subscribeToJobUpdates(jobId!, (updatedJob) => {
          setJob(updatedJob);
        });
      } catch (err) {
        console.error('Failed to load job:', err);
        setError('Could not load job details.');
        setLoading(false);
      }
    }

    init();

    return () => {
      channel?.unsubscribe();
    };
  }, [jobId]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm border border-[#1A1A1A]/10 rounded-lg p-12 shadow-lg text-center">
          <div className="flex justify-center mb-8">
            <div className="w-8 h-8 border-2 border-[#8B4513] border-t-transparent rounded-full animate-spin" />
          </div>
          <p style={{ fontFamily: 'Space Mono, monospace' }} className="text-[#1A1A1A]">
            Loading job details...
          </p>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm border border-[#1A1A1A]/10 rounded-lg p-12 shadow-lg text-center">
          <p className="text-red-600 mb-6" style={{ fontFamily: 'Space Mono, monospace' }}>
            {error ?? 'Job not found.'}
          </p>
          <button
            onClick={() => onNavigate('admin')}
            className="px-6 py-2 bg-[#1A1A1A] text-[#F5F1E8] rounded hover:bg-[#1A1A1A]/90 transition-colors"
            style={{ fontFamily: 'Space Mono, monospace' }}
          >
            ← BACK TO DASHBOARD
          </button>
        </div>
      </div>
    );
  }

  const isComplete   = job.status === 'completed' || job.status === ('done' as string);
  const isFailed     = job.status === 'failed';
  const isProcessing = !isComplete && !isFailed;

  // Steps mapped exactly to the progress values set in pipeline.ipynb
  const steps: { label: string; at: number }[] = [
    { label: 'Setting up folders',            at: 5   },
    { label: 'Downloading video',             at: 10  },
    { label: 'Extracting frames',             at: 15  },
    { label: 'COLMAP feature extraction',     at: 25  },
    { label: 'Matching features',             at: 40  },
    { label: 'Sparse reconstruction',         at: 55  },
    { label: 'Converting COLMAP output',      at: 60  },
    { label: 'Training 3DGS (~4 min)',        at: 65  },
    { label: 'Uploading model to Cloudinary', at: 90  },
    { label: 'Complete',                      at: 100 },
  ];

  function stepStatus(at: number, nextAt: number) {
    if (isFailed)                return 'error';
    if (job!.progress >= nextAt) return 'done';
    if (job!.progress >= at)     return 'active';
    return 'pending';
  }

  // ── Processing / Failed view ───────────────────────────────────────────────
  if (isProcessing || isFailed) {
    return (
      <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6">
        <div className="fixed top-8 left-8 z-50">
          <button
            onClick={() => onNavigate('admin')}
            className="text-[#1A1A1A] hover:text-[#8B4513] transition-colors"
            style={{ fontFamily: 'Space Mono, monospace' }}
          >
            <span className="text-sm">← DASHBOARD</span>
          </button>
        </div>

        <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm border border-[#1A1A1A]/10 rounded-lg p-12 shadow-lg">

          {/* Technical Animation */}
          <div className="flex justify-center mb-8">
            {isFailed ? (
              <div className="w-20 h-20 rounded-full border-2 border-red-400 flex items-center justify-center">
                <span className="text-red-500 text-3xl">✕</span>
              </div>
            ) : (
              <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-2 border-[#1A1A1A]/20 rounded-lg animate-[spin_4s_linear_infinite]">
                  <div className="absolute top-0 left-0 w-3 h-3 bg-[#8B4513] rounded-full"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 bg-[#8B4513] rounded-full"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 bg-[#8B4513] rounded-full"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#8B4513] rounded-full"></div>
                </div>
                <div className="absolute inset-2 border border-[#1A1A1A]/10 rounded-lg animate-[spin_6s_linear_infinite_reverse]"></div>
              </div>
            )}
          </div>

          {/* Heading */}
          <h1 className="text-5xl text-center text-[#1A1A1A] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            {isFailed ? 'Processing Failed' : 'Generating Virtual Space'}
          </h1>

          {/* Status Text with Blinking Cursor */}
          <p className="text-center text-[#1A1A1A] mb-8" style={{ fontFamily: 'Space Mono, monospace' }}>
            {isFailed
              ? (job.message ?? 'An error occurred during processing.')
              : <>{job.message ?? 'Processing…'}<span className="animate-pulse">_</span></>
            }
          </p>

          {/* Progress bar */}
          {!isFailed && (
            <div className="mb-8">
              <div className="flex justify-between text-xs mb-2 text-[#1A1A1A]/60" style={{ fontFamily: 'Space Mono, monospace' }}>
                <span>PROGRESS</span>
                <span>{job.progress}%</span>
              </div>
              <div className="h-1.5 bg-[#1A1A1A]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8B4513] rounded-full transition-all duration-700"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress Steps */}
          <div className="space-y-3 mb-8" style={{ fontFamily: 'Space Mono, monospace' }}>
            {steps.map(({ label, at }, i) => {
              const nextAt = steps[i + 1]?.at ?? 101;
              const s = stepStatus(at, nextAt);
              return (
                <div key={label} className="flex items-center gap-3 text-[#1A1A1A]">
                  {s === 'done'    && <span className="text-green-600">[✓]</span>}
                  {s === 'active'  && <span className="text-[#8B4513] animate-spin inline-block">⟳</span>}
                  {s === 'pending' && <span className="text-[#1A1A1A]/30">[ ]</span>}
                  {s === 'error'   && <span className="text-red-500">[✕]</span>}
                  <span className={s === 'pending' ? 'opacity-40' : ''}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Warning Box */}
          {!isFailed && (
            <div className="bg-[#F5F1E8] border border-[#1A1A1A]/20 rounded p-4">
              <p className="text-sm text-[#1A1A1A]" style={{ fontFamily: 'Space Mono, monospace' }}>
                ⓘ You may safely close this window. The archive will update automatically when rendering is complete.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }
// ── Completed view ─────────────────────────────────────────────────────────
const downloadUrl = job.model_url
  ? `https://afifah-uzair-19--ethnoverse-3dgs-download-ply.modal.run?object_name=${job.object_name}`
  : null;
  return (
    <div className="min-h-screen bg-[#F5F1E8] flex items-center justify-center p-6">
      <div className="fixed top-8 left-8 z-50">
        <button
          onClick={() => onNavigate('admin')}
          className="text-[#1A1A1A] hover:text-[#8B4513] transition-colors"
          style={{ fontFamily: 'Space Mono, monospace' }}
        >
          <span className="text-sm">← DASHBOARD</span>
        </button>
      </div>

      <div className="max-w-2xl w-full bg-white/80 backdrop-blur-sm border border-[#1A1A1A]/10 rounded-lg p-12 shadow-lg">

        {/* 3D Cube Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 border-2 border-[#8B4513] rounded-lg transform rotate-45">
              <div className="absolute inset-4 border border-[#8B4513]/50 rounded-lg"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-[#8B4513]/10 backdrop-blur-sm rounded"></div>
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl text-center text-[#1A1A1A] mb-8" style={{ fontFamily: 'Playfair Display, serif' }}>
          Reconstruction Complete
        </h1>

        {/* File Details Box */}
        <div className="bg-[#F5F1E8] border-2 border-[#1A1A1A] rounded p-6 mb-8" style={{ fontFamily: 'Space Mono, monospace' }}>
          <div className="space-y-2 text-[#1A1A1A]">
            <div className="flex justify-between">
              <span className="text-[#1A1A1A]/60">FILENAME:</span>
              <span>{job.object_name}.ply</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1A1A1A]/60">OBJECT:</span>
              <span>{job.object_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#1A1A1A]/60">ITERATIONS:</span>
              <span>7,000</span>
            </div>
            {job.model_url && (
              <div className="flex justify-between gap-4">
                <span className="text-[#1A1A1A]/60 shrink-0">MODEL URL:</span>
                <a
                  href={job.model_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B4513] hover:underline text-xs truncate text-right"
                >
                  {job.model_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
  {downloadUrl && (
    <a
      href={downloadUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="px-8 py-3 bg-[#1A1A1A] text-[#F5F1E8] rounded hover:bg-[#1A1A1A]/90 transition-colors"
      style={{ fontFamily: 'Space Mono, monospace' }}
    >
      DOWNLOAD .PLY FILE
    </a>
  )}
</div>
      </div>
    </div>
  );
}