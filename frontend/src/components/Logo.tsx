import { Link } from "react-router-dom";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <span className="font-display text-lg font-extrabold leading-none">{"</>"}</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Nexus<span className="text-primary"> Proctor</span>
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Academic Integrity
        </span>
      </span>
    </Link>
  );
}
