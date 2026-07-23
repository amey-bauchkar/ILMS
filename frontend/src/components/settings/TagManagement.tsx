"use client";

import { useState } from "react";
import { Tag } from "@/types/database";
import { createTag, updateTag, deleteTag } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function TagManagement({ tags }: { tags: Tag[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [color, setColor] = useState("#64748b");
  const [loading, setLoading] = useState(false);

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setColor("#64748b");
    setIsOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.name);
    setColor("#64748b");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateTag(editingId, { name, color });
      } else {
        await createTag(name, color);
      }
      setIsOpen(false);
    } catch (err: any) {
      alert("Failed to save tag: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this tag?")) {
      try {
        await deleteTag(id);
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Global Tags</h3>
          <p className="text-sm text-muted-foreground">
            Manage tags that can be applied to leads.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button onClick={handleOpenNew} />}>
            Create Tag
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Tag" : "Create Tag"}</DialogTitle>
              <DialogDescription>
                Tags help categorize and segment your leads.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Name</Label>
                  <Input 
                    id="tag-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tag-color">Color (Hex)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="tag-color" 
                      type="color" 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)} 
                      className="w-16 p-1 h-10"
                    />
                    <Input 
                      value={color} 
                      onChange={(e) => setColor(e.target.value)} 
                      className="flex-1 font-mono"
                      pattern="^#+([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Tag"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-4 border p-6 rounded-md bg-card/40">
        {tags.map((tag) => (
          <div key={tag.id} className="group relative flex items-center gap-2 border rounded-full pl-3 pr-2 py-1.5 bg-background shadow-sm">
            <div 
              className="w-2.5 h-2.5 rounded-full bg-slate-500" 
            />
            <span className="text-sm font-medium">{tag.name}</span>
            <div className="ml-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => handleOpenEdit(tag)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold px-1"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(tag.id)}
                className="text-destructive/70 hover:text-destructive text-xs font-semibold px-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="text-muted-foreground text-sm py-4">No tags created yet.</div>
        )}
      </div>
    </div>
  );
}
