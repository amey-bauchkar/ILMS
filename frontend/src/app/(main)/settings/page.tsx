import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Status, Tag } from "@/types/database";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { UserManagement } from "@/components/settings/UserManagement";
import { StatusManagement } from "@/components/settings/StatusManagement";
import { TagManagement } from "@/components/settings/TagManagement";
import { ThemeSettings } from "@/components/settings/ThemeSettings";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ preview?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const isPreview = resolvedParams?.preview === "1";
  const supabase = await createClient();

  // Get current auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if ((authError || !user) && !isPreview) {
    redirect("/login");
  }

  // Get user profile
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();
    profile = data;
  }

  if (!profile && isPreview) {
    const { data: anyAdmin } = await supabase.from("users").select("*").limit(1).single();
    profile = anyAdmin || {
      id: "preview-admin",
      auth_id: "preview-auth",
      name: "Admin (Master)",
      email: "admin@foremark.com",
      role: "admin",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  if (!profile) {
    // Edge case if trigger failed
    return <div>Profile not found. Please contact an admin.</div>;
  }

  const isAdmin = profile.role === "admin";
  const canManageTags = isAdmin || profile.role === "client_manager";

  let users: User[] = [];
  let statuses: Status[] = [];
  let tags: Tag[] = [];

  if (isAdmin) {
    const [usersRes, statusesRes, tagsRes] = await Promise.all([
      supabase.from("users").select("*").order("name"),
      supabase.from("statuses").select("*").order("display_order"),
      supabase.from("tags").select("*").order("name"),
    ]);
    
    users = usersRes.data || [];
    statuses = statusesRes.data || [];
    tags = tagsRes.data || [];
  } else if (canManageTags) {
    const tagsRes = await supabase.from("tags").select("*").order("name");
    tags = tagsRes.data || [];
  }

  return (
    <div className="w-full space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-1 border-b border-black/[0.06] dark:border-white/10 pb-5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111318] dark:text-white">Settings & Preferences</h2>
          <span className="px-2.5 py-0.5 rounded-full bg-[#c8f237] text-[11px] font-bold text-[#111318] shadow-xs">
            Workspace
          </span>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
          Manage your account credentials, team access, and CRM configurations.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-[#151821] border border-black/[0.06] dark:border-white/10 p-1.5 h-auto rounded-full flex overflow-x-auto overflow-y-hidden whitespace-nowrap justify-start w-full sm:w-fit sm:justify-center shadow-inner [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger value="profile" className="rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-[#c8f237] data-[state=active]:text-[#111318] data-[state=active]:font-bold data-[state=active]:shadow-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
            Profile
          </TabsTrigger>
          <TabsTrigger value="application" className="rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-[#c8f237] data-[state=active]:text-[#111318] data-[state=active]:font-bold data-[state=active]:shadow-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
            Preferences
          </TabsTrigger>
          
          {isAdmin && (
            <>
              <TabsTrigger value="users" className="rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-[#c8f237] data-[state=active]:text-[#111318] data-[state=active]:font-bold data-[state=active]:shadow-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                Team
              </TabsTrigger>
              <TabsTrigger value="statuses" className="rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-[#c8f237] data-[state=active]:text-[#111318] data-[state=active]:font-bold data-[state=active]:shadow-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                Statuses
              </TabsTrigger>
            </>
          )}

          {canManageTags && (
            <TabsTrigger value="tags" className="rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-[#c8f237] data-[state=active]:text-[#111318] data-[state=active]:font-bold data-[state=active]:shadow-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
              Tags
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-[#111318] dark:text-white">
            <CardHeader className="border-b border-black/[0.05] dark:border-white/10 p-4 sm:p-6 pb-4 mb-4">
              <CardTitle className="text-xl text-[#111318] dark:text-white">Profile Details</CardTitle>
              <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                View your personal information and role.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 pb-4">
              <ProfileSettings profile={profile as User} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="application" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-[#111318] dark:text-white">
            <CardHeader className="border-b border-black/[0.05] dark:border-white/10 p-4 sm:p-6 pb-4 mb-4">
              <CardTitle className="text-xl text-[#111318] dark:text-white">Application Preferences</CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">
                Customize your Foremark CRM display, color themes, and workspace preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 pb-6">
              <ThemeSettings />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="users" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-[#111318] dark:text-white">
                <CardHeader className="border-b border-black/[0.05] dark:border-white/10 p-4 sm:p-6 pb-4 mb-4">
                  <CardTitle className="text-xl text-[#111318] dark:text-white">User Management</CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Invite team members and manage their roles and access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 pb-6">
                  <UserManagement users={users} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statuses" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-[#111318] dark:text-white">
                <CardHeader className="border-b border-black/[0.05] dark:border-white/10 p-4 sm:p-6 pb-4 mb-4">
                  <CardTitle className="text-xl text-[#111318] dark:text-white">Status Management</CardTitle>
                  <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">
                    Configure the stages a lead passes through in your pipeline.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 pb-6">
                  <StatusManagement statuses={statuses} />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

        {canManageTags && (
          <TabsContent value="tags" className="focus-visible:outline-none focus-visible:ring-0">
            <Card className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#151821] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] text-[#111318] dark:text-white">
              <CardHeader className="border-b border-black/[0.05] dark:border-white/10 p-4 sm:p-6 pb-4 mb-4">
                <CardTitle className="text-xl text-[#111318] dark:text-white">Tag Management</CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 text-sm">
                  Create and organize tags that can be applied to categorize leads.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 pb-6">
                <TagManagement tags={tags} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

