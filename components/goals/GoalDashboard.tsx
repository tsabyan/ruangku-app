"use client";

import { useState, FormEvent } from "react";
import { Edit2, PauseCircle, CheckCircle2, MoreVertical, Flame, Target } from "lucide-react";
import { Goal, GoalStatus } from "@/types/goals";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/goals/ConfirmModal";
import FloatNav from "@/components/ui/FloatNav";
import { useRouter } from "next/navigation";

interface DashboardProps {
  goals: Goal[];
  currentFilter: GoalStatus;
  onSetFilter: (s: GoalStatus) => void;
  onAddGoal: (title: string) => void;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
}

export function GoalDashboard({
  goals,
  currentFilter,
  onSetFilter,
  onAddGoal,
  onUpdateGoal,
}: DashboardProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalToAchieve, setGoalToAchieve] = useState<Goal | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filtered = [...goals]
    .filter((g) => g.status === currentFilter)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newGoalTitle.trim()) {
      onAddGoal(newGoalTitle.trim());
      setNewGoalTitle("");
      setIsAdding(false);
    }
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingGoal?.title.trim()) {
      onUpdateGoal(editingGoal.id, { title: editingGoal.title.trim() });
      setEditingGoal(null);
    }
  };

  const filters: { label: string; value: GoalStatus }[] = [
    { label: "Active", value: "ongoing" },
    { label: "Pending", value: "pending" },
    { label: "Achieved", value: "achieved" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Content */}
      <div className="flex-1 px-6 pt-6 pb-28 space-y-4">
        {/* Title + filters */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Goals
          </h1>
          <div className="flex p-1 bg-zinc-100 rounded-xl">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => onSetFilter(f.value)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-bold uppercase tracking-widest transition-all rounded-lg",
                  currentFilter === f.value
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-600",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-zinc-100 rounded-3xl mt-4">
            <p className="text-zinc-300 text-sm font-medium italic">
              {currentFilter === "ongoing"
                ? "No active goals yet. Start something great!"
                : currentFilter === "pending"
                  ? "No pending goals."
                  : "No achieved goals yet."}
            </p>
          </div>
        )}
        {filtered.map((goal) => (
          <div key={goal.id} className="relative">
            <div className="flex items-center justify-between p-4 bg-white border border-zinc-100 rounded-2xl hover:border-zinc-200 transition-all shadow-sm group">
              <button
                onClick={() => router.push(`/goals/${goal.id}`)}
                className="flex-1 text-left"
              >
                <span className="font-semibold text-zinc-800 text-base">
                  {goal.title}
                </span>
                {goal.status === "achieved" && (
                  <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                    ✓ Achieved
                  </span>
                )}
              </button>
              {/* Context menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === goal.id ? null : goal.id);
                  }}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    activeMenuId === goal.id
                      ? "bg-zinc-100"
                      : "text-zinc-300 hover:text-zinc-600",
                  )}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <>
                  {activeMenuId === goal.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-0 mt-1 w-44 bg-white border border-zinc-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                        {goal.status !== "achieved" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGoal(goal);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
                          >
                            <Edit2 className="w-4 h-4 text-zinc-400" />
                            <span>Edit name</span>
                          </button>
                        )}
                        {goal.status === "ongoing" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateGoal(goal.id, { status: "pending" });
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
                            >
                              <PauseCircle className="w-4 h-4 text-amber-500" />
                              <span>Pause goal</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGoalToAchieve(goal);
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 border-t border-zinc-50"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span className="font-semibold">
                                Mark as achieved
                              </span>
                            </button>
                          </>
                        )}
                        {goal.status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateGoal(goal.id, { status: "ongoing" });
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
                          >
                            <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                            <span>Resume goal</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achieve confirm */}
      <ConfirmModal
        isOpen={!!goalToAchieve}
        title="Mark as Achieved?"
        message={`Are you sure you've achieved "${goalToAchieve?.title}"? It will be moved to your achieved list.`}
        confirmLabel="Achieve!"
        confirmVariant="success"
        onConfirm={() => {
          if (goalToAchieve) {
            onUpdateGoal(goalToAchieve.id, { status: "achieved" });
            setGoalToAchieve(null);
          }
        }}
        onCancel={() => setGoalToAchieve(null)}
      />

      {/* Add / Edit modal */}
      {(isAdding || editingGoal) && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) { setIsAdding(false); setEditingGoal(null); } }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/20 backdrop-blur-sm"
        >
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 text-center">
              {editingGoal ? "Edit Goal" : "New Goal"}
            </h2>
            <form
              onSubmit={editingGoal ? handleEditSubmit : handleSubmit}
              className="space-y-8"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-3 tracking-widest uppercase">
                  Goal Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={editingGoal ? editingGoal.title : newGoalTitle}
                  onChange={(e) =>
                    editingGoal
                      ? setEditingGoal({
                          ...editingGoal,
                          title: e.target.value,
                        })
                      : setNewGoalTitle(e.target.value)
                  }
                  placeholder="e.g. Learn Piano..."
                  className="w-full px-0 py-2 border-b-2 border-zinc-100 focus:border-zinc-900 outline-none transition-colors text-lg font-medium"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingGoal(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-600 font-semibold hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-zinc-900 text-white font-semibold hover:bg-zinc-800 transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FloatNav
        onPlus={() => setIsAdding(true)}
        gridItems={[
          {
            label: "Goals",
            icon: <Target size={22} />,
            onClick: () => router.push("/goals"),
            active: true,
          },
          {
            label: "Habits",
            icon: <Flame size={22} />,
            onClick: () => router.push("/goals/habits"),
            active: false,
          },
        ]}
      />
    </div>
  );
}
