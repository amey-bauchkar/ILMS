"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Database, 
  Share2, 
  Bell, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  Trophy
} from "lucide-react";
import { useState, useRef, useEffect, Suspense } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";
import { useUser } from "@/components/providers/user-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { logout } from "@/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { cn, getInitials } from "@/lib/utils";

export function Topbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "dashboard";
  const { user, loading } = useUser();
  const { resolvedTheme, toggleTheme } = useTheme();

  const initials = getInitials(user?.name, "FM");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  async function handleSignOut(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Client signout:", err);
    }

    try {
      await logout();
    } catch (err) {
      console.warn("Server signout:", err);
    }

    window.location.href = "/login";
  }

  const topNavItems = [
    { name: "Dashboard", href: "/dashboard", id: "dashboard", icon: LayoutDashboard },
    { name: "Projects", href: "/won-deals", id: "projects", icon: Trophy },
    { name: "Teams", href: "/dashboard?tab=teams", id: "teams", icon: Users },
    { name: "Data", href: "/leads", id: "data", icon: Database },
  ];

  return (
    <header className="h-16 flex items-center justify-between px-2 sm:px-4 shrink-0 relative z-20 w-full select-none">
      {/* Left: Mobile Drawer Trigger & Capsule Switcher */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger className="md:hidden p-2 text-zinc-600 hover:text-black rounded-xl bg-white shadow-xs border border-black/[0.06]">
            <Menu className="w-5 h-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4 flex flex-col bg-white border-r border-black/[0.06]">
            <SheetTitle className="sr-only">Foremark Navigation</SheetTitle>
            <Suspense fallback={null}>
              <SidebarContent onNavItemClick={() => setIsOpen(false)} />
            </Suspense>
          </SheetContent>
        </Sheet>

        {/* Capsule Navigation Switcher (Matches Reference Exactly) */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-white dark:bg-[#151821] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-black/[0.05] dark:border-white/10 rounded-full">
          {topNavItems.map((item) => {
            const isTabActive = item.id === "data" 
              ? pathname.startsWith("/leads")
              : item.id === "projects"
              ? pathname.startsWith("/won-deals") || pathname.startsWith("/projects")
              : item.id === "teams"
              ? pathname === "/dashboard" && (currentTab === "teams" || currentTab === "pulse")
              : pathname === "/dashboard" && (currentTab === item.id || (!currentTab && item.id === "dashboard"));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 select-none",
                  isTabActive
                    ? "bg-[#181b20] dark:bg-white dark:text-[#111318] text-white shadow-sm font-semibold"
                    : "text-[#7d8592] hover:text-[#111318] dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.05]"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isTabActive ? (resolvedTheme === "dark" ? "text-[#111318]" : "text-[#c8f237]") : "text-[#7d8592]")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right: Team Collaborator Stack + Shared + Notification Bell + Profile */}
      <div className="flex items-center gap-3 sm:gap-4">

        {/* Shared Capsule Button */}
        <button
          type="button"
          onClick={() => {
            if (navigator.clipboard) {
              navigator.clipboard.writeText(window.location.href);
              alert("Dashboard link copied to clipboard!");
            }
          }}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#151821] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] dark:border-white/10 text-xs font-medium text-[#111318] dark:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-all active:scale-95"
          title="Share Dashboard"
        >
          <Share2 className="w-3.5 h-3.5 text-[#7d8592]" />
          <span>Shared</span>
        </button>

        {/* Quick Theme Toggle */}
        <button
          type="button"
          onClick={(e) => toggleTheme(e)}
          className="w-10 h-10 rounded-full bg-white dark:bg-[#151821] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] dark:border-white/10 flex items-center justify-center text-[#7d8592] hover:text-[#111318] dark:hover:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-all active:scale-95 cursor-pointer"
          title={resolvedTheme === "dark" ? "Light Studio Theme" : "Deep Dark Theme"}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-[#7d8592]" />
          )}
        </button>

        {/* Circular Notification Bell */}
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#151821] shadow-[0_2px_8px_rgba(0,0,0,0.03)] border border-black/[0.05] dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.05] transition-all">
          <NotificationPanel />
        </div>

        {/* Circular User Avatar Profile & Dropdown */}
        <div 
          ref={menuRef} 
          className="relative"
          onMouseEnter={() => setIsMenuOpen(true)}
          onMouseLeave={() => setIsMenuOpen(false)}
        >
          <button 
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="w-10 h-10 rounded-full border border-black/[0.08] dark:border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.03)] bg-[#c8f237] text-[#111318] flex items-center justify-center font-black text-xs hover:scale-105 transition-transform overflow-hidden cursor-pointer"
            title={user?.name || "User profile"}
            aria-expanded={isMenuOpen}
          >
            {loading ? (
              "..."
            ) : user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || "User avatar"}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </button>

          {/* Quick Dropdown Menu with seamless hover bridge & click support */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full pt-2 z-50">
              <div className="w-52 rounded-2xl bg-white dark:bg-[#151821] shadow-xl border border-black/[0.06] dark:border-white/10 p-2 animate-in fade-in-0 zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-black/[0.04] dark:border-white/10">
                  <p className="text-xs font-semibold text-[#111318] dark:text-white truncate">{user?.name || "Foremark Agent"}</p>
                  <p className="text-[11px] text-[#7d8592] dark:text-zinc-400 truncate">{user?.email || "agent@foremark.com"}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#111318] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-colors mt-1"
                >
                  Account Settings
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors text-left cursor-pointer disabled:opacity-50 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
