// src/app/components/AdminGuidelines.tsx
import { motion } from "motion/react";
import { Camera, Upload, Cpu, Eye, Globe, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";

interface AdminGuidelinesProps {
  onNavigate: (view: string) => void;
}

const steps = [
  {
    number: "01",
    title: "Object Selection & Preparation",
    icon: CheckCircle,
    color: "text-accent",
    subsections: [
      {
        label: "Choose the Object",
        items: [
          "Select a culturally relevant object",
          "Object must be static (no movement)",
          "Fully visible from all sides",
          "Not reflective or transparent (avoid mirrors, glass)",
        ],
      },
      {
        label: "Prepare Environment",
        items: [
          "Use natural daylight (preferred)",
          "Avoid harsh shadows, overexposure, cluttered backgrounds",
          "Plain or neutral background with even lighting",
          "Object placed at center",
        ],
      },
    ],
  },
  {
    number: "02",
    title: "Image Capture",
    icon: Camera,
    color: "text-accent",
    badge: "MOST IMPORTANT",
    subsections: [
      {
        label: "Capture Strategy",
        items: [
          "Take 40–100 images from different angles",
          "Walk around in a circle, every ~10–15 degrees",
          "Capture from top angle, eye level, and slightly below",
        ],
      },
      {
        label: "Key Rules",
        items: [
          "Maintain consistent distance throughout",
          "Ensure ~70% overlap between images",
          "Do NOT zoom in/out randomly",
          "Keep object fully in frame at all times",
        ],
      },
      {
        label: "File Requirements",
        items: [
          "Format: JPG or PNG",
          "Resolution: Minimum 1080p",
          "No blur, no motion",
        ],
      },
    ],
  },
  {
    number: "03",
    title: "Upload to Platform",
    icon: Upload,
    color: "text-accent",
    subsections: [
      {
        label: "Steps",
        items: [
          "Login to Admin Dashboard and authenticate",
          "Open Upload New Media",
          "Select Media Type → 3D Tour (Gaussian Splat)",
          "Select the relevant Community",
          "Put the JPG/PNG captures in one ZIP file and upload it",
          "Enter a clear title and filesystem-safe object name",
          "Click Publish; the reconstruction job starts automatically",
        ],
      },
    ],
  },
  {
    number: "04",
    title: "Pre-Processing",
    icon: AlertTriangle,
    color: "text-accent",
    subsections: [
      {
        label: "Automatic Checks",
        items: [
          "System validates the ZIP structure, file integrity, compression ratio, and minimum image count",
        ],
      },
      {
        label: "Manual Review",
        items: [
          "No duplicate images",
          "No blurred frames",
          "Good coverage of object",
          "If issues found → re-upload or remove bad images",
        ],
      },
    ],
  },
  {
    number: "05",
    title: "Run 3DGS Pipeline",
    icon: Cpu,
    color: "text-accent",
    subsections: [
      {
        label: "Start Reconstruction",
        items: [
          "Open the job from the Admin Dashboard",
          "Use View Progress to monitor each processing stage",
          "A failed job displays its worker error so the image set can be corrected",
        ],
      },
      {
        label: "Pipeline Stages (Automatic)",
        items: [
          "Stage 1: Camera Pose Estimation (SfM) — system computes camera positions",
          "Stage 2: Gaussian Initialization — scene converted into Gaussian primitives",
          "Stage 3: Optimization — Gaussians refined using gradient descent",
          "Stage 4: Rendering Preparation — model optimized for real-time viewing",
        ],
      },
      {
        label: "Processing Time",
        items: ["Typically 15–20 minutes, depending on image count and GPU availability"],
      },
    ],
  },
  {
    number: "06",
    title: "Review Output",
    icon: Eye,
    color: "text-accent",
    subsections: [
      {
        label: "Quality Checklist",
        items: [
          "Download the completed PLY from the job screen",
          "Object fully reconstructed",
          "No major holes or distortions",
          "Smooth visual transitions",
          "Acceptable texture quality",
        ],
      },
      {
        label: "If Output is Poor",
        items: [
          "Missing angles → capture more images",
          "Blur → remove bad frames and reprocess",
          "Lighting issues → re-capture under better conditions",
        ],
      },
    ],
  },
  {
    number: "07",
    title: "Place & Publish",
    icon: Globe,
    color: "text-accent",
    subsections: [
      {
        label: "Add to a Tour",
        items: [
          "Open the 3D Tour Editor for the correct community",
          "Choose Insert Object and select the downloaded binary little-endian PLY",
          "Click the terrain to place it, then adjust position, scale, and rotation",
        ],
      },
      {
        label: "Publish to Archive",
        items: [
          "Add a concise, culturally accurate title and description",
          "Click Save; the asset is uploaded through the admin-only Cloudinary signer",
          "Exit and reopen the public tour to verify placement and loading",
        ],
      },
    ],
  },
];

const bestPractices = [
  "Always prioritize image quality over quantity",
  "Maintain consistent lighting throughout capture",
  "Avoid reflective or transparent objects",
  "Capture complete 360° coverage",
  "Use clear, descriptive metadata for discoverability",
];

export function AdminGuidelines({ onNavigate }: AdminGuidelinesProps) {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="border-b border-border px-6 pb-8 pt-32 sm:px-8"
      >
        <div className="max-w-4xl mx-auto">
          <p
            className="text-sm mb-2 opacity-80"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            ADMIN GUIDELINES
          </p>
          <h1
            className="text-[clamp(2.5rem,10vw,3rem)] leading-tight"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            3D Reconstruction Workflow
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl">
            Complete process for creating a 3D reconstruction of an object — from data capture to final integration into the platform.
          </p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto px-6 py-8 sm:px-8">
        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className="border border-border hover:border-accent transition-colors"
              >
                {/* Step Header */}
                <div className="p-6 border-b border-border flex items-center gap-6">
                  <p
                    className="text-4xl opacity-20"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {step.number}
                  </p>
                  <Icon className={`w-5 h-5 ${step.color} shrink-0`} />
                  <h2
                    className="text-xl flex-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {step.title}
                  </h2>
                  {step.badge && (
                    <span
                      className="text-xs px-2 py-1 bg-accent text-accent-foreground"
                      style={{ fontFamily: "'Space Mono', monospace" }}
                    >
                      {step.badge}
                    </span>
                  )}
                </div>

                {/* Step Content */}
                <div className="p-6 grid md:grid-cols-2 gap-6">
                  {step.subsections.map((sub) => (
                    <div key={sub.label}>
                      <p
                        className="text-xs opacity-50 mb-3"
                        style={{ fontFamily: "'Space Mono', monospace" }}
                      >
                        {sub.label.toUpperCase()}
                      </p>
                      <ul className="space-y-2">
                        {sub.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="w-3 h-3 text-accent mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 p-8 border-2 border-accent bg-accent/5"
        >
          <p
            className="text-xs opacity-80 mb-2"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            IMPORTANT
          </p>
          <h3
            className="text-2xl mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Best Practices
          </h3>
          <ul className="space-y-3">
            {bestPractices.map((practice, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                {practice}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Back Navigation */}
      <div className="fixed left-4 top-20 z-40 md:left-8 md:top-24">
        <button
          onClick={() => onNavigate('admin')}
          className="text-foreground hover:text-accent transition-colors"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          <span className="text-sm">← DASHBOARD</span>
        </button>
      </div>
    </div>
  );
}
