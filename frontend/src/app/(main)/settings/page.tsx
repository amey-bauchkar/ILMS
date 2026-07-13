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
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-1 border-b border-border pb-4">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-base">
          Manage your account settings and application preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-card/50 border border-border p-1 h-auto rounded-lg">
          <TabsTrigger value="profile" className="rounded-md px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Profile</TabsTrigger>
          <TabsTrigger value="application" className="rounded-md px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Application</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-border/50 pb-4 mb-4">
              <CardTitle className="text-xl">Profile Details</CardTitle>
              <CardDescription className="text-sm">
                Update your personal information and avatar.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-4">
              <div className="flex flex-col md:flex-row gap-10">
                {/* Avatar Section (Left Column) */}
                <div className="flex flex-col items-center gap-4 w-40 shrink-0">
                  <Avatar className="w-28 h-28 border-4 border-background shadow-lg">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-4xl font-bold bg-primary text-primary-foreground">AB</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2 w-full mt-2">
                    <Button variant="default" size="sm" className="w-full shadow-md font-medium">Upload</Button>
                    <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">Remove</Button>
                  </div>
                </div>

                {/* Form Section (Right Column) */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                      <Input id="name" defaultValue="Amey B." className="bg-background h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                      <Input id="email" type="email" defaultValue="amey@foremark.com" className="bg-background h-10" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                      <Input id="role" value="Administrator" readOnly disabled className="bg-secondary/50 text-muted-foreground cursor-not-allowed h-10" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Your role is managed by the organization owner.
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-border/50 pt-4 mt-6 flex justify-end">
                    <Button className="px-8 h-10 font-medium shadow-md hover:shadow-primary/20 transition-all">Save Changes</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="application" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl">
            <CardHeader className="border-b border-border/50 pb-4 mb-4">
              <CardTitle className="text-xl">Application Preferences</CardTitle>
              <CardDescription>
                Customize your Foremark CRM experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
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
