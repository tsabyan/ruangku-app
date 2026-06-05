"use client";

import Link from "next/link";
import {
  Wallet,
  Target,
  NotebookPen,
  ArrowRight,
  Sparkles,
  User,
} from "lucide-react";

const modules = [
  {
    href: "/finance",
    label: "Finance",
    description:
      "Track transactions, monitor budget, and analyze your spending.",
    icon: Wallet,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    accentBar: "bg-emerald-500",
    tag: "Finance",
  },
  {
    href: "/goals",
    label: "Goals",
    description: "Set goals, stay focused daily, and record your achievements.",
    icon: Target,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    accentBar: "bg-amber-500",
    tag: "Goals",
  },
  {
    href: "/notes",
    label: "Notes",
    description: "Write ideas, reflections, and notes with a rich text editor.",
    icon: NotebookPen,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
    accentBar: "bg-sky-500",
    tag: "Notes",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Good Morning";
  if (hour < 15) return "Good Afternoon";
  if (hour < 18) return "Good Evening";
  return "Good Night";
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-8">
        {/* Logo mark + profile */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-[0.25em] text-zinc-400">
              Ruangku
            </span>
          </div>
          <Link
            href="/profile"
            className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95 transition-all"
          >
            <User className="w-4 h-4 text-zinc-500" />
          </Link>
        </div>

        {/* Greeting */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-400">
            {getGreeting()} 👋
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Your space today
          </h1>
          <p className="text-sm text-zinc-400">{getTodayLabel()}</p>
        </div>
      </header>

      {/* Divider */}
      <div className="mx-6 h-px bg-zinc-100" />

      {/* Module Cards */}
      <main className="flex-1 px-6 pt-8 pb-12">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-5">
          Your Spaces
        </p>

        <div className="space-y-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <div key={mod.href}>
                <Link href={mod.href} className="block group">
                  <div className="relative overflow-hidden bg-white border border-zinc-100 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-zinc-200 active:scale-[0.98] transition-all duration-200">
                    {/* Accent bar */}
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${mod.accentBar} rounded-l-3xl`}
                    />

                    <div className="flex items-center justify-between pl-3">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div
                          className={`w-12 h-12 ${mod.iconBg} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200`}
                        >
                          <Icon className={`w-6 h-6 ${mod.iconColor}`} />
                        </div>

                        {/* Text */}
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="font-bold text-zinc-900 text-base tracking-tight">
                              {mod.label}
                            </h2>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300 bg-zinc-50 px-1.5 py-0.5 rounded-md border border-zinc-100">
                              {mod.tag}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-400 leading-snug max-w-55">
                            {mod.description}
                          </p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all duration-200 shrink-0" />
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 pb-10 text-center">
        <p className="text-[10px] text-zinc-200 font-bold uppercase tracking-[0.2em]">
          Ruangku v1.0.0
        </p>
      </footer>
    </div>
  );
}
