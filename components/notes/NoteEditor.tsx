"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  startTransition,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MoreVertical,
  Pin,
  PinOff,
  Tag,
  Trash2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Check,
  Cloud,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ModuleHeader from "@/components/ui/ModuleHeader";
import { ConfirmModal } from "@/components/goals/ConfirmModal";
import { useNoteStore } from "@/hooks/useNoteStore";
import { useDebounce } from "use-debounce";
import { cn } from "@/lib/utils";

export default function NoteEditor() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { getNote, updateNote, deleteNote, isLoading } = useNoteStore();
  const note = getNote(id);

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasEdited, setHasEdited] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTagsPanel, setShowTagsPanel] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const alignMenuRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef(false);
  const editorSeededRef = useRef(false);
  const isSeedingRef = useRef(false);
  const [title, setTitle] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  // Once the note is available (after async load), seed title/tags/editor
  useEffect(() => {
    if (note && !seededRef.current) {
      seededRef.current = true;
      setTitle(note.title || "");
      setTagsInput(note.tags.join(" ") || "");
    }
  }, [note]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        alignMenuRef.current &&
        !alignMenuRef.current.contains(e.target as Node)
      ) {
        setShowAlignMenu(false);
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showAlignMenu || showMenu)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAlignMenu, showMenu]);

  const saveToStore = useCallback(
    (
      html: string,
      text: string,
      currentTitle: string,
      currentTagsInput: string,
    ) => {
      if (!id) return;
      let finalTitle = currentTitle.trim();
      if (!finalTitle) {
        finalTitle = text.trim().split("\n")[0]?.trim().slice(0, 50) || "";
      }
      const textTags = text.match(/#(\w+)/g)?.map((m) => m.slice(1)) || [];
      const manualTags = currentTagsInput
        .split(/[ ,]+/)
        .filter((t) => t.length > 0)
        .map((t) => t.replace(/^#/, ""));
      const allTags = Array.from(new Set([...textTags, ...manualTags]));
      updateNote(id, {
        title: finalTitle,
        content_html: html,
        content_text: text,
        tags: allTags,
      });
      startTransition(() => {
        setSaving(false);
        setLastSaved(new Date());
      });
    },
    [id, updateNote],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2] } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: note?.content_html || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc max-w-none focus:outline-none min-h-[50vh] px-6 pb-32 text-zinc-800 leading-relaxed",
      },
    },
    onUpdate: () => {
      if (isSeedingRef.current) return;
      setHasEdited(true);
      setSaving(true);
    },
  });

  // If editor was created before note loaded, seed content once note arrives
  useEffect(() => {
    if (editor && note && !editorSeededRef.current) {
      editorSeededRef.current = true;
      if (note.content_html && editor.isEmpty) {
        isSeedingRef.current = true;
        editor.commands.setContent(note.content_html);
        isSeedingRef.current = false;
      }
    }
  }, [editor, note]);

  const [debouncedHtml] = useDebounce(editor?.getHTML() || "", 1000);
  const [debouncedText] = useDebounce(editor?.getText() || "", 1000);
  const [debouncedTitle] = useDebounce(title, 1000);
  const [debouncedTags] = useDebounce(tagsInput, 1000);

  useEffect(() => {
    if (editor && hasEdited)
      saveToStore(debouncedHtml, debouncedText, debouncedTitle, debouncedTags);
  }, [
    debouncedHtml,
    debouncedText,
    debouncedTitle,
    debouncedTags,
    editor,
    hasEdited,
    saveToStore,
  ]);

  const handleDelete = () => {
    if (id) {
      deleteNote(id);
      router.push("/notes");
    }
  };

  const handleTogglePin = () => {
    if (id) {
      updateNote(id, { pinned: !note?.pinned });
    }
    setShowMenu(false);
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

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-zinc-400 text-sm">Note not found</p>
        <button
          onClick={() => router.push("/notes")}
          className="text-zinc-900 font-semibold text-sm underline"
        >
          Back to notes
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col h-screen bg-white"
    >
      {/* Header */}
      <ModuleHeader
        backHref="/notes"
        backLabel="Notes"
        right={
          <div className="flex items-center gap-2">
            {hasEdited && (
              <div className="text-[10px] uppercase tracking-widest font-bold text-zinc-300">
                {saving ? (
                  <span className="flex items-center gap-1">
                    <Cloud className="w-3 h-3 animate-pulse" /> Saving...
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-emerald-500">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                ) : null}
              </div>
            )}
            {/* 3-dot menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-all"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-zinc-100 py-1 z-50 min-w-40"
                  >
                    <button
                      onClick={handleTogglePin}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      {note?.pinned ? (
                        <PinOff className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <Pin className="w-4 h-4 text-zinc-400" />
                      )}
                      {note?.pinned ? "Unpin note" : "Pin note"}
                    </button>
                    <button
                      onClick={() => {
                        setShowTagsPanel((v) => !v);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                    >
                      <Tag className="w-4 h-4 text-zinc-400" />
                      Edit tags
                    </button>
                    <div className="mx-3 border-t border-zinc-50" />
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete note
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        }
      />

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete note?"
        message="This note will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Tags panel */}
      <AnimatePresence>
        {showTagsPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-zinc-100 bg-zinc-50"
          >
            <div className="px-6 py-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="tags, separate with spaces"
                value={tagsInput}
                onChange={(e) => {
                  setHasEdited(true);
                  setTagsInput(e.target.value);
                  setSaving(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setShowTagsPanel(false);
                }}
                className="flex-1 text-sm outline-none bg-transparent placeholder:text-zinc-300 text-zinc-700"
              />
              <button
                onClick={() => setShowTagsPanel(false)}
                className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Done
              </button>
            </div>
            {tagsInput.trim() && (
              <div className="px-6 pb-3 flex flex-wrap gap-1.5">
                {tagsInput
                  .split(/[ ,]+/)
                  .filter(Boolean)
                  .map((t) => (
                    <span
                      key={t}
                      className="text-[11px] bg-white border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full"
                    >
                      #{t.replace(/^#/, "")}
                    </span>
                  ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 pt-6 pb-2 space-y-3">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => {
              setHasEdited(true);
              setTitle(e.target.value);
              setSaving(true);
            }}
            className="w-full text-3xl font-bold tracking-tight text-zinc-900 placeholder:text-zinc-200 outline-none border-none bg-transparent"
          />
          {note.tags.length > 0 && !showTagsPanel && (
            <div className="flex flex-wrap gap-1.5">
              {note.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] bg-zinc-50 border border-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 pb-2">
          <hr className="border-zinc-50" />
        </div>
        <EditorContent editor={editor} />
      </div>

      {/* Fixed Bottom Toolbar */}
      {editor && (
        <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-zinc-100 px-4 py-3 flex gap-1 justify-around items-center z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
          {/* Text format */}
          <div className="flex gap-1 items-center">
            <ToolbarBtn
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-4 h-4" />
            </ToolbarBtn>
          </div>
          <div className="w-px h-5 bg-zinc-100" />
          {/* Headings */}
          <div className="flex gap-1 items-center">
            <ToolbarBtn
              active={editor.isActive("heading", { level: 1 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarBtn>
          </div>
          <div className="w-px h-5 bg-zinc-100" />
          {/* Lists */}
          <div className="flex gap-1 items-center">
            <ToolbarBtn
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="w-4 h-4" />
            </ToolbarBtn>
            <ToolbarBtn
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarBtn>
          </div>
          <div className="w-px h-5 bg-zinc-100" />
          {/* Align */}
          <div className="relative" ref={alignMenuRef}>
            <ToolbarBtn
              active={false}
              onClick={() => setShowAlignMenu(!showAlignMenu)}
            >
              {editor.isActive({ textAlign: "center" }) ? (
                <AlignCenter className="w-4 h-4" />
              ) : editor.isActive({ textAlign: "right" }) ? (
                <AlignRight className="w-4 h-4" />
              ) : editor.isActive({ textAlign: "justify" }) ? (
                <AlignJustify className="w-4 h-4" />
              ) : (
                <AlignLeft className="w-4 h-4" />
              )}
            </ToolbarBtn>
            <AnimatePresence>
              {showAlignMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95, x: "-50%" }}
                  animate={{ opacity: 1, y: -4, scale: 1, x: "-50%" }}
                  exit={{ opacity: 0, y: 8, scale: 0.95, x: "-50%" }}
                  className="absolute bottom-full left-1/2 mb-2 bg-white rounded-xl shadow-xl border border-zinc-100 p-1 flex flex-col gap-1 z-50"
                >
                  {[
                    { align: "left", icon: <AlignLeft className="w-4 h-4" /> },
                    {
                      align: "center",
                      icon: <AlignCenter className="w-4 h-4" />,
                    },
                    {
                      align: "right",
                      icon: <AlignRight className="w-4 h-4" />,
                    },
                    {
                      align: "justify",
                      icon: <AlignJustify className="w-4 h-4" />,
                    },
                  ].map(({ align, icon }) => (
                    <button
                      key={align}
                      onClick={() => {
                        editor.chain().focus().setTextAlign(align).run();
                        setShowAlignMenu(false);
                      }}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        editor.isActive({ textAlign: align })
                          ? "bg-zinc-100 text-zinc-900"
                          : "text-zinc-400 hover:bg-zinc-50",
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ToolbarBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg transition-colors active:scale-90",
        active ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:bg-zinc-50",
      )}
    >
      {children}
    </button>
  );
}
