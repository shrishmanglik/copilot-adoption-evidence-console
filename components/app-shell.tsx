"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Blocks,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  FlaskConical,
  History,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Adoption", icon: LayoutDashboard },
  { href: "/clinics", label: "Clinics", icon: ClipboardCheck },
  { href: "/blockers", label: "Blockers", icon: Blocks },
  { href: "/experiments", label: "Experiments", icon: FlaskConical },
  { href: "/playbooks", label: "Playbooks", icon: BookOpenCheck },
  { href: "/proof", label: "Proof", icon: ShieldCheck },
  { href: "/audit", label: "Audit", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => shellRef.current?.setAttribute("data-hydrated", "true"), []);

  return (
    <div
      ref={shellRef}
      className="min-h-screen bg-[#f4f7fb] text-slate-950"
      data-hydrated="false"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:p-3 focus:ring-2 focus:ring-blue-600"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[264px] border-r border-slate-200 bg-[#071426] text-white transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Primary navigation"
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="flex items-start justify-between px-2">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                <Activity size={16} /> Evidence Console
              </span>
              <span className="mt-2 block max-w-[190px] text-lg font-semibold leading-6">
                Copilot adoption operations
              </span>
            </Link>
            <button
              className="rounded-md p-2 text-slate-300 hover:bg-white/10 md:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="mt-9 space-y-1" aria-label="Primary navigation">
            {nav.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/"
                  ? pathname === "/" || pathname.startsWith("/accounts/")
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                    active && "bg-white/10 text-white",
                  )}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-200">
              <BriefcaseBusiness size={15} /> Independent work sample
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Synthetic data only. No employer or customer systems connected.
            </p>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="fixed inset-0 z-30 bg-slate-950/50 md:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="md:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <button
            className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
          <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 md:flex">
            <span className="h-2 w-2 rounded-full bg-teal-500" /> Ruleset
            operational
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900">
              SYNTHETIC DEMO
            </span>
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">
              Operator workspace
            </span>
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto max-w-[1540px] px-4 py-6 md:px-8 md:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
