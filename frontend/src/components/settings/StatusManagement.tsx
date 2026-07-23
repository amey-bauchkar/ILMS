"use client";

import { useState } from "react";
import { Status } from "@/types/database";
import { createStatus, updateStatus, deleteStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Switch } from "@/components/ui/switch";

export function StatusManagement({ statuses }: { statuses: Status[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isTerminal, setIsTerminal] = useState(false);
  const [exclude, setExclude] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenNew = () => {
    setEditingId(null);
    setName("");
    setColor("#3b82f6");
    setIsTerminal(false);
    setExclude(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (status: Status) => {
    setEditingId(status.id);
    setName(status.name);
    setColor(status.color);
    setIsTerminal(status.is_terminal);
    setExclude(status.exclude_from_conversion);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await updateStatus(editingId, {
          name, color, is_terminal: isTerminal, exclude_from_conversion: exclude
        });
      } else {
        await createStatus({
          name, color, is_terminal: isTerminal, exclude_from_conversion: exclude
        });
      }
      setIsOpen(false);
    } catch (err: any) {
      alert("Failed to save status: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this status? Leads using it will cause this to fail unless reassigned.")) {
      try {
        await deleteStatus(id);
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Pipeline Statuses</h3>
          <p className="text-sm text-muted-foreground">
            Configure the stages of your lead pipeline.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={<Button onClick={handleOpenNew} />}>
            Add Status
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Status" : "Create Status"}</DialogTitle>
              <DialogDescription>
                Define a new stage for your sales pipeline.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="status-name">Name</Label>
                  <Input 
                    id="status-name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color (Hex)</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="color" 
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
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Terminal State</Label>
                    <p className="text-xs text-muted-foreground">Is this the end of the pipeline? (e.g. Won/Lost)</p>
                  </div>
                  <Switch checked={isTerminal} onCheckedChange={setIsTerminal} />
                </div>
                <div className="flex items-center justify-between border rounded-md p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Exclude from Conversion</Label>
                    <p className="text-xs text-muted-foreground">Should leads in this status be ignored in Win Rate?</p>
                  </div>
                  <Switch checked={exclude} onCheckedChange={setExclude} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Status"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statuses.map((status) => (
              <TableRow key={status.id}>
                <TableCell className="font-medium text-muted-foreground">
                  {status.display_order}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.color }} 
                    />
                    <span className="font-medium">{status.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {status.is_terminal && <Badge variant="secondary">Terminal</Badge>}
                    {status.exclude_from_conversion && <Badge variant="outline">Excluded</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleOpenEdit(status)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(status.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {statuses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No statuses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
