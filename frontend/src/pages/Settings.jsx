import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit, Save } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { INDIAN_STATES, formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { gym, setGym, user, logout } = useAuth();
  const [profile, setProfile] = useState({});
  const [plans, setPlans] = useState([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [reminders, setReminders] = useState({
    enabled: true, days: { 7: true, 3: true, 1: false },
    template: "Namaste {name}! Aapki {gymName} membership {date} ko expire ho rahi hai. Please renew karein. — {gymPhone}",
  });

  useEffect(() => {
    if (gym) setProfile(gym);
    api.get("/plans").then((r) => setPlans(r.data));
    const saved = localStorage.getItem("gp_reminders");
    if (saved) try { setReminders(JSON.parse(saved)); } catch {}
  }, [gym]);

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await api.put("/gym", profile);
      setGym(data);
      toast.success("✅ Gym profile saved");
    } catch { toast.error("Save fail"); }
    finally { setSavingProfile(false); }
  };

  const onLogo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setProfile((p) => ({ ...p, logoUrl: reader.result }));
    reader.readAsDataURL(f);
  };

  const updatePlan = async (i, key, val) => {
    const arr = [...plans];
    arr[i] = { ...arr[i], [key]: key === "name" ? val : Number(val) || (typeof val === "boolean" ? val : 0) };
    if (typeof val === "boolean") arr[i][key] = val;
    setPlans(arr);
  };
  const savePlan = async (p) => {
    try {
      await api.put(`/plans/${p.id}`, p);
      toast.success("Saved");
    } catch { toast.error("Save fail"); }
  };
  const addPlan = async () => {
    const { data } = await api.post("/plans", { name: "Custom", durationDays: 30, price: 999, isActive: true });
    setPlans([...plans, data]);
  };
  const deletePlan = async (id) => {
    if (!window.confirm("Delete plan?")) return;
    await api.delete(`/plans/${id}`);
    setPlans(plans.filter((p) => p.id !== id));
  };

  const saveReminders = () => {
    localStorage.setItem("gp_reminders", JSON.stringify(reminders));
    toast.success("Reminders saved");
  };

  return (
    <div className="space-y-4" data-testid="settings-page">
      <h2 className="text-2xl font-bold">Settings</h2>
      <Tabs defaultValue="profile">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="profile">Gym Profile</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt="logo" className="w-16 h-16 rounded-md object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                  {(profile.name || "G")[0]}
                </div>
              )}
              <div>
                <Label htmlFor="logo" className="cursor-pointer text-primary text-sm">Upload Logo</Label>
                <Input id="logo" type="file" accept="image/*" onChange={onLogo} className="hidden" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Gym Name</Label><Input value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="mt-1.5" data-testid="settings-gym-name" /></div>
              <div><Label>Owner Name</Label><Input value={profile.ownerName || ""} onChange={(e) => setProfile({ ...profile, ownerName: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Phone</Label><Input value={profile.phone || ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Email</Label><Input value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-1.5" /></div>
              <div className="md:col-span-2"><Label>Address</Label><Textarea value={profile.address || ""} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="mt-1.5" /></div>
              <div><Label>City</Label><Input value={profile.city || ""} onChange={(e) => setProfile({ ...profile, city: e.target.value })} className="mt-1.5" /></div>
              <div><Label>State</Label>
                <Select value={profile.state || "Bihar"} onValueChange={(v) => setProfile({ ...profile, state: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>PIN</Label><Input value={profile.pincode || ""} onChange={(e) => setProfile({ ...profile, pincode: e.target.value })} className="mt-1.5" /></div>
              <div><Label>GST Number</Label><Input value={profile.gstNumber || ""} onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Open Time</Label><Input type="time" value={profile.workingHoursOpen || "06:00"} onChange={(e) => setProfile({ ...profile, workingHoursOpen: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Close Time</Label><Input type="time" value={profile.workingHoursClose || "22:00"} onChange={(e) => setProfile({ ...profile, workingHoursClose: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Instagram URL</Label><Input value={profile.instagram || ""} onChange={(e) => setProfile({ ...profile, instagram: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Facebook URL</Label><Input value={profile.facebook || ""} onChange={(e) => setProfile({ ...profile, facebook: e.target.value })} className="mt-1.5" /></div>
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} data-testid="settings-save-profile">{savingProfile ? "Save ho raha..." : "Save Changes"}</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex justify-end"><Button onClick={addPlan}><Plus className="w-4 h-4 mr-2" /> Add Custom Plan</Button></div>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Name</th><th>Duration (days)</th><th>Price (₹)</th><th>Active</th><th></th></tr></thead>
              <tbody>{plans.map((p, i) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="py-2"><Input value={p.name} onChange={(e) => updatePlan(i, "name", e.target.value)} /></td>
                  <td className="py-2 px-1"><Input type="number" value={p.durationDays} onChange={(e) => updatePlan(i, "durationDays", e.target.value)} /></td>
                  <td className="py-2 px-1"><Input type="number" value={p.price} onChange={(e) => updatePlan(i, "price", e.target.value)} /></td>
                  <td className="py-2 px-1"><Switch checked={p.isActive} onCheckedChange={(v) => updatePlan(i, "isActive", v)} /></td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => savePlan(plans[i])}><Save className="w-3 h-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deletePlan(p.id)} className="text-red-600 ml-1"><Trash2 className="w-3 h-3" /></Button>
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card><CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3"><Switch checked={reminders.enabled} onCheckedChange={(v) => setReminders({ ...reminders, enabled: v })} /><Label>Membership expiry reminders</Label></div>
            <div>
              <Label className="block mb-2">When to send</Label>
              <div className="flex flex-wrap gap-3">
                {[7, 3, 1].map((d) => (
                  <label key={d} className="flex items-center gap-2 px-3 py-2 rounded border border-border">
                    <input type="checkbox" checked={!!reminders.days[d]} onChange={(e) => setReminders({ ...reminders, days: { ...reminders.days, [d]: e.target.checked } })} />
                    {d} day{d > 1 ? "s" : ""} before
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>WhatsApp Template</Label>
              <Textarea rows={4} value={reminders.template} onChange={(e) => setReminders({ ...reminders, template: e.target.value })} className="mt-1.5" />
              <div className="text-xs text-muted-foreground mt-1">Variables: {`{name}, {gymName}, {date}, {gymPhone}`}</div>
            </div>
            <Button onClick={saveReminders} data-testid="save-reminders">Save</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-4">
            <Card><CardHeader><CardTitle className="text-base">Current GymPro Plan</CardTitle></CardHeader><CardContent>
              <div className="flex items-center gap-3"><Badge className="bg-primary text-primary-foreground">{gym?.plan || "GROWTH"}</Badge><span className="text-sm text-muted-foreground">Aapka subscription</span></div>
              <Button variant="outline" className="mt-3" onClick={() => window.location.href = "/#pricing"}>Upgrade to Pro →</Button>
            </CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader><CardContent>
              <div className="text-sm text-muted-foreground">Logged in as <strong>{user?.email}</strong></div>
              <Button variant="outline" className="mt-3" onClick={logout}>Logout</Button>
            </CardContent></Card>
            <Card className="border-red-300"><CardHeader><CardTitle className="text-base text-red-600">Danger Zone</CardTitle></CardHeader><CardContent>
              <p className="text-sm text-muted-foreground mb-3">Gym ka saara data permanently delete ho jayega.</p>
              <Button variant="outline" className="text-red-600 border-red-300" onClick={() => {
                if (window.confirm("Sure?") && window.confirm("Really sure? Data gum ho jayega")) {
                  toast.error("Account deletion feature contact support");
                }
              }}>Gym Data Delete Karein</Button>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
