import { Link } from "react-router-dom";
import {
  ArrowRight,
  GraduationCap,
  Award,
  Users,
  BookOpen,
  CheckCircle2,
  Quote,
  Code2,
  Brain,
  MessageSquare,
  Briefcase,
  Trophy,
  Building2,
  FolderKanban,
  UserRound,
  Cpu,
} from "lucide-react";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { CourseCard } from "@/components/landing/CourseCard";
import { SectionHeading } from "@/components/landing/SectionHeading";

import { Button } from "@/components/ui/button";
import {
  courses,
  categories,
  testimonials,
  counters,
  partners,
} from "@/lib/site-data";
import heroStudents from "@/assets/hero-students.png";
import about1 from "@/assets/about-1.jpg";
import about2 from "@/assets/about-2.jpg";

export default HomePage;

const categoryIcons = [
  Cpu,
  Code2,
  Brain,
  MessageSquare,
  UserRound,
  Briefcase,
  Award,
  GraduationCap,
  FolderKanban,
];

const heroStats = [
  { icon: BookOpen, value: "100+", label: "Courses" },
  { icon: GraduationCap, value: "Top", label: "Instructors" },
  { icon: Award, value: "Global", label: "Certifications" },
  { icon: Users, value: "30000", label: "Trainees" },
];

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-secondary/60 via-background to-background">
          <div className="dotted-grid pointer-events-none absolute left-6 top-24 h-32 w-32 opacity-20" />
          <div className="dotted-grid pointer-events-none absolute bottom-10 right-10 h-28 w-28 opacity-20" />
          <div className="absolute -right-10 top-40 h-24 w-24 rounded-full border-4 border-dashed border-gold/40" />

          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24 lg:px-8">
            <div>
              <span className="inline-block rounded-full bg-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                Since 2016 · 60+ Tech Coaches
              </span>
              <h1 className="mt-5 font-display text-5xl font-black uppercase leading-[0.95] tracking-tight text-primary sm:text-6xl lg:text-7xl">
                Trained <span className="text-gold">By Us</span>
                <br />
                Recognized
                <br />
                <span className="text-gold">By The World</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                Master secure assessments with Nexus Proctor — the leading exam integrity platform
                powered by Geeta University. Advanced proctoring, live verification and reliable results.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link to="/courses">
                    Explore Courses <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                  <Link to="/contact">Talk To Us</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-x-6 top-10 -z-0 aspect-square rounded-full bg-gradient-to-tr from-sky/20 to-primary/10 blur-2xl" />
              <img
                src={heroStudents}
                alt="Nexus Proctor users collaborating together"
                width={960}
                height={960}
                fetchPriority="high"
                className="relative z-10 mx-auto w-full max-w-lg"
              />
              <div className="absolute -bottom-2 left-2 z-20 rounded-2xl border border-border bg-card px-5 py-4 shadow-xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Since 2016
                </p>
                <p className="font-display text-lg font-extrabold text-foreground">
                  60+ <span className="text-primary">Tech Coaches</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stat band */}
          <div className="bg-gradient-to-r from-primary to-sky">
            <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
              {heroStats.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-4 px-2 py-7 text-primary-foreground"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-foreground/15">
                    <s.icon className="h-6 w-6" />
                  </span>
                  <span className="leading-tight">
                    <span className="block font-display text-xl font-extrabold">{s.value}</span>
                    <span className="text-sm opacity-90">{s.label}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Top Categories */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Top Categories"
            title="Explore What You Can Learn"
            description="From core coding to communication and placements — everything you need to become job-ready under one roof."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
            {categories.map((cat, i) => {
              const Icon = categoryIcons[i % categoryIcons.length];
              return (
                <div
                  key={cat}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="font-display text-base font-bold text-foreground">{cat}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* About */}
        <section className="bg-secondary/40 py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="relative">
              <img
                src={about1}
                alt="Students taking a proctored exam"
                loading="lazy"
                width={768}
                height={896}
                className="w-full rounded-3xl object-cover shadow-lg"
              />
              <img
                src={about2}
                alt="Instructor mentoring a student"
                loading="lazy"
                width={640}
                height={768}
                className="absolute -bottom-8 -right-4 hidden w-44 rounded-2xl border-4 border-background object-cover shadow-xl sm:block lg:w-56"
              />
              <div className="absolute -left-4 bottom-8 rounded-2xl bg-primary px-5 py-4 text-primary-foreground shadow-xl">
                <span className="block font-display text-3xl font-black">50+</span>
                <span className="text-sm">Certifications</span>
              </div>
            </div>

            <div>
              <SectionHeading
                align="left"
                eyebrow="About Us"
                title={
                  <>
                    Secure Exams with <span className="text-primary">Nexus Proctor</span>
                  </>
                }
                description="Unlock secure and reliable evaluations with Nexus Proctor. Dive into a advanced suite of anti-cheating mechanism features, secure browser environments, and live tracking curated to help educators verify assessments."
              />
              <ul className="mt-8 space-y-4">
                {[
                  "Industry Standard Training",
                  "Global Certifications",
                  "100% Placement Assistance",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" className="mt-8 rounded-full px-7">
                <Link to="/courses">
                  Start Learning <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Popular Courses */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Popular Courses"
            title="Pick A Course To Get Started"
            description="Hands-on, project-driven programs designed with industry mentors to make you placement-ready."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.slug} course={course} />
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg" variant="outline" className="rounded-full px-7">
              <Link to="/courses">Browse More Courses</Link>
            </Button>
          </div>
        </section>

        {/* Counters */}
        <section className="bg-gradient-to-r from-primary to-sky py-16">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
            {counters.map((c) => (
              <div key={c.label} className="text-center text-primary-foreground">
                <div className="font-display text-4xl font-black sm:text-5xl">{c.value}</div>
                <div className="mt-2 text-sm font-medium opacity-90">{c.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Testimonials"
            title="What Our Trainees Have To Say"
            description="Discover how Nexus Proctor has transformed online examination experiences — firsthand accounts of testing ease, reliability and secure verification."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm"
              >
                <Quote className="h-8 w-8 text-sky" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                  <img
                    src={t.image}
                    alt={t.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <span>
                    <span className="block font-display font-bold text-foreground">{t.name}</span>
                    <span className="text-xs text-muted-foreground">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-sky px-8 py-14 text-center shadow-xl">
              <Trophy className="mx-auto h-12 w-12 text-primary-foreground/90" />
              <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-extrabold text-primary-foreground sm:text-4xl">
                Secure Your Academic Integrity Through Nexus Proctor
              </h2>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="mt-8 rounded-full px-8 text-primary"
              >
                <Link to="/contact">
                  Get Started Now <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Our Partners"
            title="Working With The Best"
            description="We collaborate with top companies like Pega, CompTIA, Mile2 and Automation Anywhere to nurture talent and deliver unparalleled learning experiences."
          />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {partners.map((p) => (
              <div
                key={p}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-6 shadow-sm"
              >
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-display text-sm font-bold text-foreground">{p}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
