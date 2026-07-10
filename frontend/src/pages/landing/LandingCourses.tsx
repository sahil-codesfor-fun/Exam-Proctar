import { useState } from "react";

import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { CourseCard } from "@/components/landing/CourseCard";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { courses, moreCourses } from "@/lib/site-data";

export default CoursesPage;

const allCourses = [...courses, ...moreCourses];
const filters = ["All", "Cloud", "Mobile", "Full Stack", "AI"];

function CoursesPage() {
  const [active, setActive] = useState("All");
  const visible = active === "All" ? allCourses : allCourses.filter((c) => c.category === active);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-secondary/60 via-background to-background py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Our Courses"
              title="Find The Right Course For You"
              description="Practical, industry-aligned programs built with expert mentors at Geeta Technical Hub. Filter by category to find your perfect fit."
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActive(f)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  active === f
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card text-foreground/80 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visible.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>

          {visible.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">No courses in this category yet.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
