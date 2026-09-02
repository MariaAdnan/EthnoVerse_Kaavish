import { motion } from "motion/react";

interface ContactPageProps {
  onNavigate: (view: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  return (
    <div className="min-h-screen">
      {/* Header (matches About page) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="border-b border-border px-6 pb-12 pt-32 text-center sm:px-12"
      >

        <h1
          className="text-5xl sm:text-7xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Contact
        </h1>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-16"
        >
          {/* General Inquiries */}
          <div className="border-b border-border pb-10">
            <h2
              className="text-xs mb-4 opacity-80"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              GENERAL INQUIRIES
            </h2>

            <a
              href="mailto:sara.baloch@icloud.com"
              className="block break-all text-xl hover:text-accent transition-colors sm:text-3xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              sara.baloch@icloud.com
            </a>
          </div>

          {/* Research Contributions */}
          <div className="border-b border-border pb-10">
            <h2
              className="text-xs mb-4 opacity-80"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              RESEARCH CONTRIBUTIONS
            </h2>

            <a
              href="mailto:sara.baloch@icloud.com?subject=EthnoVerse%20research%20contribution"
              className="block break-all text-xl hover:text-accent transition-colors sm:text-3xl"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Email the project team
            </a>
          </div>

          {/* Supervisor */}
          <div>
            <h2
              className="text-xs mb-4 opacity-80"
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
            className="group inline-flex items-center gap-2 text-dark-umber hover:gap-4 hover:text-accent transition-all"
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
