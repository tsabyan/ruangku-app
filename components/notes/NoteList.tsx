"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Hash, Pin } from "lucide-react";
import ModuleHeader from "@/components/ui/ModuleHeader";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { useNoteStore } from "@/hooks/useNoteStore";
import { cn } from "@/lib/utils";

export default function NoteList() {
  const router = useRouter();
  const { notes, isLoading, getAllTags, addNote } = useNoteStore();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = getAllTags();

  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(search.toLowerCase()) ||
        note.content_text.toLowerCase().includes(search.toLowerCase());
      const matchesTag = activeTag ? note.tags.includes(activeTag) : true;
      return matchesSearch && matchesTag;
    });
    return filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [notes, search, activeTag]);

  const handleCreateNote = async () => {
    const newNote = await addNote({
      title: "",
      content_html: "",
      content_text: "",
      tags: [],
    });
    if (newNote) router.push(`/notes/${newNote.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-400 rounded-full animate-spin" />
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <ModuleHeader />

      {/* Content title + search */}
      <div className="px-6 pt-6 pb-4 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Notes
        </h1>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-zinc-200 focus:border-zinc-200 transition-all outline-none text-zinc-900 placeholder:text-zinc-300"
          />
        </div>
      </div>
      {/* Tag Filter */}
      <div className="px-6 py-3 overflow-x-auto flex gap-2 no-scrollbar border-b border-zinc-50">
        <button
          onClick={() => setActiveTag(null)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
            activeTag === null
              ? "bg-zinc-900 text-white"
              : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100",
          )}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all",
              activeTag === tag
                ? "bg-zinc-900 text-white"
                : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100",
            )}
          >
            <Hash className="w-3 h-3" />
            {tag}
          </button>
        ))}
      </div>
      {/* Notes List */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-28">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-300">
            <p className="text-sm font-medium">
              {search || activeTag ? "No notes found" : "No notes yet"}
            </p>
            {!search && !activeTag && (
              <p className="text-xs mt-1">Tap + to start writing</p>
            )}
          </div>
        ) : (
          <div className="space-y-3" key={`${search}__${activeTag}`}>
            {filteredNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="bg-white border border-zinc-100 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-zinc-200 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-zinc-900 truncate flex-1 pr-4 flex items-center gap-1.5">
                    {note.pinned && (
                      <Pin className="w-3 h-3 text-zinc-400 shrink-0" />
                    )}
                    {note.title || (
                      <span className="text-zinc-300 font-normal italic">
                        Untitled note
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] text-zinc-300 whitespace-nowrap shrink-0">
                    {formatDistanceToNow(new Date(note.updated_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed min-h-10">
                  {note.content_text || (
                    <span className="italic">Empty...</span>
                  )}
                </p>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-zinc-50 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-100"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {/* FAB */}
      <button
        onClick={handleCreateNote}
        className="fixed bottom-8 bg-zinc-900 text-white p-4 rounded-full shadow-2xl shadow-zinc-400/30 active:scale-90 hover:scale-105 transition-all z-20 group"
        style={{ right: "max(1.5rem, calc(50% - 14rem + 1.5rem))" }}
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}
