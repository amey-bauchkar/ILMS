"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-lg">
          Manage your account settings and application preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-card/50 border border-border p-1 h-auto rounded-lg">
          <TabsTrigger value="profile" className="rounded-md px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Profile</TabsTrigger>
          <TabsTrigger value="application" className="rounded-md px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Application</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-border/50 pb-6 mb-6">
              <CardTitle className="text-xl">Profile Details</CardTitle>
              <CardDescription className="text-sm">
                Update your personal information and avatar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 px-6 pb-8">
              {/* Avatar Section */}
              <div className="flex items-center gap-8">
                <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground">AB</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Button variant="default" className="shadow-md">Upload Avatar</Button>
                    <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">Remove</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square JPG, PNG, or GIF, at least 400x400px.
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 pt-4">
                <div className="space-y-2.5">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                  <Input id="name" defaultValue="Amey B." className="bg-background h-11" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input id="email" type="email" defaultValue="amey@foremark.com" className="bg-background h-11" />
                </div>
                <div className="space-y-2.5 md:col-span-2 max-w-md">
                  <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                  <Input id="role" defaultValue="Administrator" disabled className="bg-secondary/50 text-muted-foreground cursor-not-allowed h-11" />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your role is managed by the organization owner.
                  </p>
                </div>
              </div>
              
              <div className="border-t border-border/50 pt-6 mt-2 flex justify-end">
                <Button className="px-8 h-11 font-medium shadow-md hover:shadow-primary/20 transition-all">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="application" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-border/50 pb-6 mb-6">
              <CardTitle className="text-xl">Application Preferences</CardTitle>
              <CardDescription>
                Customize your Foremark CRM experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-8">
              <div className="space-y-3">
                <Label className="text-base font-medium">Theme Settings</Label>
                <div className="p-4 rounded-lg border border-border bg-background max-w-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium">Deep Dark Theme</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The application is currently locked to Deep Dark mode with Foremark Orange accents.
                    </p>
                  </div>
                  <div className="flex h-6 w-12 items-center rounded-full bg-primary p-1">
                    <div className="h-4 w-4 rounded-full bg-white ml-auto" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
