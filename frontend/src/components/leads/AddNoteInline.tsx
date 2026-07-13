"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare } from "lucide-react";

export function AddNoteInline({ leadId }: { leadId: string }) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      console.log(`Note added to lead ${leadId}:`, note);
      setNote("");
      setIsSubmitting(false);
      // alert("Note added!"); // In real app, toast and refetch timeline
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="relative pl-8 mt-2 mb-8">
      <div className="absolute left-0 top-4 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center z-10">
        <MessageSquare className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="bg-card border border-border rounded-lg p-3 shadow-sm focus-within:ring-1 focus-within:ring-primary/50 transition-shadow">
        <Textarea
          placeholder="Write a quick note..."
          className="min-h-[60px] border-0 focus-visible:ring-0 p-0 resize-none shadow-none bg-transparent dark:bg-transparent"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/40">
          <span className="text-xs text-muted-foreground">Press Enter to save</span>
          <Button 
            size="sm" 
            disabled={!note.trim() || isSubmitting}
            className="h-8"
          >
            {isSubmitting ? "Saving..." : "Save Note"}
          </Button>
        </div>
      </div>
    </form>
  );
}
