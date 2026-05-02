import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Dumbbell, Users, Wallet, CheckSquare, Target, BarChart3,
  MessageCircle, Star, ArrowRight, Check, X, Menu, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  { icon: Users, title: "Member Management", desc: "Add, edit, search aur filter — sab members ek jagah" },
  { icon: Wallet, title: "Smart Billing", desc: "Invoices, payment tracking, online payments support" },
  { icon: CheckSquare, title: "Attendance", desc: "Mark attendance, view history aur reports" },
  { icon: Target, title: "Lead CRM", desc: "Walk-ins track karein, follow up karein, members banayein" },
  { icon: BarChart3, title: "Reports", desc: "Revenue, attendance, membership analytics" },
  { icon: MessageCircle, title: "WhatsApp Alerts", desc: "Auto renewal reminders directly via WhatsApp" },
];

const TESTIMONIALS = [
  { q: "GymPro se humara revenue 40% badh gaya! Renewals miss nahi hote ab.", n: "Rajesh Gupta", g: "PowerFit Gym, Delhi" },
  { q: "Bahut easy hai. Staff bhi ek din mein seekh gaye. Best investment!", n: "Sunita Sharma", g: "BodyZone Fitness, Mumbai" },
  { q: "Pehle register mein likhte the, ab sab automatic. Bahut time bachta hai.", n: "Mohammed Iqbal", g: "Iron Temple Gym, Hyderabad" },
];

const PROBLEMS = [
  ["Manual register", "Digital records — search/filter instantly"],
  ["Renewal bhool jaana", "Auto renewal alerts (SMS + WhatsApp)"],
  ["Koi tracking nahi", "Live dashboard — har KPI realtime"],
  ["Payment record gum", "Auto invoice generate aur PDF"],
  ["Staff manage karna mushkil", "Role-wise access aur trainers"],
];

const FAQS = [
  ["Kya free trial mein credit card chahiye?", "Nahi, bilkul free — koi card details nahi maangte. 14 din pure features try karein."],
  ["Data secure hai?", "Haan, 256-bit encrypted servers aur daily backups. Aapka data sirf aapka."],
  ["Kitne members add kar sakte hain?", "Plan ke according — Starter 100, Growth 500, Pro unlimited."],
  ["Mobile pe chalega?", "Haan, fully responsive. Mobile/tablet/desktop — kahin bhi use karein."],
  ["Training milegi?", "Haan, free onboarding call. Hum aapke setup mein madad karenge."],
  ["Cancel kaise karein?", "Anytime cancel. Koi lock-in contract nahi. Settings → Account."],
];

export default function Landing() {
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();
  return (
    <div className="bg-background text-foreground" data-testid="landing-page">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-6 h-16">
          <Link to="/" className="flex items-center gap-2" data-testid="landing-logo">
            <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl">GymPro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <Link to="/login" className="hover:text-primary transition-colors" data-testid="landing-login-link">Login</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild data-testid="landing-cta-trial">
              <Link to="/register">Free Trial</Link>
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileNav((s) => !s)}>
              <Menu />
            </Button>
          </div>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-border px-4 py-3 space-y-2 bg-background">
            <a href="#features" onClick={() => setMobileNav(false)} className="block">Features</a>
            <a href="#pricing" onClick={() => setMobileNav(false)} className="block">Pricing</a>
            <a href="#faq" onClick={() => setMobileNav(false)} className="block">FAQ</a>
            <Link to="/login" className="block">Login</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 pt-12 lg:pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge variant="outline" className="bg-accent text-accent-foreground border-primary/30 mb-5">
              ⭐ 4.9/5 · 500+ Indian Gyms
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Apne Gym Ko <span className="text-primary">Smart Banao</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Members, fees, attendance — sab ek jagah manage karein. India ka sabse easy Gym Software.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" asChild data-testid="hero-cta-trial">
                <Link to="/register">14 Din Free Trial <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="hero-cta-demo">
                <Link to="/login">Live Demo Dekhein</Link>
              </Button>
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              ⭐ 4.9/5 rating · 500+ gyms · ₹2 Crore+ fees managed
            </div>
          </div>
          {/* Mockup dashboard preview */}
          <div className="relative">
            <div className="rounded-xl border border-border bg-card p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="ml-3 text-xs text-muted-foreground">app.gympro.in/dashboard</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Active Members", v: "127", c: "+8 ↑" },
                  { l: "Revenue", v: "₹1.24L", c: "+12% ↑" },
                  { l: "Renewals Due", v: "14", c: "next 7d" },
                  { l: "Today Attendance", v: "34", c: "Peak 9 AM" },
                ].map((k) => (
                  <div key={k.l} className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground">{k.l}</div>
                    <div className="mt-1 text-2xl font-bold">{k.v}</div>
                    <div className="text-[11px] text-primary">{k.c}</div>
                  </div>
                ))}
              </div>
              {/* Fake bar chart */}
              <div className="mt-4 rounded-lg border border-border p-3">
                <div className="text-xs text-muted-foreground mb-3">Monthly Revenue</div>
                <div className="flex items-end gap-2 h-24">
                  {[60, 80, 50, 90, 75, 100].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-primary/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 grid grid-cols-3 gap-4 text-center">
          {[
            ["500+", "Gyms"],
            ["50,000+", "Members"],
            ["₹2 Crore+", "Fees Collected"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-3xl font-bold text-primary">{v}</div>
              <div className="text-sm text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Problems */}
      <section className="max-w-7xl mx-auto px-4 lg:px-6 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center">Ab in problems ka solution hai</h2>
        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-red-200 bg-red-50/40 dark:bg-red-950/10 dark:border-red-900/40 p-6">
            <div className="font-semibold text-red-700 dark:text-red-300 mb-4">❌ Purane tareeke</div>
            <ul className="space-y-3">
              {PROBLEMS.map(([p]) => (
                <li key={p} className="flex items-start gap-2 text-sm">
                  <X className="w-4 h-4 text-red-500 mt-0.5" /> {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-primary/30 bg-accent/30 p-6">
            <div className="font-semibold text-primary mb-4">✅ GymPro ke saath</div>
            <ul className="space-y-3">
              {PROBLEMS.map(([, s]) => (
                <li key={s} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary mt-0.5" /> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-secondary/30 py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-center">Sab features, ek hi jagah</h2>
          <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-shadow">
                <div className="w-11 h-11 rounded-lg bg-accent text-primary flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 lg:px-6 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center">Simple Pricing</h2>
        <p className="text-center text-muted-foreground mt-2">14 din free trial · No credit card · Cancel anytime</p>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { name: "STARTER", price: "499", color: "border-border", popular: false, feats: ["100 members", "Attendance tracking", "Basic billing", "Email support"] },
            { name: "GROWTH", price: "1,299", color: "border-primary ring-2 ring-primary/40", popular: true, feats: ["500 members", "All Starter features", "Lead CRM", "WhatsApp reminders", "Trainer management", "Priority support"] },
            { name: "PRO", price: "2,999", color: "border-border", popular: false, feats: ["Unlimited members", "All features", "Multi-branch", "Custom branding", "Priority support"] },
          ].map((p) => (
            <div key={p.name} className={`relative rounded-2xl border ${p.color} bg-card p-7 flex flex-col`}>
              {p.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">MOST POPULAR</Badge>
              )}
              <div className="font-semibold text-sm tracking-wider text-primary">{p.name}</div>
              <div className="mt-3 text-4xl font-bold">₹{p.price}<span className="text-base font-normal text-muted-foreground">/month</span></div>
              <ul className="mt-6 space-y-2 text-sm flex-1">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={p.popular ? "default" : "outline"} asChild data-testid={`pricing-cta-${p.name.toLowerCase()}`}>
                <Link to="/register">Start Free Trial</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/30 py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <h2 className="text-3xl lg:text-4xl font-bold text-center">Gym owners ki kahaniyaan</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.n} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-1 text-yellow-500 mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-sm">"{t.q}"</p>
                <div className="mt-5 text-sm">
                  <div className="font-semibold">{t.n}</div>
                  <div className="text-muted-foreground text-xs">{t.g}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 lg:px-6 py-20">
        <h2 className="text-3xl lg:text-4xl font-bold text-center">Aksar puchhe jaane wale sawaal</h2>
        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map(([q, a], i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-3xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold">Aaj hi shuru karein — ₹0 mein, 14 din free</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/register");
            }}
            className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="aapka@email.com"
              className="flex-1 px-4 py-3 rounded-md text-foreground bg-background"
              data-testid="landing-email-input"
            />
            <Button type="submit" size="lg" className="bg-background text-primary hover:bg-secondary" data-testid="landing-final-cta">
              Start Free Trial
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 GymPro. Made with ❤️ for Indian Gyms
      </footer>
    </div>
  );
}
