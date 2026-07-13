"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Todo {
  id: string;
  title: string;
  description: string;
  emoji: string;
  status: "pending" | "completed";
}

interface TodoCardProps {
  todo: Todo;
  onToggleStatus: (todo: Todo) => void;
  onDelete: (todo: Todo) => void;
  onUpdateTitle: (todoId: string, title: string) => void;
  onUpdateDescription: (todoId: string, description: string) => void;
  onUpdateEmoji: (todoId: string, emoji: string) => void;
}

const EMOJI_OPTIONS = ["✅", "🔥", "🎯", "💡", "🚀"];

export function TodoCard({
  todo,
  onToggleStatus,
  onDelete,
  onUpdateTitle,
  onUpdateDescription,
  onUpdateEmoji,
}: TodoCardProps) {
  const [editingField, setEditingField] = useState<
    "title" | "description" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isCompleted = todo.status === "completed";
  const truncatedDescription =
    todo.description.length > 120
      ? todo.description.slice(0, 120) + "..."
      : todo.description;

  const startEdit = (field: "title" | "description") => {
    setEditingField(field);
    setEditValue(field === "title" ? todo.title : todo.description);
  };

  const saveEdit = (field: "title" | "description") => {
    if (editValue.trim()) {
      if (field === "title") {
        onUpdateTitle(todo.id, editValue.trim());
      } else {
        onUpdateDescription(todo.id, editValue.trim());
      }
    }
    setEditingField(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [editValue]);

  return (
    <Card
      className={cn(
        "group relative p-5 transition-all duration-150",
        isCompleted && "opacity-60",
      )}
    >
      {/* 刪除按鈕——hover 時顯示於右上角 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(todo)}
        className="absolute top-3 right-3 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Delete todo"
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      {/* Emoji 頭像 */}
      <div className="relative inline-block mb-3">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={cn(
            "block text-3xl leading-none cursor-pointer rounded-xl p-2 transition-colors",
            isCompleted ? "bg-(--muted)" : "bg-(--secondary)",
          )}
          aria-label="Change emoji"
        >
          {todo.emoji}
        </button>

        {showEmojiPicker && (
          <div className="absolute top-0 left-full ml-2 z-10 flex gap-1 p-1.5 rounded-full bg-(--card) border border-(--border) shadow-lg">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => {
                  onUpdateEmoji(todo.id, emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-lg w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-(--secondary)"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 標題 */}
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleStatus(todo)}
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0">
          {editingField === "title" ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit("title")}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit("title");
                if (e.key === "Escape") cancelEdit();
              }}
              className="w-full text-base font-semibold focus:outline-none bg-transparent text-(--foreground) border-b-2 border-(--primary) pb-0.5"
              autoFocus
              aria-label="Edit todo title"
            />
          ) : (
            <button
              type="button"
              onClick={() => startEdit("title")}
              className={cn(
                "block w-full text-left text-base font-semibold cursor-text wrap-break-word leading-snug",
                isCompleted
                  ? "text-(--muted-foreground) line-through"
                  : "text-(--foreground)",
              )}
            >
              {todo.title}
            </button>
          )}

          {editingField === "description" ? (
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit("description")}
              onKeyDown={(e) => {
                if (e.key === "Escape") cancelEdit();
              }}
              className="w-full mt-1.5 text-sm leading-relaxed focus:outline-none resize-none bg-transparent text-(--muted-foreground) border-b-2 border-(--primary) pb-0.5"
              rows={1}
              autoFocus
              aria-label="Edit todo description"
            />
          ) : (
            <button
              type="button"
              onClick={() => startEdit("description")}
              className={cn(
                "block w-full text-left mt-1.5 text-sm leading-relaxed cursor-text",
                isCompleted
                  ? "text-(--muted-foreground) line-through"
                  : "text-(--muted-foreground)",
              )}
            >
              {truncatedDescription}
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
