import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const TYPES = [
  { name: "Gym", color: "#01696f" },
  { name: "Yoga", color: "#7c3aed" },
  { name: "Zumba", color: "#ea580c" },
  { name: "CrossFit", color: "#dc2626" },
  { name: "Boxing", color: "#2563eb" },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 18 }, (_, i) => 5 + i); // 5 AM - 22 PM (10 PM)

export default function Schedules() {
  const [classes, setClasses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Gym", trainerId: "", startTime: "06:00", endTime: "07:00", days: [], capacity: 20 });

  const load = () => Promise.all([api.get("/classes"), api.get("/trainers")]).then(([c, t]) => {
    setClasses(c.data);
    setTrainers(t.data);
  });
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || form.days.length === 0) return toast.error("Name & days required");
    try {
      await api.post("/classes", { ...form, capacity: Number(form.capacity) || 20 });
      toast.success("Class added");
      setOpen(false);
      setForm({ name: "", type: "Gym", trainerId: "", startTime: "06:00", endTime: "07:00", days: [], capacity: 20 });
      load();
    } catch { toast.error("Save fail"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Class delete?")) return;
    await api.delete(`/classes/${id}`);
    load();
  };

  const getColorFor = (type) => TYPES.find((t) => t.name === type)?.color || "#64748b";

  // Render: for each (day, hour) cell, show classes that span hour h - h+1
  const cellClasses = (day, hour) => {
    return classes.filter((c) => {
      if (!c.days.includes(day)) return false;
      const sh = parseInt(c.startTime.split(":")[0], 10);
      const eh = parseInt(c.endTime.split(":")[0], 10);
      return hour >= sh && hour < eh;
    });
  };

  return (
    <div className="space-y-4" data-testid="schedules-page">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Class Schedule</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="schedule-add-button"><Plus className="w-4 h-4 mr-2" /> Add Class</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Class</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Class Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" data-testid="class-name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t.name} value={t.name}>
                        <span className="inline-block w-3 h-3 rounded mr-2 align-middle" style={{ background: t.color }} />{t.name}
                      </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Trainer</Label>
                  <Select value={form.trainerId || "_none"} onValueChange={(v) => setForm({ ...form, trainerId: v === "_none" ? "" : v })}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent><SelectItem value="_none">No trainer</SelectItem>{trainers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Start Time</Label><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="mt-1.5" /></div>
                <div><Label>End Time</Label><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="mt-1.5" /></div>
                <div className="col-span-2"><Label className="block mb-2">Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <label key={d} className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border cursor-pointer">
                        <Checkbox
                          checked={form.days.includes(d)}
                          onCheckedChange={(v) => setForm((f) => ({ ...f, days: v ? [...f.days, d] : f.days.filter((x) => x !== d) }))}
                        />
                        {d}
                      </label>
                    ))}
                  </div>
                </div>
                <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="mt-1.5" /></div>
              </div>
              <Button type="submit" className="w-full" data-testid="class-submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {TYPES.map((t) => (
          <div key={t.name} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: t.color }} /> {t.name}</div>
        ))}
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th className="p-2 border border-border bg-secondary w-16"></th>
              {DAYS.map((d) => <th key={d} className="p-2 border border-border bg-secondary text-center">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((h) => (
              <tr key={h}>
                <td className="p-1 border border-border bg-secondary/40 text-center text-muted-foreground">{`${String(h).padStart(2, "0")}:00`}</td>
                {DAYS.map((d) => {
                  const cs = cellClasses(d, h);
                  return (
                    <td key={d} className="p-1 border border-border align-top h-12">
                      {cs.map((c) => {
                        const sh = parseInt(c.startTime.split(":")[0], 10);
                        if (sh !== h) return null;
                        const trainer = trainers.find((t) => t.id === c.trainerId);
                        return (
                          <div
                            key={c.id}
                            className="rounded p-1.5 text-white text-[10px] cursor-pointer"
                            style={{ background: getColorFor(c.type) }}
                            onClick={() => remove(c.id)}
                            title="Click to delete"
                            data-testid={`class-${c.id}`}
                          >
                            <div className="font-semibold truncate">{c.name}</div>
                            <div className="opacity-90 truncate">{trainer?.name || "—"}</div>
                            <div className="opacity-80">{c.startTime}–{c.endTime}</div>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent></Card>
    </div>
  );
}
