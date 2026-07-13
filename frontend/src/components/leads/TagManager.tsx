"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// In a real app, this would come from the database (BRD Section 2.14 - tags table)
const SUGGESTED_TAGS = [
  "IT Services", "High Intent", "Logistics", "Website Rebuild",
  "E-commerce", "Branding", "Social Media", "SEO", "Care Plan",
  "Enterprise", "Startup", "B2B", "B2C", "Retainer", "One-time Project",
];

interface TagManagerProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  readOnly?: boolean;
}

export function TagManager({ tags, onChange, readOnly = false }: TagManagerProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredSuggestions = SUGGESTED_TAGS.filter(
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

      {/* Add tag input with autocomplete */}
      {!readOnly && (
        <div className="relative">
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
                // Delay to allow click on suggestion
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

          {/* Autocomplete dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-10 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
