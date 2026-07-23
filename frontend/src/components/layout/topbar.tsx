"use client";

import { Bell, Search, User, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";
import { useUser } from "@/components/providers/user-provider";
import { logout } from "@/actions/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useReminders } from "@/hooks/use-data";
import { completeReminder } from "@/actions/reminders";
import { Check, Calendar } from "lucide-react";
import { format } from "date-fns";

export function Topbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useUser();
  const { reminders, refresh: refreshReminders } = useReminders();

  const handleCompleteReminder = async (id: string) => {
    try {
      await completeReminder(id);
      refreshReminders();
    } catch (err) {
      console.error(err);
    }
  };

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

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary outline-none">
            <Bell className="w-5 h-5" />
            {reminders.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Reminders & Follow-ups</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {reminders.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  You're all caught up!
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {reminders.map((reminder) => (
                    <DropdownMenuItem key={reminder.id} className="flex flex-col items-start gap-1 p-3 cursor-default" onSelect={(e) => e.preventDefault()}>
                      <div className="flex w-full justify-between items-start">
                        <div className="font-medium text-sm">{reminder.title}</div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteReminder(reminder.id);
                          }}
                          className="text-muted-foreground hover:text-green-500 transition-colors p-1"
                          title="Mark as Done"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                      {reminder.lead && (
                        <div className="text-xs text-muted-foreground truncate w-full">
                          Lead: {reminder.lead.name} {reminder.lead.company_name ? `(${reminder.lead.company_name})` : ''}
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(reminder.due_date), "MMM d, h:mm a")}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
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
