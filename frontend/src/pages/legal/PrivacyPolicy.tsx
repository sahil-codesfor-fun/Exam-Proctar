import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { ShieldCheck, Eye, Lock, FileText, Server, AlertCircle, Scale, Database } from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "October 10, 2026";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-secondary/70 via-background to-background py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-4">
              <ShieldCheck className="h-4 w-4" /> Legal & Privacy Assurance
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Your privacy, academic data security, and testing integrity are our foremost priorities. Learn how Code Nexus collects, encrypts, and processes your information.
            </p>
            <p className="mt-2 text-xs font-semibold text-primary">
              Last Updated: {lastUpdated}
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section 1: Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                1. Overview & Scope
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Code Nexus (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;the Platform&rdquo;), partnered with Geeta University, provides automated, AI-assisted examination, coding evaluation, and proctoring services. This Privacy Policy governs the manner in which Code Nexus collects, uses, maintains, and protects student, faculty, and administrative information.
            </p>
          </div>

          {/* Section 2: Data We Collect */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                2. Information We Collect
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              To guarantee exam authenticity and secure test environments, we collect the following categories of data:
            </p>
            <ul className="grid sm:grid-cols-2 gap-4 mt-3">
              <li className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-1.5">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Profile & Academic Info
                </span>
                <p className="text-xs text-muted-foreground">
                  Student Name, University Email, Roll Number / Student ID, Department, and Course Enrolments.
                </p>
              </li>
              <li className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-1.5">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Automated Code Submissions
                </span>
                <p className="text-xs text-muted-foreground">
                  Source code snippets, compile timestamps, test case pass rates, and runtime execution metrics.
                </p>
              </li>
              <li className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-1.5">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Proctoring & Integrity Telemetry
                </span>
                <p className="text-xs text-muted-foreground">
                  Periodic snapshot frames, tab switch detections, full-screen violation events, and audio noise anomalies.
                </p>
              </li>
              <li className="p-4 rounded-xl border border-border bg-card/60 shadow-sm space-y-1.5">
                <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" /> Device & Access Logs
                </span>
                <p className="text-xs text-muted-foreground">
                  IP address, browser user-agent, operating system, and secure session tokens.
                </p>
              </li>
            </ul>
          </div>

          {/* Section 3: AI Proctoring & Camera Stream Processing */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Eye className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                3. Proctoring & Biometric Processing
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              During active live proctored sessions, Code Nexus requests student webcam and screen focus permissions.
            </p>
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" /> Key Proctoring Safeguards:
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-5">
                <li>Webcam snapshots and violation logs are strictly recorded only while an active exam session is in progress.</li>
                <li>All captured snapshot data is encrypted in transit using TLS 1.3 and stored securely with strict role-based access.</li>
                <li>Faculty and institution administrators only access logs for the specific exams they oversee.</li>
                <li>No video/audio feeds are sold to third parties or used for external advertising.</li>
              </ul>
            </div>
          </div>

          {/* Section 4: Data Security & Encryption */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                4. Data Security & Storage
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We employ enterprise-grade security standards including bcrypt password hashing, JWT stateless authentication, encrypted database storage, and automated rate-limiting to prevent unauthorized access.
            </p>
          </div>

          {/* Section 5: Cookies & Local Storage */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Server className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                5. Cookie Policy & Local Storage
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              We utilize strictly necessary local storage items and cookies to maintain your authenticated session, remember dashboard preferences, and manage anti-tamper exam heartbeat synchronization. You can customize cookie preferences at any time via our Cookie Consent banner.
            </p>
          </div>

          {/* Section 6: User Rights & Inquiries */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                6. Your Rights & Contact Information
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Students and educators have the right to review their stored academic profile, request corrections, and lodge inquiries regarding examination session records.
            </p>
            <p className="text-muted-foreground leading-relaxed text-sm">
              For any privacy inquiries or data rights requests, please contact our Data Protection Officer at:
              <br />
              <strong className="text-foreground">Email:</strong> privacy@codenexus.com &nbsp;|&nbsp; <strong className="text-foreground">Support:</strong> <Link to="/contact" className="text-primary underline">Contact Support</Link>
            </p>
          </div>

        </section>
      </main>
      <Footer />
    </div>
  );
}
