"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, PlusCircle, PieChart, Settings } from "lucide-react";
import ModuleHeader from "@/components/ui/ModuleHeader";
import { View } from "@/types/finance";
import { cn } from "@/lib/utils";
import { useFinanceStore } from "@/hooks/useFinanceStore";
import HomeView from "./HomeView";
import AddView from "./AddView";
import AnalyticsView from "./AnalyticsView";
import HistoryView from "./HistoryView";
import SettingsView from "./SettingsView";

export default function FinanceShell() {
  const [currentView, setCurrentView] = useState<View>("home");
  const { transactions, addTransaction, updateTransaction, deleteTransaction, isLoading } = useFinanceStore();

  const renderView = () => {
    switch (currentView) {
      case "home":
        return (
          <HomeView
            transactions={transactions}
            isLoading={isLoading}
            onViewHistory={() => setCurrentView("history")}
          />
        );
      case "add":
        return (
          <AddView
            onAdd={addTransaction}
            onComplete={() => setCurrentView("home")}
          />
        );
      case "analytics":
        return <AnalyticsView transactions={transactions} />;
      case "settings":
        return <SettingsView />;
      case "history":
        return (
          <HistoryView
            transactions={transactions}
            onBack={() => setCurrentView("home")}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
          />
        );
      default:
        return null;
    }
  };

  const navItems: { view: View; icon: React.ReactNode; label: string }[] = [
    { view: "home", icon: <Home size={22} />, label: "Home" },
    { view: "add", icon: <PlusCircle size={22} />, label: "Add" },
    { view: "analytics", icon: <PieChart size={22} />, label: "Analytics" },
    { view: "settings", icon: <Settings size={22} />, label: "Settings" },
  ];

  return (
    <div className="h-screen bg-white flex flex-col font-sans antialiased overflow-hidden">
      {/* Sticky top bar — always visible, never scrolls */}
      <ModuleHeader backHref="/" className="shrink-0 pt-8" />

      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="h-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white/90 backdrop-blur-xl border-t border-zinc-100 shadow-sm shrink-0">
        <div className="max-w-2xl mx-auto flex justify-around items-center px-4 pt-2 pb-5">
          {navItems.map(({ view, icon, label }) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={cn(
                "flex flex-col items-center gap-1 flex-1 py-2 transition-all duration-200",
                currentView === view ? "text-zinc-900" : "text-zinc-300",
              )}
            >
              <div className="w-10 h-6 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
                {icon}
              </div>
              <span
                className={cn(
                  "text-[10px] tracking-tight transition-all",
                  currentView === view ? "font-black" : "font-medium",
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
