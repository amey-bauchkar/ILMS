"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTags } from "@/hooks/use-data";
import { cn } from "@/lib/utils";

interface TagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  readOnly?: boolean;
}

export function TagManager({ tags, onChange, readOnly = false }: TagManagerProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { tags: dbTags, loading } = useTags();
  
  const suggestedTags = dbTags.map(t => t.name);

  const filteredSuggestions = suggestedTags.filter(
    (t) =>
      t.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(t)
  );

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const showCreateOption = inputValue.trim() 
    && !suggestedTags.some(t => t.toLowerCase() === inputValue.trim().toLowerCase()) 
    && !tags.some(t => t.toLowerCase() === inputValue.trim().toLowerCase());

  return (
    <div className="space-y-3">
      {/* Tag badges with remove button */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-[#edf2f7] dark:bg-white/[0.08] hover:bg-[#e2e8f0] dark:hover:bg-white/[0.12] border border-black/[0.08] dark:border-white/15 text-[#111318] dark:text-white font-semibold gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all shadow-xs"
          >
            {tag}
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full hover:bg-black/10 dark:hover:bg-destructive/30 hover:text-red-600 dark:hover:text-red-300 p-0.5 transition-colors"
                aria-label={`Remove tag: ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {tags.length === 0 && (
          <span className="text-xs text-zinc-400 italic">No tags attached</span>
        )}
      </div>

      {/* Add tag input */}
      {!readOnly && (
        <div className="w-full space-y-2">
          <div className="flex gap-2">
            <input
              placeholder="Add a tag (e.g. VIP, Hot-Lead)..."
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (inputValue.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              onKeyDown={handleKeyDown}
              className="h-9.5 flex-1 rounded-xl border border-black/[0.12] dark:border-white/20 bg-white dark:bg-white/[0.05] px-3 py-2 text-xs sm:text-sm text-[#111318] dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-xs transition-all hover:border-black/25 dark:hover:border-white/35 focus:border-[#111318] dark:focus:border-primary focus:outline-none focus:ring-1 focus:ring-[#111318]"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9.5 px-3 shrink-0 rounded-xl border-black/[0.12] dark:border-white/20 bg-[#f8fafc] dark:bg-white/[0.06] hover:bg-[#edf2f7] dark:hover:bg-white/[0.1] text-[#111318] dark:text-white font-medium shadow-xs"
              disabled={!inputValue.trim()}
              onClick={() => addTag(inputValue)}
            >
              <Plus className="h-4 w-4 mr-1 text-[#15803d]" />
              Add
            </Button>
          </div>

          {/* Non-floating in-flow suggestions list */}
          {showSuggestions && (filteredSuggestions.length > 0 || showCreateOption) && (
            <div className="w-full bg-white dark:bg-[#141520] border border-black/10 dark:border-white/15 rounded-xl max-h-48 overflow-y-auto p-1.5 text-[#111318] dark:text-white shadow-lg">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#15803d]" />
                  Loading tags...
                </div>
              )}
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors text-zinc-800 dark:text-zinc-100 hover:text-[#111318] dark:hover:text-white flex items-center justify-between"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(suggestion);
                  }}
                >
                  <span>{suggestion}</span>
                  <Plus className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                </button>
              ))}
              
              {showCreateOption && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors text-[#15803d] font-bold flex items-center gap-1.5 border-t border-black/[0.08] dark:border-white/10 mt-1 pt-1.5"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(inputValue);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 text-[#15803d] shrink-0" />
                  <span>Create &quot;{inputValue.trim()}&quot;</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
