import { Link } from "react-router-dom";
import { Clock, Layers } from "lucide-react";
import type { Course } from "@/lib/site-data";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      to="/courses"
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative overflow-hidden">
        <img
          src={course.image}
          alt={course.title}
          loading="lazy"
          width={768}
          height={512}
          className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
          {course.weeks}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-gold px-3 py-1 text-xs font-bold text-gold-foreground shadow-sm">
          {course.level}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {course.category}
        </span>
        <h3 className="mt-1.5 font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary">
          {course.title}
        </h3>
        <div className="mt-auto flex items-center gap-5 pt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-sky" />
            {course.modules}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-sky" />
            {course.hours}
          </span>
        </div>
      </div>
    </Link>
  );
}
