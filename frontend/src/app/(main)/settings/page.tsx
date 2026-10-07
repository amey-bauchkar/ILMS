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

export default async function SettingsPage() {
  const supabase = await createClient();

  // Get current auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

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
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your account settings and application preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-card/50 border border-border p-1 h-auto rounded-lg flex overflow-x-auto overflow-y-hidden whitespace-nowrap justify-start w-full sm:w-fit sm:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <TabsTrigger value="profile" className="rounded-md px-3.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            Profile
          </TabsTrigger>
          <TabsTrigger value="application" className="rounded-md px-3.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
            Application
          </TabsTrigger>
          
          {isAdmin && (
            <>
              <TabsTrigger value="users" className="rounded-md px-3.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Team
              </TabsTrigger>
              <TabsTrigger value="statuses" className="rounded-md px-3.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Statuses
              </TabsTrigger>
            </>
          )}

          {canManageTags && (
            <TabsTrigger value="tags" className="rounded-md px-3.5 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
              Tags
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-border/50 p-4 sm:p-6 pb-4 mb-4">
              <CardTitle className="text-xl">Profile Details</CardTitle>
              <CardDescription className="text-sm">
                View your personal information and role.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 pb-4">
              <ProfileSettings profile={profile as User} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="application" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-border/50 p-4 sm:p-6 pb-4 mb-4">
              <CardTitle className="text-xl">Application Preferences</CardTitle>
              <CardDescription>
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
              <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
                <CardHeader className="border-b border-border/50 p-4 sm:p-6 pb-4 mb-4">
                  <CardTitle className="text-xl">User Management</CardTitle>
                  <CardDescription>
                    Invite team members and manage their roles and access.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 pb-6">
                  <UserManagement users={users} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="statuses" className="focus-visible:outline-none focus-visible:ring-0">
              <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
                <CardHeader className="border-b border-border/50 p-4 sm:p-6 pb-4 mb-4">
                  <CardTitle className="text-xl">Status Management</CardTitle>
                  <CardDescription>
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
            <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
              <CardHeader className="border-b border-border/50 p-4 sm:p-6 pb-4 mb-4">
                <CardTitle className="text-xl">Tag Management</CardTitle>
                <CardDescription>
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

