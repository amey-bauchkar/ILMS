"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function ProfileSettings({ profile }: { profile: User }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);
  const hasChanges = name.trim() !== profile.name;

  const initials = (name || profile.name)
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'client_manager': return 'Client Manager';
      case 'sales': return 'Sales Representative';
      default: return role;
    }
  };

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      toast.success("Profile updated successfully!");
      router.refresh();
    } catch (err: any) {
      toast.error("Failed to update profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-10">
      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 w-40 shrink-0">
        <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
          <AvatarImage src={profile.avatar_url || ""} />
          <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2 w-full mt-2">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full shadow-md font-medium" 
            disabled
            title="Coming soon"
          >
            Upload
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-destructive" 
            disabled
            title="Coming soon"
          >
            Remove
          </Button>
        </div>
      </div>

      {/* Form Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="bg-background h-10" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            <Input id="email" type="email" defaultValue={profile.email} className="bg-background h-10" readOnly disabled />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="role" className="text-sm font-medium">Role</Label>
            <Input 
              id="role" 
              value={getRoleDisplay(profile.role)} 
              readOnly 
              disabled 
              className="bg-secondary/50 text-muted-foreground cursor-not-allowed h-10" 
            />
            <p className="text-xs text-muted-foreground mt-1">
              Your role is managed by the organization owner.
            </p>
          </div>
        </div>
        
        <div className="border-t border-border/50 pt-4 mt-6 flex justify-end">
          <Button 
            className="px-8 h-10 font-medium" 
            disabled={!hasChanges || saving}
            onClick={handleSave}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
