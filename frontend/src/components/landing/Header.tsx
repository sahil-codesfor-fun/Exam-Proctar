import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Logo } from "@/components/landing/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => 
                `text-sm font-semibold transition-colors hover:text-primary ${isActive ? 'text-primary' : 'text-foreground/80'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild className="hidden rounded-full px-6 sm:inline-flex">
            <Link to="/login">Login</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="mt-6 flex flex-col gap-1 px-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => 
                      `rounded-lg px-3 py-2.5 text-base font-semibold transition-colors hover:bg-secondary hover:text-primary ${isActive ? 'bg-secondary text-primary' : 'text-foreground/80'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <Button asChild className="mt-4 rounded-full">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    Login
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
