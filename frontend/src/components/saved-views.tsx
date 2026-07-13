"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark } from "lucide-react";

export function SavedViews() {
  return (
    <div className="flex items-center gap-2">
      <Select defaultValue="all">
        <SelectTrigger className="w-[200px] h-9 bg-card border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-primary" />
            <SelectValue placeholder="Select a view" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Standard Views</SelectLabel>
            <SelectItem value="all">All Leads</SelectItem>
            <SelectItem value="my-leads">My Leads</SelectItem>
            <SelectItem value="recent">Recently Added</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Saved Custom Views</SelectLabel>
            <SelectItem value="hot-deals">🔥 Hot Deals (Q3)</SelectItem>
            <SelectItem value="enterprise">🏢 Enterprise Leads</SelectItem>
            <SelectItem value="stuck">⚠️ Needs Follow-up</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
