import { useState } from "react";

import { Mail, Phone, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { contact } from "@/lib/site-data";

export default ContactPage;

const details = [
  { icon: Mail, label: "Email Us", value: contact.email, href: `mailto:${contact.email}` },
  { icon: Phone, label: "Call Us", value: contact.phone, href: "tel:+918343818181" },
  {
    icon: MapPin,
    label: "Visit Us",
    value: "Geeta University Campus, Naultha, Panipat, India",
    href: undefined,
  },
];

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    _gotcha_hp: "", // Honeypot field for bot spam trap
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Please enter your full name (minimum 2 characters).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }
    if (!formData.subject.trim() || formData.subject.trim().length < 3) {
      errs.subject = "Subject must be at least 3 characters.";
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = "Message must be at least 10 characters.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Bot Honeypot Trap: If invisible field is populated, silently intercept bot
    if (formData._gotcha_hp) {
      console.warn("Spam bot submission blocked via Honeypot trap.");
      toast.success("Message sent successfully!");
      return;
    }

    // 2. Client-side Validation
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly.");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setFormData({ name: "", email: "", subject: "", message: "", _gotcha_hp: "" });
      toast.success("Thanks for reaching out!", {
        description: "Our academic support team will get back to you within 24 hours.",
      });
    }, 700);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-secondary/60 via-background to-background py-16 lg:py-20 border-b border-border">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Get In Touch"
              title="Let's Start Your Journey"
              description="Have a question about our courses, online proctoring solutions, or university certifications? Send us a message and our team will respond shortly."
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-5">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-primary/40 transition-colors"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <d.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">{d.label}</h3>
                  {d.href ? (
                    <a
                      href={d.href}
                      className="mt-1 block text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {d.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">{d.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-border bg-card p-7 shadow-sm space-y-5"
          >
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Send Us A Message</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Fill in the form below and we'll reply to your university or personal email.
              </p>
            </div>

            {/* Hidden Honeypot Field for anti-spam bot protection */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="_gotcha_hp">Leave this field empty</label>
              <input
                type="text"
                id="_gotcha_hp"
                name="_gotcha_hp"
                tabIndex={-1}
                autoComplete="off"
                value={formData._gotcha_hp}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.name && <p className="text-[11px] font-medium text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@institution.edu"
                  className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.email && <p className="text-[11px] font-medium text-red-500">{errors.email}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Inquiry or issue topic"
                className={errors.subject ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.subject && <p className="text-[11px] font-medium text-red-500">{errors.subject}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                name="message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us how we can help…"
                className={errors.message ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.message && <p className="text-[11px] font-medium text-red-500">{errors.message}</p>}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full rounded-full bg-primary hover:bg-primary/90 text-white font-bold shadow-md shadow-primary/20"
              disabled={submitting}
            >
              {submitting ? "Sending…" : "Send Message"}
              <Send className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </section>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
