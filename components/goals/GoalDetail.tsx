"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  Plus,
  Check,
  History,
  Edit2,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Goal, Task } from "@/types/goals";
import { cn, getTodayStr } from "@/lib/utils";

import { TaskHeatmap } from "@/components/goals/TaskHeatmap";
import { ConfirmModal } from "@/components/goals/ConfirmModal";
import ModuleHeader from "@/components/ui/ModuleHeader";

interface GoalDetailProps {
  goal: Goal;
  tasks: Task[];
  onUpdateGoal: (updates: Partial<Goal>) => void;
  onDeleteGoal: () => void;
  onAddTask: (title: string, recurring: number[]) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function GoalDetail({
  goal,
  tasks,
  onUpdateGoal,
  onDeleteGoal,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
}: GoalDetailProps) {
  const [logText, setLogText] = useState(goal.achievement_log_text);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [expandedTaskTitle, setExpandedTaskTitle] = useState<string | null>(
    null,
  );
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isDeletingGoal, setIsDeletingGoal] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayStr = getTodayStr();
  const todayDay = new Date().getDay();
  const daysShort = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const dailyTasks = tasks.filter((t) => {
    if (t.goal_id !== goal.id) return false;
    return (
      t.recurring_days.length === 0 ||
      t.recurring_days.includes(todayDay) ||
      t.current_due_date === todayStr
    );
  });

  const handleLogChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setLogText(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(
      () => onUpdateGoal({ achievement_log_text: val }),
      1000,
    );
  };

  const handleAddTaskSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), recurringDays);
      setNewTaskTitle("");
      setRecurringDays([]);
      setIsAddingTask(false);
    }
  };

  const handleEditTaskSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (editingTask?.title.trim()) {
      onUpdateTask(editingTask.id, {
        title: editingTask.title.trim(),
        recurring_days: recurringDays,
      });
      setEditingTask(null);
      setRecurringDays([]);
    }
  };

  const toggleDay = (day: number) =>
    setRecurringDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <ModuleHeader backHref="/goals" backLabel="Goals" />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 space-y-8">
        {/* Title row */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 leading-tight">
            {goal.title}
          </h1>
          {goal.status !== "achieved" && (
            <button
              onClick={() => setIsDeletingGoal(true)}
              className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors shrink-0 mt-1"
            >
              Delete
            </button>
          )}
        </div>
        {/* Achievement Log */}
        <section className="space-y-3">
          <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Achievement Log
          </h2>
          <textarea
            value={logText}
            onChange={handleLogChange}
            onBlur={() => onUpdateGoal({ achievement_log_text: logText })}
            readOnly={goal.status === "achieved"}
            placeholder={
              goal.status === "achieved"
                ? "Goal achieved! Write your reflection here."
                : "Write reflections, small wins, or notes..."
            }
            className={cn(
              "w-full min-h-35 p-5 bg-zinc-50 border border-transparent rounded-2xl outline-none transition-all text-zinc-700 leading-relaxed resize-none text-sm",
              goal.status !== "achieved" &&
                "focus:border-zinc-100 focus:bg-white",
              goal.status === "achieved" &&
                "cursor-default text-zinc-500 italic",
            )}
          />
        </section>

        {/* Today's Focus */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Today&apos;s Focus
            </h2>
            {goal.status === "ongoing" && (
              <button
                onClick={() => {
                  setIsAddingTask(true);
                  setRecurringDays([]);
                }}
                className="p-1 text-zinc-300 hover:text-zinc-900 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {dailyTasks.length === 0 && (
              <p className="text-zinc-300 text-sm italic py-2">
                No focus tasks for today yet.
              </p>
            )}
            {dailyTasks.map((task) => {
              const isScheduledToday =
                task.recurring_days.length === 0 ||
                task.recurring_days.includes(todayDay);
              const canAction = goal.status === "ongoing" && isScheduledToday;
              return (
                <div key={task.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 group">
                    {/* Toggle */}
                    <button
                      disabled={!canAction}
                      onClick={() => onToggleTask(task.id)}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        task.is_completed
                          ? "bg-zinc-900 border-zinc-900"
                          : "border-zinc-200",
                        !canAction &&
                          !task.is_completed &&
                          "bg-zinc-50 cursor-not-allowed",
                      )}
                    >
                      {task.is_completed && (
                        <Check className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                    {/* Info */}
                    <div
                      onClick={() =>
                        setExpandedTaskTitle(
                          expandedTaskTitle === task.title ? null : task.title,
                        )
                      }
                      className="flex-1 cursor-pointer py-1"
                    >
                      <span
                        className={cn(
                          "text-base transition-all",
                          task.is_completed
                            ? "text-zinc-400 line-through"
                            : "text-zinc-700 font-medium",
                          !isScheduledToday &&
                            !task.is_completed &&
                            "text-zinc-400 font-normal",
                        )}
                      >
                        {task.title}
                      </span>
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {task.recurring_days.length === 0 ? (
                          <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 uppercase px-1.5 py-0.5 rounded-sm tracking-wider">
                            Every day
                          </span>
                        ) : (
                          task.recurring_days.sort().map((d) => (
                            <span
                              key={d}
                              className={cn(
                                "text-[9px] font-bold uppercase px-1 py-0.5 rounded-sm",
                                d === todayDay
                                  ? "bg-zinc-200 text-zinc-900"
                                  : "bg-zinc-100 text-zinc-400",
                              )}
                            >
                              {dayNames[d]}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    {/* Menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(
                            activeMenuId === task.id ? null : task.id,
                          );
                        }}
                        className={cn(
                          "p-2 rounded-full transition-colors",
                          activeMenuId === task.id
                            ? "bg-zinc-100"
                            : "text-zinc-200 hover:text-zinc-600",
                        )}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeMenuId === task.id && (
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
                                  setEditingTask(task);
                                  setRecurringDays(task.recurring_days);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
                              >
                                <Edit2 className="w-4 h-4 text-zinc-400" />
                                <span>Edit task</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedTaskTitle(
                                  expandedTaskTitle === task.title
                                    ? null
                                    : task.title,
                                );
                                setActiveMenuId(null);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50"
                            >
                              <History className="w-4 h-4 text-zinc-400" />
                              <span>View history</span>
                            </button>
                            {goal.status !== "achieved" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDeleteId(task.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 border-t border-zinc-50"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                                <span>Delete task</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {/* Heatmap */}
                  {expandedTaskTitle === task.title && (
                    <TaskHeatmap
                      taskTitle={task.title}
                      history={tasks.filter(
                        (t) => t.goal_id === goal.id && t.title === task.title,
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={isDeletingGoal}
        title="Delete Goal?"
        message={`Are you sure you want to delete "${goal.title}" and all its tasks?`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={onDeleteGoal}
        onCancel={() => setIsDeletingGoal(false)}
      />
      <ConfirmModal
        isOpen={!!taskToDeleteId}
        title="Delete Task?"
        message="This task will be removed from your daily focus."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          if (taskToDeleteId) {
            onDeleteTask(taskToDeleteId);
            setTaskToDeleteId(null);
          }
        }}
        onCancel={() => setTaskToDeleteId(null)}
      />

      {/* Add/Edit Task Modal */}
      {(isAddingTask || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-zinc-900/20 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl space-y-6 mb-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-zinc-900">Focus Item</h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {editingTask ? "Edit Task" : "New Task"}
              </p>
            </div>
            <form
              onSubmit={
                editingTask ? handleEditTaskSubmit : handleAddTaskSubmit
              }
              className="space-y-8"
            >
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-3 tracking-widest uppercase">
                  Task Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={editingTask ? editingTask.title : newTaskTitle}
                  onChange={(e) =>
                    editingTask
                      ? setEditingTask({
                          ...editingTask,
                          title: e.target.value,
                        })
                      : setNewTaskTitle(e.target.value)
                  }
                  placeholder="e.g. Meditate 10 minutes..."
                  className="w-full px-0 py-2 border-b-2 border-zinc-100 focus:border-zinc-900 outline-none transition-colors text-lg"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-bold text-zinc-400 tracking-widest uppercase">
                  Recurring Days
                </label>
                <div className="flex justify-between">
                  {daysShort.map((d, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all border",
                        recurringDays.includes(i)
                          ? "bg-zinc-900 border-zinc-900 text-white"
                          : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200 shadow-sm",
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-300 uppercase tracking-widest text-center">
                  Leave empty = every day
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    setEditingTask(null);
                    setRecurringDays([]);
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
    </div>
  );
}
