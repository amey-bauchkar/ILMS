"use client";

import { useState } from "react";
import { Lead, statusColors, priorityColors } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Building2, Calendar, IndianRupee, Pencil, PhoneCall } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LeadForm } from "./LeadForm";
import { TagManager } from "./TagManager";

interface LeadInfoCardProps {
  lead: Lead;
}

export function LeadInfoCard({ lead }: LeadInfoCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-2xl">{lead.name}</CardTitle>
            {lead.company && (
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1.5">
                <Building2 className="h-4 w-4" />
                <span className="text-sm font-medium">{lead.company}</span>
              </div>
            )}
          </div>
          
          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" />}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit lead</span>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[500px] w-[90vw] overflow-y-auto">
              <SheetHeader className="mb-6">
                <SheetTitle>Edit Lead</SheetTitle>
              </SheetHeader>
              <LeadForm 
                initialData={{
                  name: lead.name,
                  company: lead.company,
                  phone: lead.phone,
                  email: lead.email,
                  source: lead.source,
                  status: lead.status,
                  priority: lead.priority,
                  ownerId: lead.owner.id,
                  dealValue: lead.dealValue,
                  nextFollowUpDate: lead.nextFollowUpDate,
                  lostReason: lead.lostReason as any,
                }} 
                onSuccess={() => setIsEditOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge 
            variant="secondary" 
            style={{ 
              backgroundColor: `${statusColors[lead.status]}20`, 
              color: statusColors[lead.status] 
            }}
          >
            {lead.status}
          </Badge>
          <Badge 
            variant="outline" 
            style={{ 
              borderColor: `${priorityColors[lead.priority]}50`,
              color: priorityColors[lead.priority]
            }}
          >
            {lead.priority} Priority
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Contact Actions */}
        <div className="flex gap-2">
          <Button className="w-full gap-2" onClick={() => alert("Log Call placeholder for Tanmay's task")}>
            <PhoneCall className="h-4 w-4" />
            Log Call
          </Button>
        </div>

        {/* Contact Details */}
        <div className="space-y-3">
          <a 
            href={`tel:${lead.phone}`}
            className="flex items-center gap-3 text-sm hover:text-primary transition-colors p-2 -mx-2 rounded-md hover:bg-muted/50"
          >
            <Phone className="h-4 w-4 text-muted-foreground" />
            {lead.phone}
          </a>
          
          {lead.email && (
            <a 
              href={`mailto:${lead.email}`}
              className="flex items-center gap-3 text-sm hover:text-primary transition-colors p-2 -mx-2 rounded-md hover:bg-muted/50"
            >
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{lead.email}</span>
            </a>
          )}
        </div>

        {/* Lead Data */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <IndianRupee className="h-4 w-4" /> Deal Value
            </span>
            <span className="font-medium">
              {lead.dealValue ? `₹${lead.dealValue.toLocaleString("en-IN")}` : "—"}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Created
            </span>
            <span className="font-medium">
              {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
              })}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Last Contacted
            </span>
            <span className="font-medium">
              {lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
              }) : "Never"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Next Follow-up
            </span>
            <span className="font-medium">
              {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric"
              }) : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Source
            </span>
            <span className="font-medium">
              {lead.source}
            </span>
          </div>
        </div>

        {/* Tags — Interactive TagManager (Task Brief: removable + addable) */}
        <div className="pt-4 border-t border-border/50">
          <TagManager
            tags={lead.tags}
            onChange={(newTags) => {
              // In real app, this would call Supabase to update lead_tags
              console.log("Tags updated for lead:", lead.id, newTags);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
