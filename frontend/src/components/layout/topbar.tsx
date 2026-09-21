"use client";

import { Search, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";
import { useUser } from "@/components/providers/user-provider";
import { logout } from "@/actions/auth";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

export function Topbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useUser();

  // Get display name: first name or email
  const displayName = user
    ? user.name.split(" ")[0] + " " + (user.name.split(" ")[1]?.[0] ?? "").toUpperCase() + "."
    : "...";

  const initials = user
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Role badge
  const roleBadge = user?.role === "admin"
    ? "Admin"
    : user?.role === "client_manager"
    ? "CM"
    : "Sales";

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Mobile menu button (hidden on desktop) */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="md:hidden p-2 text-muted-foreground hover:text-foreground">
            <Menu className="w-6 h-6" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4 flex flex-col">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarContent onNavItemClick={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
        
        {/* Global Search */}
        <div className="relative hidden sm:flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search leads, contacts..." 
            className="pl-9 pr-4 py-2 bg-secondary border border-transparent focus:border-ring focus:bg-background rounded-md text-sm w-64 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Notification Panel on the right side */}
        <NotificationPanel />
        
        {/* User info + Logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-secondary transition-colors">
            <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center overflow-hidden">
              <span className="text-xs font-semibold text-primary">{loading ? "..." : initials}</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-medium leading-none">{loading ? "Loading..." : displayName}</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{loading ? "" : roleBadge}</span>
            </div>
          </div>
          
          <form action={logout}>
            <button 
              type="submit"
              className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
