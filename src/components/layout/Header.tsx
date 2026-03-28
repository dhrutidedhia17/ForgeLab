"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Hammer, Archive } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/build", label: "Build", icon: Hammer },
    { href: "/vault", label: "Vault", icon: Archive },
  ];

  return (
    <header className="h-16 glass-strong sticky top-0 z-50 border-b border-white/[0.03]">
      <div className="max-w-7xl mx-auto h-full flex items-center px-6">
        <Link href="/" className="flex items-center gap-2.5 mr-10 group">
          <div className="relative">
            <div className="h-8 w-8 rounded-xl bg-brand-gradient flex items-center justify-center shadow-warm-sm group-hover:shadow-warm-md transition-shadow">
              <Flame className="h-4.5 w-4.5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold tracking-tight font-display gradient-text">
            ForgeLab
          </span>
        </Link>
        <nav className="flex gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-clay-400/10 text-clay-300 shadow-warm-sm"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
