"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile } from "@/actions/profile";
import { getActiveEncryptionKeyAction, generateNewEncryptionKeyAction } from "@/actions/encryption-keys";
import { toast } from "sonner";
import { Loader2, KeyRound, Copy, Check, RefreshCw, ShieldCheck } from "lucide-react";
import { getInitials } from "@/lib/utils";

export function ProfileSettings({ profile }: { profile: User }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Master Encryption Key state for Admin
  const [currentKey, setCurrentKey] = useState<string>("");
  const [keyLoading, setKeyLoading] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAdmin = profile.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      setKeyLoading(true);
      getActiveEncryptionKeyAction()
        .then((res) => {
          if (res?.success && res.key) {
            setCurrentKey(res.key);
          }
        })
        .catch((err) => console.error("Failed to fetch encryption key:", err))
        .finally(() => setKeyLoading(false));
    }
  }, [isAdmin]);

  const handleCopyKey = () => {
    if (!currentKey) return;
    navigator.clipboard.writeText(currentKey);
    setCopied(true);
    toast.success("Master Encryption Key copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateNewKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await generateNewEncryptionKeyAction();
      if (res?.success && res.key) {
        setCurrentKey(res.key);
        toast.success("New Master Encryption Key generated!");
      } else {
        toast.error(res?.error || "Failed to generate key");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate key");
    } finally {
      setGeneratingKey(false);
    }
  };

  const hasChanges = name.trim() !== profile.name || avatarUrl !== (profile.avatar_url || null);

  const initials = getInitials(name || profile.name, "U");

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

          {isAdmin && (
            <div className="md:col-span-2 mt-2 p-5 rounded-2xl bg-zinc-50 dark:bg-[#151821] border border-black/[0.08] dark:border-white/10 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#c8f237]/20 border border-[#c8f237]/40 flex items-center justify-center text-[#111318] dark:text-[#c8f237] shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>Master Encryption Key</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-500/20 text-[10px] font-bold">
                        Generated on Login
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      New members must provide this key on the login page to register.
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Box with Copy & Generate buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                <div className="flex-1 bg-white dark:bg-zinc-900/90 border border-black/10 dark:border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
                  <span className="font-mono text-sm sm:text-base font-bold tracking-wider text-zinc-900 dark:text-white select-all">
                    {keyLoading ? "Loading active key..." : currentKey || "Generating key..."}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Ready
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyKey}
                    disabled={!currentKey || keyLoading}
                    className="h-10 px-3.5 rounded-xl border-black/10 dark:border-white/10 font-semibold text-xs cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Copy Key
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleGenerateNewKey}
                    disabled={generatingKey || keyLoading}
                    className="h-10 px-3.5 rounded-xl bg-[#c8f237] hover:bg-[#bde82f] text-[#111318] font-bold text-xs shadow-xs cursor-pointer"
                  >
                    {generatingKey ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Generate New Key
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100/70 dark:bg-white/[0.03] p-2.5 rounded-xl border border-black/[0.04] dark:border-white/5 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  A unique key is created each time you log in. Once registered with this key, members can log in repeatedly without needing any key.
                </span>
              </div>
            </div>
          )}
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
