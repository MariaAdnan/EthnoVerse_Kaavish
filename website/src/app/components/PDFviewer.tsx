// src/app/components/PDFviewer.tsx
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getDocumentById } from "../../services/document";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PDFViewerProps {
  onNavigate: (view: string) => void;
  view: string; // "pdf" | "pdf:ID"
}

interface Doc {
  id: string | number;
  title: string;
  pdf_cloudinary_url: string;
  author?: string | null;
  created_at?: string | null;
  communities?: { name: string } | { name: string }[] | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function communityName(doc: Doc): string {
  if (!doc.communities) return "";
  if (Array.isArray(doc.communities)) return doc.communities[0]?.name ?? "";
  return doc.communities.name ?? "";
}

function archiveId(id: string | number): string {
  return `ARCHIVE-${String(id).padStart(3, "0")}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PDFViewer({ onNavigate, view }: PDFViewerProps) {
  const docId = view.startsWith("pdf:") ? view.split(":")[1] : null;

  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(!!docId);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  // Some browsers/environments block PDFs in <object>; we offer a fallback
  const [embedFailed, setEmbedFailed] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!docId) {
      setLoading(false);
      setError("No document specified.");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getDocumentById(docId)
      .then((data) => {
        if (cancelled) return;
        if (!data) { setError("Document not found."); return; }
        setDoc(data as Doc);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? "Failed to load document.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [docId]);

  // ── Zoom helpers ───────────────────────────────────────────────────────────
  const zoomIn  = () => setZoom((z) => Math.min(z + 25, 200));
  const zoomOut = () => setZoom((z) => Math.max(z - 25, 50));

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onNavigate("back");
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNavigate]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 bg-ink/95 z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-paper/60">
          <Loader2 className="w-10 h-10 animate-spin text-accent" />
          <p style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs tracking-widest">
            LOADING DOCUMENT...
          </p>
        </div>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error || !doc) {
    return (
      <div className="fixed inset-0 bg-ink/95 z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-paper/70 max-w-sm text-center px-6">
          <AlertCircle className="w-10 h-10 text-accent" />
          <p style={{ fontFamily: "'Playfair Display', serif" }} className="text-xl">
            Document unavailable
          </p>
          <p style={{ fontFamily: "'Space Mono', monospace" }} className="text-xs opacity-80">
            {error}
          </p>
          <button
            onClick={() => onNavigate("back")}
            className="mt-2 px-6 py-2 border border-paper/30 hover:border-accent transition-colors text-xs text-paper"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ← GO BACK
          </button>
        </div>
      </div>
    );
  }

  const community = communityName(doc);

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-ink/95 z-50 flex flex-col">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between gap-4 px-4 sm:px-6 py-4 border-b border-paper/20 flex-wrap sm:flex-nowrap"
      >
        {/* Title */}
        <div className="flex items-center gap-3 min-w-0">
          <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-paper shrink-0" />
          <div className="min-w-0">
            <h2
              className="text-paper text-base sm:text-xl mb-0.5 truncate"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              {doc.title}
            </h2>
            <p
              className="text-paper/60 text-xs truncate"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {archiveId(doc.id)} · PDF DOCUMENT
              {community ? ` · ${community.toUpperCase()}` : ""}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto shrink-0">

          {/* Zoom */}
          <div className="flex items-center gap-1.5 border border-paper/30 rounded px-2 sm:px-3 py-1.5">
            <button
              onClick={zoomOut}
              disabled={zoom <= 50}
              aria-label="Zoom out"
              className="text-paper hover:text-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span
              className="text-paper text-xs sm:text-sm min-w-[40px] text-center"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {zoom}%
            </span>
            <button
              onClick={zoomIn}
              disabled={zoom >= 200}
              aria-label="Zoom in"
              className="text-paper hover:text-accent transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Download */}
          <a
            href={doc.pdf_cloudinary_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 border border-paper/30 hover:border-accent hover:bg-accent/10 transition-colors text-paper"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">DOWNLOAD</span>
          </a>

          {/* Download icon-only on mobile */}
          <a
            href={doc.pdf_cloudinary_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download"
            className="sm:hidden w-10 h-10 flex items-center justify-center border border-paper/30 hover:border-accent hover:bg-accent/10 transition-colors text-paper"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Close */}
          <button
            onClick={() => onNavigate("back")}
            aria-label="Close"
            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-paper/30 hover:border-accent hover:bg-accent/10 transition-colors text-paper"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </motion.div>

      {/* ── PDF viewer area ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center bg-foreground/30"
      >
        <div
          className="relative shadow-2xl transition-all duration-300"
          style={{
            width: `${zoom}%`,
            minWidth: "320px",
            maxWidth: "1200px",
          }}
        >
          <AnimatePresence mode="wait">
            {/* ── Embedded PDF (preferred) ── */}
            {!embedFailed && (
              <motion.div
                key="embed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full"
                style={{ minHeight: "80vh" }}
              >
                {/*
                  <object> is more reliable than <iframe> for PDFs across
                  browsers. Cloudinary serves PDFs with the correct MIME type
                  so this works without extra query params.
                */}
                <object
                  data={doc.pdf_cloudinary_url}
                  type="application/pdf"
                  className="w-full bg-paper"
                  style={{ minHeight: "80vh", height: "80vh" }}
                  onError={() => setEmbedFailed(true)}
                  aria-label={doc.title}
                >
                  {/* Inner fallback if object element itself isn't supported */}
                  <FallbackView doc={doc} />
                </object>
              </motion.div>
            )}

            {/* ── Fallback: can't embed ── */}
            {embedFailed && (
              <motion.div
                key="fallback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-paper w-full"
              >
                <FallbackView doc={doc} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Footer metadata bar ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="border-t border-paper/20 px-4 sm:px-6 py-3 sm:py-4 bg-ink/90 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            {doc.author && (
              <>
                <div>
                  <p
                    className="text-paper/60 text-xs mb-1"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    AUTHOR
                  </p>
                  <p className="text-paper text-sm">{doc.author}</p>
                </div>
                <div className="h-8 w-px bg-paper/20 hidden sm:block" />
              </>
            )}
            <div>
              <p
                className="text-paper/60 text-xs mb-1"
                style={{ fontFamily: "'Space Mono', monospace" }}
              >
                UPLOADED
              </p>
              <p className="text-paper text-sm">{fmtDate(doc.created_at)}</p>
            </div>
            {community && (
              <>
                <div className="h-8 w-px bg-paper/20 hidden sm:block" />
                <div>
                  <p
                    className="text-paper/60 text-xs mb-1"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    COMMUNITY
                  </p>
                  <p className="text-paper text-sm">{community}</p>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => onNavigate("back")}
            className="text-paper/60 hover:text-accent text-sm transition-colors shrink-0"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ← BACK TO COLLECTION
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Fallback view ────────────────────────────────────────────────────────────
// Shown when the browser can't embed the PDF inline.
// Uses the archive's document-card layout (same cream background and fonts).

function FallbackView({
  doc,
}: {
  doc: Doc;
}) {
  return (
    <div className="p-8 sm:p-12 space-y-8 bg-paper" style={{ minHeight: "70vh" }}>
      {/* Document header */}
      <div className="border-b-2 border-ink pb-6">
        <h1
          className="text-3xl sm:text-4xl mb-4 text-ink"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {doc.title}
        </h1>
        {doc.author && (
          <p
            className="text-sm opacity-80 text-ink"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            Compiled by {doc.author}
          </p>
        )}
        <p
          className="text-sm opacity-80 mt-2 text-ink"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          EthnoVerse Living Archives
        </p>
      </div>

      {/* Embed unavailable notice */}
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <FileText className="w-16 h-16 text-ink/20" />
        <p
          className="text-ink/80"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          PDF preview is not available in this browser.
        </p>
        <p
          className="text-xs text-ink/70"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          Open or download the document using the buttons below.
        </p>
        <div className="flex items-center gap-4 mt-2">
          <a
            href={doc.pdf_cloudinary_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-ink text-paper hover:bg-accent transition-colors"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm">OPEN IN NEW TAB</span>
          </a>
          <a
            href={doc.pdf_cloudinary_url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 border border-ink hover:border-accent hover:text-accent transition-colors text-ink"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">DOWNLOAD</span>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-ink pt-6 mt-12">
        <p
          className="text-xs opacity-40 text-ink"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          EthnoVerse Living Archives · Kaavish Initiative © 2026
        </p>
      </div>
    </div>
  );
}
