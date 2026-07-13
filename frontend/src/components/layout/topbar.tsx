"use client";

import { Bell, Search, User, Menu } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Mobile menu button (hidden on desktop) */}
        <button className="md:hidden p-2 text-muted-foreground hover:text-foreground">
          <Menu className="w-6 h-6" />
        </button>
        
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
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-secondary">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-secondary transition-colors">
          <div className="w-8 h-8 bg-secondary border border-border rounded-full flex items-center justify-center overflow-hidden">
            <User className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium hidden sm:block px-1">Amey B.</span>
        </div>
      </div>
    </header>
  );
}
