"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Plus, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FloatNavGridItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}

interface FloatNavProps {
  onPlus: () => void;
  gridItems?: FloatNavGridItem[];
}

export default function FloatNav({ onPlus, gridItems }: FloatNavProps) {
  const router = useRouter();
  const [showGrid, setShowGrid] = useState(false);
  const hasGrid = gridItems && gridItems.length > 0;

  return (
    <>
      {/* Grid popup */}
      {showGrid && hasGrid && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowGrid(false)}
          />
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-zinc-100 py-1.5 min-w-52 overflow-hidden">
            {gridItems!.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  item.onClick();
                  setShowGrid(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors text-left",
                  item.active
                    ? "bg-zinc-50 text-zinc-900 font-bold"
                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                <span
                  className={cn(
                    item.active ? "text-zinc-900" : "text-zinc-400",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Floating nav bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 bg-white border border-zinc-100 rounded-full shadow-xl px-2 py-2">
          {/* Home */}
          <button
            onClick={() => router.push("/")}
            className="w-11 h-11 flex items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-90"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Plus — primary action */}
          <button
            onClick={onPlus}
            className="w-12 h-11 flex items-center justify-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-all active:scale-90 mx-1"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Grid — module pages */}
          <button
            onClick={() => hasGrid && setShowGrid((v) => !v)}
            className={cn(
              "w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90",
              !hasGrid && "opacity-30 cursor-default",
              showGrid
                ? "bg-zinc-100 text-zinc-900"
                : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900",
            )}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  );
}
