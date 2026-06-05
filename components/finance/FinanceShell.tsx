"use client";

import { useState } from "react";
import { Home, PieChart, Settings } from "lucide-react";
import FloatNav from "@/components/ui/FloatNav";
import { View } from "@/types/finance";
import { useFinanceStore } from "@/hooks/useFinanceStore";
import HomeView from "./HomeView";
import AddView from "./AddView";
import AnalyticsView from "./AnalyticsView";
import HistoryView from "./HistoryView";
import SettingsView from "./SettingsView";

export default function FinanceShell() {
  const [currentView, setCurrentView] = useState<View>("home");
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    isLoading,
  } = useFinanceStore();

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
    { view: "analytics", icon: <PieChart size={22} />, label: "Analytics" },
    { view: "settings", icon: <Settings size={22} />, label: "Settings" },
  ];

  return (
    <div className="h-screen bg-white flex flex-col font-sans antialiased overflow-hidden">
      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div key={currentView} className="h-full">
          {renderView()}
        </div>
      </main>

      <FloatNav
        onPlus={() => setCurrentView("add")}
        gridItems={navItems.map(({ view, icon, label }) => ({
          label,
          icon,
          onClick: () => setCurrentView(view),
          active: currentView === view,
        }))}
      />
    </div>
  );
}
