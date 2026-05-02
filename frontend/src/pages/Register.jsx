import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dumbbell, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { INDIAN_STATES } from "@/lib/format";
import { toast } from "sonner";

const STEPS = ["Gym Info", "Membership Plans", "Set Password"];

function fmt(d) {
  if (!d) return "Kuch galat ho gaya";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || "").join(" ");
  return d?.msg || String(d);
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    gymName: "", ownerName: "", phone: "", email: "",
    address: "", city: "", state: "Bihar", pincode: "",
    gymType: "Gym",
    plans: [
      { name: "Monthly", durationDays: 30, price: 999 },
      { name: "Quarterly", durationDays: 90, price: 2499 },
      { name: "Annual", durationDays: 365, price: 7999 },
    ],
    password: "", confirmPassword: "",
  });
  const [err, setErr] = useState({});

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!data.gymName) e.gymName = "Required";
      if (!data.ownerName) e.ownerName = "Required";
      if (!/^[6-9]\d{9}$/.test(data.phone)) e.phone = "Valid 10-digit Indian mobile number daalen";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Valid email address daalen";
      if (!data.address) e.address = "Required";
      if (!data.city) e.city = "Required";
      if (!data.pincode || !/^\d{6}$/.test(data.pincode)) e.pincode = "Valid 6-digit PIN";
    }
    if (step === 2) {
      if (data.password.length < 8) e.password = "Password 8 characters se kam nahi hona chahiye";
      if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords match nahi karte";
    }
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await register({
        name: data.ownerName,
        email: data.email,
        password: data.password,
        gymName: data.gymName,
        ownerName: data.ownerName,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      });
      toast.success("Welcome to GymPro! 🎉");
      navigate("/app/dashboard");
    } catch (e) {
      const msg = fmt(e?.response?.data?.detail);
      setErr({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = (idx, key, val) => {
    const plans = [...data.plans];
    plans[idx] = { ...plans[idx], [key]: key === "name" ? val : Number(val) || 0 };
    set("plans", plans);
  };
  const removePlan = (idx) => set("plans", data.plans.filter((_, i) => i !== idx));
  const addPlan = () => set("plans", [...data.plans, { name: "Custom", durationDays: 30, price: 0 }]);

  return (
    <div className="min-h-screen bg-secondary/30 py-10 px-4" data-testid="register-page">
      <div className="max-w-2xl mx-auto fade-up">
        <Link to="/" className="inline-flex items-center gap-2 mb-6" data-testid="register-logo-link">
          <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
            <Dumbbell className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl">GymPro</span>
        </Link>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                  i <= step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                }`}
                data-testid={`register-step-${i}`}
              >
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className="ml-2 text-sm font-medium hidden sm:block">{s}</div>
              {i < STEPS.length - 1 && <div className={`flex-1 mx-3 h-0.5 ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {step === 0 && (
            <div className="space-y-4" data-testid="register-step-1-form">
              <h2 className="text-xl font-bold">Gym Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Gym Name *</Label>
                  <Input value={data.gymName} onChange={(e) => set("gymName", e.target.value)} className="mt-1.5" data-testid="reg-gymName" />
                  {err.gymName && <p className="text-xs text-red-500 mt-1">{err.gymName}</p>}
                </div>
                <div>
                  <Label>Owner Name *</Label>
                  <Input value={data.ownerName} onChange={(e) => set("ownerName", e.target.value)} className="mt-1.5" data-testid="reg-ownerName" />
                  {err.ownerName && <p className="text-xs text-red-500 mt-1">{err.ownerName}</p>}
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input value={data.phone} onChange={(e) => set("phone", e.target.value)} maxLength={10} className="mt-1.5" data-testid="reg-phone" />
                  {err.phone && <p className="text-xs text-red-500 mt-1">{err.phone}</p>}
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={data.email} onChange={(e) => set("email", e.target.value)} className="mt-1.5" data-testid="reg-email" />
                  {err.email && <p className="text-xs text-red-500 mt-1">{err.email}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label>Address *</Label>
                  <Input value={data.address} onChange={(e) => set("address", e.target.value)} className="mt-1.5" data-testid="reg-address" />
                  {err.address && <p className="text-xs text-red-500 mt-1">{err.address}</p>}
                </div>
                <div>
                  <Label>City *</Label>
                  <Input value={data.city} onChange={(e) => set("city", e.target.value)} className="mt-1.5" data-testid="reg-city" />
                  {err.city && <p className="text-xs text-red-500 mt-1">{err.city}</p>}
                </div>
                <div>
                  <Label>State *</Label>
                  <Select value={data.state} onValueChange={(v) => set("state", v)}>
                    <SelectTrigger className="mt-1.5" data-testid="reg-state"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PIN Code *</Label>
                  <Input value={data.pincode} onChange={(e) => set("pincode", e.target.value)} maxLength={6} className="mt-1.5" data-testid="reg-pincode" />
                  {err.pincode && <p className="text-xs text-red-500 mt-1">{err.pincode}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label className="mb-2 block">Gym Type</Label>
                  <RadioGroup value={data.gymType} onValueChange={(v) => set("gymType", v)} className="flex flex-wrap gap-4">
                    {["Gym", "Yoga Studio", "CrossFit Box", "Multi-Activity"].map((t) => (
                      <div key={t} className="flex items-center gap-2">
                        <RadioGroupItem value={t} id={t} />
                        <Label htmlFor={t} className="cursor-pointer">{t}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4" data-testid="register-step-2-form">
              <h2 className="text-xl font-bold">Membership Plans</h2>
              <p className="text-sm text-muted-foreground">Edit ya custom plan add karein</p>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary text-left">
                    <tr><th className="p-3">Plan Name</th><th className="p-3">Duration (days)</th><th className="p-3">Price (₹)</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody>
                    {data.plans.map((p, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2"><Input value={p.name} onChange={(e) => updatePlan(i, "name", e.target.value)} /></td>
                        <td className="p-2"><Input type="number" value={p.durationDays} onChange={(e) => updatePlan(i, "durationDays", e.target.value)} /></td>
                        <td className="p-2"><Input type="number" value={p.price} onChange={(e) => updatePlan(i, "price", e.target.value)} /></td>
                        <td className="p-2"><Button variant="ghost" size="sm" onClick={() => removePlan(i)} disabled={data.plans.length <= 1}>×</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Button variant="outline" onClick={addPlan} data-testid="reg-add-plan">+ Add Plan</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4" data-testid="register-step-3-form">
              <h2 className="text-xl font-bold">Set Password</h2>
              <div className="space-y-4">
                <div>
                  <Label>Password * (min 8 chars)</Label>
                  <Input type="password" value={data.password} onChange={(e) => set("password", e.target.value)} className="mt-1.5" data-testid="reg-password" />
                  {err.password && <p className="text-xs text-red-500 mt-1">{err.password}</p>}
                </div>
                <div>
                  <Label>Confirm Password *</Label>
                  <Input type="password" value={data.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className="mt-1.5" data-testid="reg-confirmPassword" />
                  {err.confirmPassword && <p className="text-xs text-red-500 mt-1">{err.confirmPassword}</p>}
                </div>
                {err.form && <p className="text-sm text-red-500">{err.form}</p>}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} data-testid="reg-back-btn">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next} data-testid="reg-next-btn">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
            ) : (
              <Button onClick={submit} disabled={loading} data-testid="reg-submit-btn">
                {loading ? "Setup ho raha hai..." : "Setup Complete Karein"}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" className="text-primary font-medium">Login</Link>
        </div>
      </div>
    </div>
  );
}
