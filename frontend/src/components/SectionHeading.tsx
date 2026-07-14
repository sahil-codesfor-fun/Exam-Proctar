export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl text-left"}>
      {eyebrow && (
        <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          {eyebrow}
        </span>
      )}
      <h2
        className={`mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${
          light ? "text-primary-foreground" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed ${
            light ? "text-primary-foreground/80" : "text-muted-foreground"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
