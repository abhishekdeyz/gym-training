import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import MemberAvatar from "@/components/MemberAvatar";
import { formatCurrency } from "@/lib/format";

const SPECIALITIES = ["Strength Training", "Yoga", "Zumba", "CrossFit", "Cardio & HIIT", "Boxing", "Other"];

export default function Trainers() {
  const [trainers, setTrainers] = useState([]);
  const [members, setMembers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", speciality: "Strength Training", salary: 0, isActive: true });

  const load = () => Promise.all([api.get("/trainers"), api.get("/members")]).then(([t, m]) => {
    setTrainers(t.data);
    setMembers(m.data);
  });
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", speciality: "Strength Training", salary: 0, isActive: true });
    setOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, phone: t.phone, email: t.email || "", speciality: t.speciality, salary: t.salary, isActive: t.isActive });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !/^[6-9]\d{9}$/.test(form.phone)) return toast.error("Valid name & phone required");
    try {
      const payload = { ...form, salary: Number(form.salary) || 0 };
      if (editing) await api.put(`/trainers/${editing.id}`, payload);
      else await api.post("/trainers", payload);
      toast.success("Saved");
      setOpen(false);
      load();
    } catch { toast.error("Save fail"); }
  };

  const toggleActive = async (t) => {
    await api.put(`/trainers/${t.id}`, { ...t, isActive: !t.isActive });
    load();
  };

  const remove = async (t) => {
    if (!window.confirm(`${t.name} delete?`)) return;
    await api.delete(`/trainers/${t.id}`);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="space-y-4" data-testid="trainers-page">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trainers</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} data-testid="trainers-add-button"><Plus className="w-4 h-4 mr-2" /> Add Trainer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit Trainer" : "Add Trainer"}</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" data-testid="trainer-name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone *</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={10} className="mt-1.5" /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div><Label>Speciality *</Label>
                <Select value={form.speciality} onValueChange={(v) => setForm({ ...form, speciality: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{SPECIALITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Salary (₹/month)</Label><Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="mt-1.5" /></div>
              <div className="flex items-center gap-2"><Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} /><Label>Active</Label></div>
              <Button type="submit" className="w-full" data-testid="trainer-submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {trainers.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Koi trainer nahi — Add karein</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {trainers.map((t) => {
            const assigned = members.filter((m) => m.trainerId === t.id);
            return (
              <Card key={t.id} data-testid={`trainer-card-${t.id}`}>
                <CardContent className="p-5 text-center space-y-3">
                  <div className="flex justify-center"><MemberAvatar name={t.name} size={72} /></div>
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.speciality}</div>
                  </div>
                  <div className="text-sm">{assigned.length} members · {formatCurrency(t.salary)}/mo</div>
                  <div className="flex justify-center items-center gap-2">
                    <Switch checked={t.isActive} onCheckedChange={() => toggleActive(t)} />
                    <span className="text-xs">{t.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <div className="flex gap-1 justify-center">
                    <Button variant="outline" size="sm" onClick={() => openEdit(t)} data-testid={`trainer-edit-${t.id}`}><Edit className="w-3 h-3 mr-1" /> Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => remove(t)} className="text-red-600"><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
