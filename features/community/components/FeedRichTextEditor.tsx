"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { useRef } from "react";

import { cn } from "@/lib/utils/cn";

export function isRichTextEmpty(html: string) {
  if (/<img\b/i.test(html)) return false;
  const text = html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u200b/g, "")
    .trim();
  return text.length === 0;
}

type FeedRichTextEditorProps = {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-40",
        active && "bg-neutral-200/90 text-neutral-900",
      )}
    >
      {children}
    </button>
  );
}

export function FeedRichTextEditor({
  id,
  value,
  onChange,
  placeholder = "Share your take…",
  className,
}: FeedRichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: { HTMLAttributes: { class: "list-disc pl-5 my-2" } },
        orderedList: { HTMLAttributes: { class: "list-decimal pl-5 my-2" } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#FF5722] underline underline-offset-2" },
      }),
      Image.configure({
        HTMLAttributes: { class: "my-2 max-h-48 max-w-full rounded-lg object-contain" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        class: cn(
          "min-h-[140px] px-4 py-3 text-sm text-neutral-900 outline-none",
          "prose-p:my-1",
        ),
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  if (!editor) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-2xl border border-neutral-200/90 bg-orange-50/70",
          "h-[188px] w-full",
          className,
        )}
      />
    );
  }

  const openImagePicker = () => {
    imageInputRef.current?.click();
  };

  const onImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      editor.chain().focus().setImage({ src }).run();
    };
    reader.readAsDataURL(file);
  };

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-neutral-200/90 bg-orange-50/70 ring-0 transition focus-within:ring-2 focus-within:ring-[#FF5722]/25",
        className,
      )}
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={onImageFileChange}
      />
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-neutral-200/80 bg-white/85 px-2 py-1.5"
      >
        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <span className="text-sm font-bold">B</span>
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
        <ToolbarButton title="Insert image from device" onClick={openImagePicker}>
          <ImageIcon className="h-4 w-4" strokeWidth={2.25} />
        </ToolbarButton>
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          // Keep the composer layout stable: scroll inside editor, not the whole modal section
          "max-h-[260px] overflow-y-auto",
          "[&_.ProseMirror]:min-h-[140px]",
          "[&_.ProseMirror]:max-h-[260px]",
          "[&_.ProseMirror]:overflow-y-auto",
          "[&_.ProseMirror]:px-4 [&_.ProseMirror]:py-3",
          "[&_.ProseMirror]:text-sm [&_.ProseMirror]:text-neutral-900",
          "[&_.ProseMirror]:outline-none",
          // Keep uploaded images from taking over the whole editor (first screenshot issue)
          "[&_.ProseMirror_img]:my-2",
          "[&_.ProseMirror_img]:max-h-40",
          "[&_.ProseMirror_img]:max-w-full",
          "[&_.ProseMirror_img]:h-auto",
          "[&_.ProseMirror_img]:w-auto",
          "[&_.ProseMirror_img]:rounded-lg",
          "[&_.ProseMirror_img]:object-contain",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-neutral-400",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
          "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
        )}
      />
    </div>
  );
}
