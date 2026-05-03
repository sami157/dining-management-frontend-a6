import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { FaFacebookF, FaGithub, FaLinkedinIn } from "react-icons/fa6";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register" },
];

const contactItems = [
  { icon: Mail, label: "support@dining-management.local" },
  { icon: Phone, label: "+880 1700-000000" },
  { icon: MapPin, label: "Dhaka, Bangladesh" },
];

const socialLinks = [
  { href: "https://www.facebook.com/tanzirahmeds1", label: "Facebook", icon: FaFacebookF },
  { href: "https://github.com/sami157", label: "GitHub", icon: FaGithub },
  { href: "https://www.linkedin.com/in/tanzir-ahmed-sami/", label: "LinkedIn", icon: FaLinkedinIn },
];

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/60">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 text-sm text-muted-foreground lg:grid-cols-[1.1fr_0.75fr_0.85fr_0.8fr]">
        <div className="space-y-3">
          <p className="text-base font-semibold text-foreground">Dining Management</p>
          <p className="max-w-md leading-6">
            A shared operations platform for meal scheduling, member registrations,
            contributions, expenses, and monthly accountability.
          </p>
          <div className="flex gap-2 pt-2">
            {socialLinks.map((link) => {
              const Icon = link.icon;

              return (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={link.label}
                  className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground/70 transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                >
                  <Icon className="size-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Quick Links
          </p>
          <div className="grid gap-2">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="-ml-2 w-fit cursor-pointer rounded-md px-2 py-1 text-foreground/72 transition hover:bg-primary/10 hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Contact
          </p>
          <div className="space-y-3">
            {contactItems.map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-4 text-primary" />
                  <p>{item.label}</p>
                </div>
              );
            })}
            <p className="leading-6">
              Contact the operations team for schedule corrections, access issues, and
              finance follow-up.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Platform Notes
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <UtensilsCrossed className="mt-0.5 size-4 text-primary" />
              <p>Meal schedules, registrations, and per-day operations.</p>
            </div>
            <div className="flex items-start gap-3">
              <Wallet className="mt-0.5 size-4 text-primary" />
              <p>Deposits, expenses, and balance-aware finance tracking.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 text-primary" />
              <p>Role-aware access for members, managers, and admins.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
        (c) {currentYear} Dining Management Web Application
      </div>
    </footer>
  );
}
