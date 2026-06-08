"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Hash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface SaveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { url: string; title: string; tags: string[] }) => void;
  existingTags: string[];
  initialUrl?: string;
  initialTitle?: string;
}

export default function SaveLinkModal({
  isOpen,
  onClose,
  onSave,
  existingTags,
  initialUrl = "",
  initialTitle = "",
}: SaveLinkModalProps) {
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Sync initial values when they change (e.g. from shared parameters)
  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
    if (initialTitle) setTitle(initialTitle);
  }, [initialUrl, initialTitle]);

  // Reset form when opening/closing
  useEffect(() => {
    if (isOpen) {
      if (!initialUrl) setUrl("");
      if (!initialTitle) setTitle("");
      setSelectedTags([]);
      setError("");
      setTagInput("");
    }
  }, [isOpen, initialUrl, initialTitle]);

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase().replace(/#/g, "");
    if (cleanTag && !selectedTags.includes(cleanTag)) {
      setSelectedTags((prev) => [...prev, cleanTag]);
      setTagInput("");
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    let cleanUrl = url.trim();
    if (!cleanUrl) {
      setError("Tautan (URL) wajib diisi");
      return;
    }

    // Add protocol if missing
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = "https://" + cleanUrl;
    }

    // Basic URL validation
    try {
      new URL(cleanUrl);
    } catch (e) {
      setError("Format tautan tidak valid");
      return;
    }

    let finalTitle = title.trim();
    if (!finalTitle) {
      // Default title based on URL domain
      try {
        const parsedUrl = new URL(cleanUrl);
        let domain = parsedUrl.hostname.replace("www.", "");
        if (domain.includes("instagram.com")) domain = "Instagram Reel/Post";
        else if (domain.includes("tiktok.com")) domain = "TikTok Video";
        else if (domain.includes("youtube.com") || domain.includes("youtu.be")) domain = "YouTube Video";
        finalTitle = `Tautan ${domain}`;
      } catch {
        finalTitle = "Tautan Tersimpan";
      }
    }

    onSave({
      url: cleanUrl,
      title: finalTitle,
      tags: selectedTags,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[400px] bg-white rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl border border-zinc-100 max-h-[85vh] overflow-y-auto z-10"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900">Simpan Tautan</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-50 text-zinc-400 hover:text-zinc-900 active:scale-95 transition-all"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 text-xs font-semibold text-red-500 bg-red-50 px-4 py-2.5 rounded-2xl border border-red-100">
                {error}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Tautan / URL *
                </label>
                <input
                  type="text"
                  placeholder="https://instagram.com/reel/..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError("");
                  }}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 transition-all text-zinc-900 placeholder:text-zinc-350"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Judul (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Beri judul tautan ini"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100 transition-all text-zinc-900 placeholder:text-zinc-350"
                />
              </div>

              {/* Tagging */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Label / Tags
                </label>

                {/* Input New Tag */}
                <form
                  onSubmit={handleAddCustomTag}
                  className="flex gap-2 mb-3"
                >
                  <input
                    type="text"
                    placeholder="Tambah label baru..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-300 transition-all text-zinc-900 placeholder:text-zinc-350"
                  />
                  <button
                    type="submit"
                    className="bg-zinc-900 text-white rounded-xl px-3.5 flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                {/* Selected Tags list */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {selectedTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className="text-xs bg-zinc-900 text-white border border-zinc-900 px-3 py-1 rounded-full flex items-center gap-1 transition-all hover:bg-red-650 hover:border-red-650 hover:text-white"
                        title="Klik untuk menghapus"
                      >
                        <Hash className="w-3 h-3" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Existing Tags suggestion */}
                {existingTags.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                      Pilih Label Terdaftar:
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                      {existingTags
                        .filter((tag) => !selectedTags.includes(tag))
                        .map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className="text-xs bg-zinc-50 hover:bg-zinc-100 text-zinc-500 border border-zinc-100 hover:border-zinc-200 px-2.5 py-1 rounded-full flex items-center gap-1 transition-all"
                          >
                            <Hash className="w-2.5 h-2.5 text-zinc-350" />
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-zinc-50 text-zinc-500 font-semibold py-3 rounded-2xl text-sm border border-zinc-100 hover:bg-zinc-100 transition-all active:scale-[0.98]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 bg-zinc-900 text-white font-semibold py-3 rounded-2xl text-sm hover:bg-zinc-800 transition-all active:scale-[0.98]"
              >
                Simpan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
