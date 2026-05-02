import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Dumbbell } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function formatErr(d) {
  if (!d) return "Kuch galat ho gaya";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || "").join(" ");
  return d?.msg || String(d);
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState({});

  const handleSubmit = async (e, demo = false) => {
    if (e) e.preventDefault();
    const em = demo ? "demo@gympro.in" : email.trim();
    const pw = demo ? "Demo@123" : password;
    const errors = {};
    if (!em) errors.email = "Yeh field required hai";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) errors.email = "Valid email address daalen";
    if (!pw) errors.password = "Yeh field required hai";
    setErr(errors);
    if (Object.keys(errors).length) return;
    setLoading(true);
    try {
      await login(em, pw);
      toast.success("Welcome back! 🎉");
      navigate("/app/dashboard");
    } catch (e) {
      const msg = formatErr(e?.response?.data?.detail) || "Email ya password galat hai";
      setErr({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-secondary/30" data-testid="login-page">
      <div className="w-full max-w-md fade-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3" data-testid="login-logo-link">
            <div className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="font-bold text-2xl">GymPro</span>
          </Link>
          <p className="text-sm text-muted-foreground">Gym Management Software</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Login Karein</h1>
          <p className="text-sm text-muted-foreground mt-1">Apne gym dashboard mein aaiye</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aapka@email.com"
                data-testid="login-email-input"
                className="mt-1.5"
              />
              {err.email && <p className="text-xs text-red-500 mt-1">{err.email}</p>}
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  data-testid="login-toggle-password"
                >
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {err.password && <p className="text-xs text-red-500 mt-1">{err.password}</p>}
            </div>
            {err.form && <div className="text-sm text-red-500" data-testid="login-form-error">{err.form}</div>}
            <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-button">
              {loading ? "Login ho raha hai..." : "Login Karein"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">ya</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            data-testid="login-demo-button"
          >
            Demo account se try karein
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Naya gym?{" "}
            <Link to="/register" className="text-primary font-medium" data-testid="login-register-link">
              Register karein →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
