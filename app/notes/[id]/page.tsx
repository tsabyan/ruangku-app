'use client';

import dynamic from 'next/dynamic';

// ssr: false — avoids TipTap SSR issues (TipTap requires browser APIs)
const NoteEditor = dynamic(() => import('@/components/notes/NoteEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-400 rounded-full animate-spin" />
        <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Loading...</p>
      </div>
    </div>
  ),
});

export default function NoteEditorPage() {
  return <NoteEditor />;
}
