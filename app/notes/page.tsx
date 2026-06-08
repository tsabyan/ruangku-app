import { Suspense } from "react";
import NoteList from "@/components/notes/NoteList";

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-400 rounded-full animate-spin" />
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <NoteList />
    </Suspense>
  );
}
