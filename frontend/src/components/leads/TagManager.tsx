"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTags } from "@/hooks/use-data";

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
            className="bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-800 font-medium gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all shadow-xs"
          >
            {tag}
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full hover:bg-red-100 hover:text-red-600 text-zinc-400 p-0.5 transition-colors"
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
        <div className="relative">
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
              className="h-9.5 flex-1 rounded-xl border border-zinc-200/90 bg-white px-3 py-2 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-all hover:border-zinc-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9.5 px-3 shrink-0 rounded-xl border-zinc-200 bg-zinc-100 hover:bg-zinc-200/80 text-zinc-800 font-medium"
              disabled={!inputValue.trim()}
              onClick={() => addTag(inputValue)}
            >
              <Plus className="h-4 w-4 mr-1 text-primary" />
              Add
            </Button>
          </div>

          {/* Inline suggestions */}
          {showSuggestions && (filteredSuggestions.length > 0 || showCreateOption) && (
            <div className="absolute top-[calc(100%+4px)] left-0 w-full z-50 bg-white border border-zinc-200 rounded-xl shadow-2xl max-h-40 overflow-y-auto p-1 text-zinc-900">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading tags...
                </div>
              )}
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs sm:text-sm rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700 hover:text-zinc-900"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(suggestion);
                  }}
                >
                  {suggestion}
                </button>
              ))}
              
              {showCreateOption && (
                <button
                  type="button"
                  className="w-full text-left px-3 py-1.5 text-xs sm:text-sm rounded-lg hover:bg-primary/5 transition-colors text-primary font-medium italic"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addTag(inputValue);
                  }}
                >
                  + Create &quot;{inputValue.trim()}&quot;
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
