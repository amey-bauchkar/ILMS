"use client";

import { useState, useRef } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const hasChanges = name.trim() !== profile.name || avatarUrl !== (profile.avatar_url || null);

  const cleanName = (name || profile.name || "").replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = cleanName.split(/\s+/).filter(Boolean);
  const initials = words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : cleanName.substring(0, 2).toUpperCase() || "U";

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'client_manager': return 'Client Manager';
      case 'sales': return 'Sales Representative';
      default: return role;
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file size must be less than 2MB");
      return;
    }

    setUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setAvatarUrl(base64Data);
      try {
        await updateProfile({ avatar_url: base64Data });
        toast.success("Profile photo updated!");
        router.refresh();
      } catch (err: any) {
        toast.error("Failed to save avatar: " + err.message);
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
      setUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      setAvatarUrl(null);
      await updateProfile({ avatar_url: null });
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Profile photo removed!");
      router.refresh();
    } catch (err: any) {
      toast.error("Failed to remove avatar: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), avatar_url: avatarUrl });
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
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleAvatarFileChange}
      />

      {/* Avatar Section */}
      <div className="flex flex-col items-center gap-4 w-40 shrink-0">
        <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
          <AvatarImage src={avatarUrl || ""} />
          <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2 w-full mt-2">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full shadow-md font-medium" 
            disabled={uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : "Upload"}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-destructive hover:bg-destructive/10" 
            disabled={!avatarUrl || uploadingAvatar}
            onClick={handleRemoveAvatar}
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
