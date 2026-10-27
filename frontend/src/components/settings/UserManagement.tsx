"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, UserRole } from "@/types/database";
import { inviteUser, updateUserRole, deactivateUser, deleteUser } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await inviteUser({ email, name, role });
      setIsInviteOpen(false);
      setEmail("");
      setName("");
      setRole("client_manager");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
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
      await updateUserRole(id, newRole);
      router.refresh();
    } catch (err: any) {
      // Revert on failure
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role: initialUsers.find((iu) => iu.id === id)?.role || u.role } : u))
      );
      alert("Failed to update role: " + err.message);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    // Optimistic update
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, is_active: !currentActive } : u))
    );
    try {
      await deactivateUser(id, !currentActive);
      router.refresh();
    } catch (err: any) {
      // Revert on failure
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: currentActive } : u))
      );
      alert("Failed to update user status: " + err.message);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${userName}"? This cannot be undone.`)) {
      return;
    }
    const previous = [...localUsers];
    setLocalUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      const res = await deleteUser(id);
      if (res?.error) {
        setLocalUsers(previous);
        alert(res.error);
        return;
      }
      router.refresh();
    } catch (err: any) {
      setLocalUsers(previous);
      alert("Failed to delete user: " + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
