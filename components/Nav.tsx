"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/train", label: "Train" },
  { href: "/pricing", label: "Pro" },
  { href: "/account", label: "Account" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="container">
      <nav className="nav" aria-label="Main">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden>
            ♛
          </span>
          PacePrincess AI
        </Link>
        <div className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link" aria-current={path === l.href ? "page" : undefined}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
