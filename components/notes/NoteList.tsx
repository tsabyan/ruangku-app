"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Hash, Pin, Video, Globe, Copy, ExternalLink, Trash2, Check, ArrowUpRight } from "lucide-react";
import FloatNav from "@/components/ui/FloatNav";
import { formatDistanceToNow } from "date-fns";
import { useNoteStore } from "@/hooks/useNoteStore";
import { cn } from "@/lib/utils";
import SaveLinkModal from "./SaveLinkModal";
import { ConfirmModal } from "@/components/goals/ConfirmModal";

// Custom inline SVG brand icons
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3v6Z" fill="currentColor" />
  </svg>
);

const TiktokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

// Helper to determine if a note is a link note
const isLinkNote = (note: { content_text: string }) => {
  const text = note.content_text.trim();
  // Match single URL without whitespace
  return /^(https?:\/\/[^\s]+)$/i.test(text);
};

// Helper to get platform specific metadata
const getPlatformInfo = (urlStr: string) => {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    
    if (host.includes("instagram.com") || host.includes("ig.me")) {
      return { 
        name: "Instagram", 
        color: "bg-pink-50/70 text-pink-650 border-pink-100", 
        icon: <InstagramIcon className="w-3.5 h-3.5" /> 
      };
    }
    if (host.includes("tiktok.com")) {
      return { 
        name: "TikTok", 
        color: "bg-zinc-900 text-white border-zinc-900", 
        icon: <TiktokIcon className="w-3.5 h-3.5" /> 
      };
    }
    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      return { 
        name: "YouTube", 
        color: "bg-red-50/70 text-red-650 border-red-100", 
        icon: <YoutubeIcon className="w-3.5 h-3.5" /> 
      };
    }
    return { 
      name: host.replace("www.", ""), 
      color: "bg-zinc-50 text-zinc-500 border-zinc-100", 
      icon: <Globe className="w-3.5 h-3.5" /> 
    };
  } catch {
    return { 
      name: "Tautan", 
      color: "bg-zinc-50 text-zinc-500 border-zinc-100", 
      icon: <Globe className="w-3.5 h-3.5" /> 
    };
  }
};

export default function NoteList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notes, isLoading, getAllTags, addNote, deleteNote } = useNoteStore();
  
  // UI views: 'notes' (normal) or 'links' (saved URLs)
  const [view, setView] = useState<"notes" | "links">("notes");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Modals state
  const [isSaveLinkOpen, setIsSaveLinkOpen] = useState(false);
  const [sharedUrl, setSharedUrl] = useState("");
  const [sharedTitle, setSharedTitle] = useState("");
  
  // Clipboard copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete confirmation
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);

  // Detect and process shared parameters (from PWA Share Target)
  useEffect(() => {
    if (!searchParams) return;
    
    const titleParam = searchParams.get("title") || "";
    const textParam = searchParams.get("text") || "";
    const urlParam = searchParams.get("url") || "";

    let detectedUrl = "";

    // 1. Check url param
    if (urlParam && /^https?:\/\//i.test(urlParam.trim())) {
      detectedUrl = urlParam.trim();
    } 
    // 2. Otherwise search for URL inside text param
    else if (textParam) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const match = textParam.match(urlRegex);
      if (match) {
        detectedUrl = match[0];
      }
    }

    if (detectedUrl) {
      setSharedUrl(detectedUrl);
      
      // Prefill title if provided and not equal to the URL
      const cleanTitle = titleParam.trim();
      setSharedTitle(cleanTitle && cleanTitle !== detectedUrl ? cleanTitle : "");
      
      setView("links");
      setIsSaveLinkOpen(true);

      // Clean browser address bar query params to prevent repeating on refresh
      router.replace("/notes");
    }
  }, [searchParams, router]);

  // Separate normal notes and link notes
  const { normalNotes, savedLinks } = useMemo(() => {
    const norm: typeof notes = [];
    const links: typeof notes = [];
    notes.forEach((note) => {
      if (isLinkNote(note)) {
        links.push(note);
      } else {
        norm.push(note);
      }
    });
    return { normalNotes: norm, savedLinks: links };
  }, [notes]);

  const tags = getAllTags();

  // Filter lists based on search, selected tag, and view
  const currentItems = useMemo(() => {
    const listSource = view === "notes" ? normalNotes : savedLinks;
    
    const filtered = listSource.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.content_text.toLowerCase().includes(search.toLowerCase());
      const matchesTag = activeTag ? item.tags.includes(activeTag) : true;
      return matchesSearch && matchesTag;
    });

    return filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  }, [view, normalNotes, savedLinks, search, activeTag]);

  const handleCreateNote = async () => {
    const newNote = await addNote({
      title: "",
      content_html: "",
      content_text: "",
      tags: [],
    });
    if (newNote) router.push(`/notes/${newNote.id}`);
  };

  const handleSaveLink = async (data: { url: string; title: string; tags: string[] }) => {
    await addNote({
      title: data.title,
      content_html: `<p><a href="${data.url}" target="_blank" rel="noopener noreferrer">${data.url}</a></p>`,
      content_text: data.url,
      tags: data.tags,
    });
  };

  const handleCopyLink = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleDeleteLink = () => {
    if (linkToDelete) {
      deleteNote(linkToDelete);
      setLinkToDelete(null);
    }
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
      {/* Title */}
      <div className="px-6 pt-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Notes
        </h1>
      </div>

      {/* Segmented Control (Minimalist Tabs) */}
      <div className="px-6 flex border-b border-zinc-100 mt-4">
        <button
          onClick={() => {
            setView("notes");
            setActiveTag(null);
          }}
          className={cn(
            "flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all",
            view === "notes"
              ? "border-zinc-900 text-zinc-900 font-bold"
              : "border-transparent text-zinc-400 hover:text-zinc-650"
          )}
        >
          Catatan
        </button>
        <button
          onClick={() => {
            setView("links");
            setActiveTag(null);
          }}
          className={cn(
            "flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all",
            view === "links"
              ? "border-zinc-900 text-zinc-900 font-bold"
              : "border-transparent text-zinc-400 hover:text-zinc-650"
          )}
        >
          Tautan Tersimpan
        </button>
      </div>

      {/* Search Input */}
      <div className="px-6 pt-4 space-y-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 group-focus-within:text-zinc-900 transition-colors" />
          <input
            type="text"
            placeholder={view === "notes" ? "Search notes..." : "Cari tautan..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-zinc-200 focus:border-zinc-200 transition-all outline-none text-zinc-900 placeholder:text-zinc-300"
          />
        </div>
      </div>

      {/* Tag Filter */}
      <div className="px-6 py-3 overflow-x-auto flex gap-2 no-scrollbar border-b border-zinc-50 shrink-0">
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

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-28">
        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-zinc-350">
            <p className="text-sm font-medium">
              {search || activeTag
                ? "Tidak ada hasil yang ditemukan"
                : view === "notes"
                ? "Belum ada catatan"
                : "Belum ada tautan tersimpan"}
            </p>
            {!search && !activeTag && (
              <p className="text-xs mt-1 text-zinc-300">
                {view === "notes" ? "Ketuk + untuk menulis catatan baru" : "Ketuk + untuk menyimpan tautan baru"}
              </p>
            )}
          </div>
        ) : view === "notes" ? (
          /* Normal Notes Rendering */
          <div className="space-y-3" key={`notes__${search}__${activeTag}`}>
            {currentItems.map((note) => (
              <div
                key={note.id}
                onClick={() => router.push(`/notes/${note.id}`)}
                className="bg-white border border-zinc-100 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-zinc-200 active:scale-[0.98] transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-zinc-900 truncate flex-1 pr-4 flex items-center gap-1.5">
                    {note.pinned && (
                      <Pin className="w-3 h-3 text-zinc-400 shrink-0" />
                    )}
                    {note.title || (
                      <span className="text-zinc-350 font-normal italic">
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
                    <span className="italic text-zinc-300">Empty...</span>
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
              </div>
            ))}
          </div>
        ) : (
          /* Saved Links Rendering */
          <div className="space-y-3.5" key={`links__${search}__${activeTag}`}>
            {currentItems.map((link) => {
              const platform = getPlatformInfo(link.content_text);
              return (
                <div
                  key={link.id}
                  className="bg-white border border-zinc-100 p-4.5 rounded-3xl shadow-sm hover:shadow-md hover:border-zinc-200 transition-all flex flex-col justify-between gap-3 relative group"
                >
                  <div>
                    {/* Header of link card */}
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-lg flex items-center gap-1 shrink-0",
                        platform.color
                      )}>
                        {platform.icon}
                        {platform.name}
                      </span>
                      <span className="text-[9px] text-zinc-300 whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(link.updated_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-zinc-900 leading-snug line-clamp-1 mb-1">
                      {link.title}
                    </h3>

                    {/* Shortened URL */}
                    <a
                      href={link.content_text}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-zinc-400 hover:text-zinc-600 inline-flex items-center gap-1 break-all line-clamp-1"
                    >
                      {link.content_text.replace(/^https?:\/\//i, "")}
                      <ArrowUpRight className="w-3 h-3 text-zinc-300 group-hover:text-zinc-450 transition-colors shrink-0" />
                    </a>
                  </div>

                  {/* Footer (tags + action buttons) */}
                  <div className="flex items-center justify-between mt-1 pt-3 border-t border-zinc-50 gap-2">
                    <div className="flex flex-wrap gap-1 max-w-[65%]">
                      {link.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] bg-zinc-50 text-zinc-400 px-2 py-0.5 rounded-full border border-zinc-100"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyLink(link.id, link.content_text)}
                        className={cn(
                          "p-2 rounded-lg transition-all border",
                          copiedId === link.id
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                            : "bg-zinc-50 border-zinc-100 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                        )}
                        title={copiedId === link.id ? "Disalin!" : "Salin tautan"}
                      >
                        {copiedId === link.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={link.content_text}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg border bg-zinc-50 border-zinc-100 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-650 flex items-center justify-center"
                        title="Buka tautan asli"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setLinkToDelete(link.id)}
                        className="p-2 rounded-lg border bg-zinc-50 border-zinc-100 hover:bg-red-50 hover:border-red-100 text-zinc-400 hover:text-red-500 transition-colors"
                        title="Hapus tautan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Float Navigation */}
      <FloatNav onPlus={view === "notes" ? handleCreateNote : () => setIsSaveLinkOpen(true)} />

      {/* Save Link Modal */}
      <SaveLinkModal
        isOpen={isSaveLinkOpen}
        onClose={() => {
          setIsSaveLinkOpen(false);
          setSharedUrl("");
          setSharedTitle("");
        }}
        onSave={handleSaveLink}
        existingTags={tags}
        initialUrl={sharedUrl}
        initialTitle={sharedTitle}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!linkToDelete}
        title="Hapus tautan?"
        message="Tautan yang disimpan akan dihapus secara permanen dan tidak dapat dikembalikan."
        confirmLabel="Hapus"
        confirmVariant="danger"
        onConfirm={handleDeleteLink}
        onCancel={() => setLinkToDelete(null)}
      />
    </div>
  );
}

