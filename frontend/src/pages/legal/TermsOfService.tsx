import React from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { ShieldCheck, BookOpen, AlertTriangle, Scale, UserCheck, Terminal, Award } from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = "October 10, 2026";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-secondary/70 via-background to-background py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-4">
              <Scale className="h-4 w-4" /> Academic Integrity & Conduct
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-slate-900 dark:text-white">
              Terms & Conditions
            </h1>
            <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Please read these terms carefully before participating in exams, courses, or utilizing the Code Nexus proctoring ecosystem.
            </p>
            <p className="mt-2 text-xs font-semibold text-primary">
              Last Updated: {lastUpdated}
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          
          {/* Section 1: Acceptance */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                1. Acceptance of Terms
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Code Nexus examination platform, affiliated with Geeta University, you agree to comply with and be bound by these Terms and Conditions. If you do not agree to these terms, you may not access or participate in examination sessions.
            </p>
          </div>

          {/* Section 2: Student Code of Conduct */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <UserCheck className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                2. Academic Integrity & Examination Rules
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              All students participating in live examinations and assessments must adhere strictly to university standards of academic honesty:
            </p>
            <ul className="space-y-3 mt-2">
              <li className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <strong className="text-foreground">Single Person Test Environment:</strong> The test taker must be alone in a well-lit room for the entirety of the examination.
                </div>
              </li>
              <li className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <strong className="text-foreground">No Unauthorized Material:</strong> Use of external devices, secondary monitors, unauthorized communication channels, or unapproved AI text assistants is strictly prohibited.
                </div>
              </li>
              <li className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <strong className="text-foreground">Browser Lock & Fullscreen:</strong> Exiting fullscreen mode or switching browser tabs generates an automated violation event directly recorded on your session log.
                </div>
              </li>
            </ul>
          </div>

          {/* Section 3: Proctoring Consent */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                3. Proctoring & Biometric Monitoring Consent
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              By initiating a proctored assessment on Code Nexus, you explicitly grant consent for real-time video snapshot capture, audio decibel monitoring, screen activity tracking, and system violation logging.
            </p>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
              Violations flagged by automated AI detectors are subjected to formal administrative review by course instructors and university examination boards.
            </div>
          </div>

          {/* Section 4: Code Execution & Sandboxing */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Terminal className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                4. Code Execution & Sandboxing Policy
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              The Code Nexus compiler environment runs student code in isolated sandbox containers. Attempts to execute malicious system commands, bypass resource quotas, initiate DDoS attacks, or exploit compiler endpoints will lead to immediate account suspension and academic disciplinary action.
            </p>
          </div>

          {/* Section 5: Intellectual Property */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Award className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                5. Intellectual Property & Exam Content
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              All question sets, problem statements, and assessment materials provided through Code Nexus are the intellectual property of Geeta University and respective educators. Copying, distributing, or publishing exam questions online is strictly forbidden.
            </p>
          </div>

          {/* Section 6: Contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                6. Contact & Support
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              If you have any questions regarding these Terms & Conditions, please contact our academic governance committee:
              <br />
              <strong className="text-foreground">Email:</strong> legal@codenexus.com &nbsp;|&nbsp; <strong className="text-foreground">Support:</strong> <Link to="/contact" className="text-primary underline">Contact Support</Link>
            </p>
          </div>

        </section>
      </main>
      <Footer />
    </div>
  );
}
