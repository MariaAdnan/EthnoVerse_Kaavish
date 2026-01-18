import { motion } from "motion/react";
import { NavigationBar } from "./NavigationBar";

interface ContactPageProps {
  onNavigate: (view: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <NavigationBar onNavigate={onNavigate} />

      {/* Header (matches About page) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="border-b border-border p-12 pt-32 text-center"
      >
        <p
          className="text-sm mb-3 opacity-60"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          SRS FIGURE 3.9
        </p>

        <h1
          className="text-7xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Contact
        </h1>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-16"
        >
          {/* General Inquiries */}
          <div className="border-b border-border pb-10">
            <h2
              className="text-xs mb-4 opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              GENERAL INQUIRIES
            </h2>

            <a
              href="mailto:hello@ethnoverse.pk"
              className="text-3xl hover:text-accent transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              hello@ethnoverse.pk
            </a>
          </div>

          {/* Research Contributions */}
          <div className="border-b border-border pb-10">
            <h2
              className="text-xs mb-4 opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              RESEARCH CONTRIBUTIONS
            </h2>

            <a
              href="mailto:research@ethnoverse.pk"
              className="text-3xl hover:text-accent transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              research@ethnoverse.pk
            </a>
          </div>

          {/* Supervisor */}
          <div>
            <h2
              className="text-xs mb-4 opacity-60"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              SUPERVISOR
            </h2>

            <p
              className="text-3xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Dr. Syeda Saleha Raza
            </p>

            <p
              className="text-lg text-muted-foreground mt-2"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Habib University
            </p>
          </div>
        </motion.div>

        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-20 pt-10 border-t border-border"
        >
          <button
            onClick={() => onNavigate("home")}
            className="group inline-flex items-center gap-2 text-accent hover:gap-4 transition-all"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            <span>←</span>
            <span className="text-sm">BACK TO HOME</span>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
