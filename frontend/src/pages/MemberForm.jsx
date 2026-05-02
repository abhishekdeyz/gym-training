import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import MemberAvatar from "@/components/MemberAvatar";
import { addDays, format } from "date-fns";

const GOALS = ["Weight Loss", "Muscle Gain", "General Fitness", "Flexibility", "Sports Performance"];

export default function MemberForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [data, setData] = useState({
    name: "", phone: "", email: "", gender: "MALE",
    dateOfBirth: "", address: "", photoUrl: "",
    membershipType: "Monthly", membershipFee: 999,
    joinDate: format(new Date(), "yyyy-MM-dd"),
    expiryDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    status: "ACTIVE", trainerId: "",
    height: "", weight: "", goal: "General Fitness",
    emergencyContact: "", emergencyPhone: "", notes: "",
  });
  const [err, setErr] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/plans"), api.get("/trainers")]).then(([p, t]) => {
      setPlans(p.data);
      setTrainers(t.data);
    });
    if (isEdit) {
      api.get(`/members/${id}`).then((r) => setData((d) => ({ ...d, ...r.data })));
    }
  }, [id, isEdit]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const onPlanChange = (planName) => {
    const plan = plans.find((p) => p.name === planName);
    set("membershipType", planName);
    if (plan) {
      set("membershipFee", plan.price);
      const exp = format(addDays(new Date(data.joinDate || new Date()), plan.durationDays), "yyyy-MM-dd");
      set("expiryDate", exp);
    }
  };

  const onPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => set("photoUrl", reader.result);
    reader.readAsDataURL(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!data.name || data.name.length < 2) errs.name = "Naam kam se kam 2 characters ka hona chahiye";
    if (!/^[6-9]\d{9}$/.test(data.phone)) errs.phone = "Valid 10-digit Indian mobile number daalen";
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Valid email";
    if (!data.membershipFee || data.membershipFee < 1) errs.membershipFee = "Plan fee required hai";
    setErr(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const payload = {
        ...data,
        membershipFee: Number(data.membershipFee),
        height: data.height ? Number(data.height) : null,
        weight: data.weight ? Number(data.weight) : null,
      };
      const { data: resp } = isEdit
        ? await api.put(`/members/${id}`, payload)
        : await api.post("/members", payload);
      toast.success(isEdit ? "✅ Member update ho gaya" : "✅ Member successfully add ho gaya!");
      navigate(`/app/members/${resp.id}`);
    } catch (ex) {
      toast.error("Save fail ho gaya");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5 max-w-4xl mx-auto" data-testid="member-form">
      <h2 className="text-2xl font-bold">{isEdit ? "Edit Member" : "Add Member"}</h2>

      <Card>
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2 flex items-center gap-4">
            <MemberAvatar name={data.name || "?"} photoUrl={data.photoUrl} size={80} />
            <div>
              <Label htmlFor="photo" className="cursor-pointer text-primary text-sm">
                {data.photoUrl ? "Photo change karein" : "Photo upload karein"}
              </Label>
              <Input id="photo" type="file" accept="image/*" onChange={onPhoto} className="hidden" data-testid="member-photo-input" />
            </div>
          </div>
          <div>
            <Label>Name *</Label>
            <Input value={data.name} onChange={(e) => set("name", e.target.value)} className="mt-1.5" data-testid="member-name" />
            {err.name && <p className="text-xs text-red-500 mt-1">{err.name}</p>}
          </div>
          <div>
            <Label>Phone *</Label>
            <Input value={data.phone} onChange={(e) => set("phone", e.target.value)} maxLength={10} className="mt-1.5" data-testid="member-phone" />
            {err.phone && <p className="text-xs text-red-500 mt-1">{err.phone}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} className="mt-1.5" data-testid="member-email" />
            {err.email && <p className="text-xs text-red-500 mt-1">{err.email}</p>}
          </div>
          <div>
            <Label className="mb-2 block">Gender *</Label>
            <RadioGroup value={data.gender} onValueChange={(v) => set("gender", v)} className="flex gap-4 mt-2">
              {["MALE", "FEMALE", "OTHER"].map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <RadioGroupItem value={g} id={g} />
                  <Label htmlFor={g}>{g}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={data.dateOfBirth || ""} onChange={(e) => set("dateOfBirth", e.target.value)} className="mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Textarea value={data.address || ""} onChange={(e) => set("address", e.target.value)} className="mt-1.5" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Membership</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Membership Plan *</Label>
            <Select value={data.membershipType} onValueChange={onPlanChange}>
              <SelectTrigger className="mt-1.5" data-testid="member-plan"><SelectValue /></SelectTrigger>
              <SelectContent>
                {plans.map((p) => <SelectItem key={p.id} value={p.name}>{p.name} — ₹{p.price}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Membership Fee *</Label>
            <Input type="number" value={data.membershipFee} onChange={(e) => set("membershipFee", e.target.value)} className="mt-1.5" data-testid="member-fee" />
            {err.membershipFee && <p className="text-xs text-red-500 mt-1">{err.membershipFee}</p>}
          </div>
          <div>
            <Label>Join Date *</Label>
            <Input type="date" value={data.joinDate} onChange={(e) => set("joinDate", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Expiry Date *</Label>
            <Input type="date" value={data.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={data.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="FROZEN">Frozen</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assign Trainer</Label>
            <Select value={data.trainerId || "_none"} onValueChange={(v) => set("trainerId", v === "_none" ? "" : v)}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No trainer</SelectItem>
                {trainers.filter((t) => t.isActive).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name} — {t.speciality}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Body Stats</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Height (cm)</Label>
            <Input type="number" value={data.height || ""} onChange={(e) => set("height", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input type="number" value={data.weight || ""} onChange={(e) => set("weight", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Fitness Goal</Label>
            <Select value={data.goal || ""} onValueChange={(v) => set("goal", v)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GOALS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Emergency & Notes</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Emergency Contact Name</Label>
            <Input value={data.emergencyContact || ""} onChange={(e) => set("emergencyContact", e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Emergency Phone</Label>
            <Input value={data.emergencyPhone || ""} onChange={(e) => set("emergencyPhone", e.target.value)} className="mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={data.notes || ""} onChange={(e) => set("notes", e.target.value)} className="mt-1.5" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
        <Button type="submit" disabled={loading} data-testid="member-form-submit">
          {loading ? "Save ho raha hai..." : isEdit ? "Badlaav Karein" : "Sadasya Jodhein"}
        </Button>
      </div>
    </form>
  );
}
