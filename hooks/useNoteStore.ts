"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Note } from "@/types/notes";

export function useNoteStore() {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (data) {
        setNotes(
          data.map((n) => ({
            id: n.id,
            title: n.title ?? "",
            content_html: n.content_html ?? "",
            content_text: n.content_text ?? "",
            tags: n.tags ?? [],
            updated_at: n.updated_at,
            pinned: n.pinned ?? false,
          })),
        );
      }
      setIsLoading(false);
    };

    init();
  }, []);

  const addNote = useCallback(
    async (note: Omit<Note, "id" | "updated_at">) => {
      if (!userId) return;
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: userId,
          title: note.title,
          content_html: note.content_html,
          content_text: note.content_text,
          tags: note.tags,
        })
        .select()
        .single();

      if (!error && data) {
        const newNote: Note = {
          id: data.id,
          title: data.title ?? "",
          content_html: data.content_html ?? "",
          content_text: data.content_text ?? "",
          tags: data.tags ?? [],
          updated_at: data.updated_at,
          pinned: data.pinned ?? false,
        };
        setNotes((prev) => [newNote, ...prev]);
        return newNote;
      }
    },
    [userId],
  );

  const updateNote = useCallback(async (id: string, updates: Partial<Note>) => {
    const now = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, ...updates, updated_at: now } : n,
      ),
    );
    await supabase
      .from("notes")
      .update({
        ...updates,
        updated_at: now,
      })
      .eq("id", id);
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from("notes").delete().eq("id", id);
  }, []);

  const getNote = useCallback(
    (id: string) => {
      return notes.find((n) => n.id === id);
    },
    [notes],
  );

  const getAllTags = useCallback(() => {
    const tags = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [notes]);

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
    getNote,
    getAllTags,
  };
}
