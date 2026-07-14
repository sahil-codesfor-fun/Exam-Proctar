import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { Logo } from "@/components/Logo";
import { contact } from "@/lib/site-data";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Nexus Proctor is the academic integrity and online exam platform, powered by
              Geeta University. We ensure secure testing environments through advanced proctoring
              solutions.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                Geeta University
              </span>
              <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                Nexus Proctor
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Quick Links</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="transition-colors hover:text-primary">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/courses" className="transition-colors hover:text-primary">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Get In Touch</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary" />
                <a href={`mailto:${contact.email}`} className="transition-colors hover:text-primary">
                  {contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary" />
                <a href="tel:+918343818181" className="transition-colors hover:text-primary">
                  {contact.phone}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <span>Geeta University Campus, Naultha, Panipat, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Nexus Proctor. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
