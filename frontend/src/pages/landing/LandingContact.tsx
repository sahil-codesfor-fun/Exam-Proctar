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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    setTimeout(() => {
      setSubmitting(false);
      form.reset();
      toast.success("Thanks for reaching out!", {
        description: "Our team will get back to you within 24 hours.",
      });
    }, 600);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-secondary/60 via-background to-background py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow="Get In Touch"
              title="Let's Start Your Journey"
              description="Have a question about our courses, certifications or placements? Send us a message and our team at Geeta Technical Hub will respond shortly."
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-5">
            {details.map((d) => (
              <div
                key={d.label}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm"
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
            className="rounded-2xl border border-border bg-card p-7 shadow-sm"
          >
            <h2 className="font-display text-xl font-bold text-foreground">Send Us A Message</h2>
            <div className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" placeholder="Your name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="What's this about?" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell us how we can help…"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send Message"}
                <Send className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </form>
        </section>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
