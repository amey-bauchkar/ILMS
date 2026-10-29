"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types/database";
import { inviteUser, updateUserRole, deactivateUser, deleteUser } from "@/actions/admin";
import { getActiveEncryptionKeyAction, generateNewEncryptionKeyAction } from "@/actions/encryption-keys";
import { Button } from "@/components/ui/button";
import { Trash2, KeyRound, Copy, Check, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function UserManagement({ users: initialUsers }: { users: User[] }) {
  const router = useRouter();
  const [localUsers, setLocalUsers] = useState<User[]>(initialUsers);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("client_manager");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Master Encryption Key state
  const [currentKey, setCurrentKey] = useState<string>("");
  const [keyLoading, setKeyLoading] = useState(false);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setKeyLoading(true);
    getActiveEncryptionKeyAction()
      .then((res) => {
        if (res?.success && res.key) {
          setCurrentKey(res.key);
        }
      })
      .catch((err) => console.error("Failed to fetch encryption key:", err))
      .finally(() => setKeyLoading(false));
  }, []);

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await inviteUser({ email, name, role });
      if (res && 'error' in res && res.error) {
        setError(res.error);
        toast.error(res.error);
        return;
      }
      setIsInviteOpen(false);
      setEmail("");
      setName("");
      setRole("client_manager");
      toast.success(`Invited ${name} successfully!`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (id: string, newRole: UserRole) => {
    // Optimistic update
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
    try {
      const res = await updateUserRole(id, newRole);
      if (res?.error) {
        setLocalUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role: initialUsers.find((iu) => iu.id === id)?.role || u.role } : u))
        );
        toast.error(res.error);
        return;
      }
      toast.success("User role updated successfully.");
      router.refresh();
    } catch (err: any) {
      // Revert on failure
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: initialUsers.find((iu) => iu.id === id)?.role || u.role } : u))
      );
      toast.error("Failed to update role: " + err.message);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    // Optimistic update
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !currentActive } : u))
    );
    try {
      const res = await deactivateUser(id, !currentActive);
      if (res?.error) {
        setLocalUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, is_active: currentActive } : u))
        );
        toast.error(res.error);
        return;
      }
      toast.success(`User ${!currentActive ? "activated" : "deactivated"} successfully.`);
      router.refresh();
    } catch (err: any) {
      // Revert on failure
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: currentActive } : u))
      );
      toast.error("Failed to update user status: " + err.message);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${userName}"?\n\nAll leads assigned to or created by them will be transferred to you, and the account will be completely removed from Supabase.`)) {
      return;
    }
    const previous = [...localUsers];
    setLocalUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      const res = await deleteUser(id);
      if (res?.error) {
        setLocalUsers(previous);
        toast.error(res.error);
        return;
      }
      toast.success(`Account for "${userName}" has been permanently deleted.`);
      router.refresh();
    } catch (err: any) {
      setLocalUsers(previous);
      toast.error("Failed to delete user: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Encryption Key Card */}
      <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-[#151821] border border-black/[0.08] dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#c8f237]/20 border border-[#c8f237]/40 flex items-center justify-center text-[#111318] dark:text-[#c8f237] shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                Master Encryption Key
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
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h3 className="text-lg font-medium">Team Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage who has access to the CRM and their roles.
          </p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger render={<Button className="w-full sm:w-auto" />}>
            Invite User
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                They will be able to sign up using this email address.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite}>
              <div className="grid gap-4 py-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="client_manager">Client Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? "Inviting..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select 
                    value={user.role} 
                    onValueChange={(val) => handleRoleChange(user.id, val as UserRole)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue>
                        {user.role === "client_manager" ? "Client Manager" : user.role === "admin" ? "Admin" : user.role}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="client_manager">Client Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1 justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleToggleActive(user.id, user.is_active)}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title={`Permanently delete ${user.name}`}
                      onClick={() => handleDeleteUser(user.id, user.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {localUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
