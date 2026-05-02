import React, { useEffect, useState } from "react";
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Plus, MessageCircle, MoreHorizontal, Phone } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDate, waLink } from "@/lib/format";

const COLS = [
  { id: "NEW", title: "NEW", color: "border-blue-400 bg-blue-50/40 dark:bg-blue-950/10" },
  { id: "CONTACTED", title: "CONTACTED", color: "border-yellow-400 bg-yellow-50/40 dark:bg-yellow-950/10" },
  { id: "INTERESTED", title: "INTERESTED", color: "border-orange-400 bg-orange-50/40 dark:bg-orange-950/10" },
  { id: "CONVERTED", title: "CONVERTED", color: "border-green-400 bg-green-50/40 dark:bg-green-950/10" },
  { id: "LOST", title: "LOST", color: "border-gray-400 bg-gray-50/40 dark:bg-gray-950/10" },
];

const SOURCES = ["WALK_IN", "INSTAGRAM", "FACEBOOK", "REFERRAL", "GOOGLE", "OTHER"];
const INTERESTS = ["Gym", "Yoga", "Zumba", "CrossFit", "Boxing", "Other"];

function LeadCard({ lead, onConvert, onDelete }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: lead.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 } : {};
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-md border border-border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing"
      data-testid={`lead-card-${lead.id}`}
    >
      <div {...attributes} {...listeners} className="touch-none">
        <div className="font-medium">{lead.name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {lead.phone}</div>
        <div className="text-xs text-muted-foreground mt-1">🏷️ {lead.source} · {lead.interest || "—"}</div>
        {lead.followUpDate && <div className="text-xs text-muted-foreground mt-1">📅 {formatDate(lead.followUpDate)}</div>}
      </div>
      <div className="mt-2 flex gap-1">
        <Button variant="outline" size="sm" asChild className="flex-1">
          <a href={waLink(lead.phone, `Namaste ${lead.name}!`)} target="_blank" rel="noreferrer">
            <MessageCircle className="w-3 h-3 mr-1" /> WA
          </a>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><MoreHorizontal className="w-3 h-3" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onConvert(lead)}>Convert to Member</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(lead)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function Column({ col, leads, onConvert, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 ${col.color} p-3 min-h-[400px] ${isOver ? "ring-2 ring-primary" : ""}`}
      data-testid={`lead-col-${col.id}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm">{col.title}</div>
        <span className="text-xs px-2 py-0.5 rounded bg-card border border-border">{leads.length}</span>
      </div>
      <div className="space-y-2">
        {leads.map((l) => <LeadCard key={l.id} lead={l} onConvert={onConvert} onDelete={onDelete} />)}
      </div>
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [open, setOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [form, setForm] = useState({
    name: "", phone: "", email: "", source: "WALK_IN", interest: "Gym",
    followUpDate: "", notes: "", status: "NEW",
  });

  const load = () => api.get("/leads").then((r) => setLeads(r.data));
  useEffect(() => { load(); }, []);

  const onDragEnd = async ({ active, over }) => {
    if (!over) return;
    const lead = leads.find((l) => l.id === active.id);
    if (!lead || lead.status === over.id) return;
    setLeads((ls) => ls.map((l) => (l.id === active.id ? { ...l, status: over.id } : l)));
    try {
      await api.patch(`/leads/${active.id}/status`, { status: over.id });
      toast.success(`Moved to ${over.id}`);
    } catch {
      load();
      toast.error("Move fail");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !/^[6-9]\d{9}$/.test(form.phone)) return toast.error("Valid name & phone required");
    try {
      await api.post("/leads", form);
      toast.success("Lead saved");
      setOpen(false);
      setForm({ name: "", phone: "", email: "", source: "WALK_IN", interest: "Gym", followUpDate: "", notes: "", status: "NEW" });
      load();
    } catch {
      toast.error("Save fail");
    }
  };

  const onConvert = async (lead) => {
    await api.patch(`/leads/${lead.id}/status`, { status: "CONVERTED" });
    navigate(`/app/members/new?prefillName=${encodeURIComponent(lead.name)}&prefillPhone=${lead.phone}`);
  };

  const onDelete = async (lead) => {
    if (!window.confirm(`${lead.name} delete?`)) return;
    await api.delete(`/leads/${lead.id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-4" data-testid="leads-page">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Leads CRM</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="leads-add-button"><Plus className="w-4 h-4 mr-2" /> Add Lead</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Lead</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" data-testid="lead-name" /></div>
              <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10} className="mt-1.5" data-testid="lead-phone" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Source</Label>
                  <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Interest</Label>
                  <Select value={form.interest} onValueChange={(v) => setForm({ ...form, interest: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>{INTERESTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Follow-up Date</Label><Input type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1.5" /></div>
              <Button type="submit" className="w-full" data-testid="lead-submit">Lead Save Karein</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {COLS.map((col) => (
            <Column
              key={col.id}
              col={col}
              leads={leads.filter((l) => l.status === col.id)}
              onConvert={onConvert}
              onDelete={onDelete}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
