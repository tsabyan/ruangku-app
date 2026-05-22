"use client";

import { Wallet } from "lucide-react";
import { motion } from "motion/react";

export default function SettingsView() {
  return (
    <div className="h-full overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <header>
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">
            Settings
          </h2>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-4xl border border-zinc-100 shadow-sm p-8 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center">
            <Wallet className="w-7 h-7 text-zinc-300" />
          </div>
          <div>
            <p className="font-bold text-zinc-900 mb-1">Budget</p>
            <p className="text-sm text-zinc-400">Coming soon</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 bg-zinc-50 px-3 py-1.5 rounded-full">
            In Development
          </span>
        </motion.div>
      </div>
    </div>
  );
}
