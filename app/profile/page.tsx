"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { User, LogOut, Mail, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import ModuleHeader from "@/components/ui/ModuleHeader";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ModuleHeader title="Profil" />

      <main className="flex-1 px-6 pt-8 pb-12 space-y-6">
        {/* Avatar & email */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-3 py-8"
        >
          <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center">
            <User className="w-9 h-9 text-zinc-400" />
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Mail className="w-4 h-4 text-zinc-300" />
            <span className="font-medium">{email ?? "—"}</span>
          </div>
        </motion.div>

        {/* App info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-100 bg-zinc-50"
        >
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900">Ruangku</p>
            <p className="text-xs text-zinc-400">
              v0.1.0 — your personal space
            </p>
          </div>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 bg-red-50 text-red-500 font-bold text-sm hover:bg-red-100 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loading ? "Keluar..." : "Keluar dari Akun"}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
