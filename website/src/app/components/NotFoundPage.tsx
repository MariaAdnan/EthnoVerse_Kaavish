interface NotFoundPageProps {
  onNavigate: (view: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  return (
    <section className="min-h-screen bg-paper px-6 pb-16 pt-32 text-ink">
      <div className="mx-auto max-w-2xl border-2 border-ink p-8 text-center sm:p-12">
        <p className="mb-4 text-xs tracking-[0.2em] text-muted-foreground">
          ERROR 404
        </p>
        <h1 className="mb-4 text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
          Page not found
        </h1>
        <p className="mb-8 text-muted-foreground">
          The archive page you requested does not exist or may have moved.
        </p>
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="bg-ink px-6 py-3 text-sm text-paper hover:bg-accent hover:text-ink"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          RETURN HOME
        </button>
      </div>
    </section>
  );
}
