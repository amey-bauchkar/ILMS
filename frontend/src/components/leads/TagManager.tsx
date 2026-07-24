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
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Tags
      </h4>

      {/* Tag badges with remove button */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-secondary/50 font-normal gap-1 pr-1"
          >
            {tag}
            {!readOnly && (
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors"
                aria-label={`Remove tag: ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {tags.length === 0 && (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
      </div>

      {/* Add tag input */}
      {!readOnly && (
        <div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
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
              className="h-8 text-sm"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-2 shrink-0"
              disabled={!inputValue.trim()}
              onClick={() => addTag(inputValue)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Inline suggestions — renders in normal flow so it works inside scrollable dialogs */}
          {showSuggestions && (filteredSuggestions.length > 0 || showCreateOption) && (
            <div className="mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading tags...
                </div>
              )}
              {filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors"
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
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors text-primary italic"
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
