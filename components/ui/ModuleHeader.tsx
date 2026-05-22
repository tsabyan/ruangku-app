"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface ModuleHeaderProps {
  /** Back destination — defaults to '/' (home) */
  backHref?: string;
  /** Label shown next to back arrow */
  backLabel?: string;
  /** Main title shown below the back button */
  title?: string;
  /** Optional right-side slot (actions, icons, etc.) */
  right?: React.ReactNode;
  /** Extra children rendered below the title row (e.g. filter tabs) */
  children?: React.ReactNode;
  className?: string;
}

export default function ModuleHeader({
  backHref = "/",
  backLabel = "Ruangku",
  title,
  right,
  children,
  className = "",
}: ModuleHeaderProps) {
  const router = useRouter();

  return (
    <div
      className={`px-6 pt-8
         sticky top-0 bg-white/90 backdrop-blur-md z-10 ${className}`}
    >
      {/* Top row: back button + right slot */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-900 transition-colors -ml-1 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {backLabel}
          </span>
        </button>

        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>

      {/* Title */}
      {title && (
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mt-3 mb-1">
          {title}
        </h1>
      )}

      {/* Extra content (filter tabs, search, etc.) */}
      {children}
    </div>
  );
}
