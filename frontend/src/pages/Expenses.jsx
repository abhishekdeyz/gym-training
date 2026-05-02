import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import { format, parseISO } from "date-fns";

const CATEGORIES = [
  { v: "RENT", l: "🏠 Rent", c: "bg-amber-100 text-amber-800" },
  { v: "EQUIPMENT", l: "🏋️ Equipment", c: "bg-purple-100 text-purple-800" },
  { v: "SALARY", l: "👤 Salary", c: "bg-blue-100 text-blue-800" },
  { v: "ELECTRICITY", l: "⚡ Electricity", c: "bg-yellow-100 text-yellow-800" },
  { v: "INTERNET", l: "🌐 Internet", c: "bg-cyan-100 text-cyan-800" },
  { v: "MARKETING", l: "📢 Marketing", c: "bg-pink-100 text-pink-800" },
  { v: "MAINTENANCE", l: "🔧 Maintenance", c: "bg-orange-100 text-orange-800" },
  { v: "OTHER", l: "📦 Other", c: "bg-gray-100 text-gray-800" },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "RENT", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });

  const load = () => Promise.all([api.get("/expenses"), api.get("/payments")]).then(([e, p]) => {
    setExpenses(e.data);
    setPayments(p.data);
  });
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const cm = format(new Date(), "yyyy-MM");
    const lm = format(new Date(new Date().setMonth(new Date().getMonth() - 1)), "yyyy-MM");
    const thisM = expenses.filter((e) => (e.date || "").startsWith(cm)).reduce((s, e) => s + e.amount, 0);
    const lastM = expenses.filter((e) => (e.date || "").startsWith(lm)).reduce((s, e) => s + e.amount, 0);
    const byCat = {};
    expenses.filter((e) => (e.date || "").startsWith(cm)).forEach((e) => byCat[e.category] = (byCat[e.category] || 0) + e.amount);
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
    return { thisM, lastM, top };
  }, [expenses]);

  // P&L 6 months
  const plChart = useMemo(() => {
    const today = new Date();
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = format(d, "yyyy-MM");
      const inc = payments.filter((p) => p.status === "PAID" && (p.paidAt || "").startsWith(ym)).reduce((s, p) => s + p.amount, 0);
      const exp = expenses.filter((e) => (e.date || "").startsWith(ym)).reduce((s, e) => s + e.amount, 0);
      arr.push({ month: format(d, "MMM"), Income: inc, Expenses: exp, Profit: inc - exp });
    }
    return arr;
  }, [payments, expenses]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) return toast.error("Amount required");
    try {
      await api.post("/expenses", { ...form, amount: Number(form.amount) });
      toast.success("Expense added");
      setOpen(false);
      setForm({ category: "RENT", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
      load();
    } catch { toast.error("Save fail"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete?")) return;
    await api.delete(`/expenses/${id}`);
    load();
  };

  const catBadge = (c) => CATEGORIES.find((x) => x.v === c) || CATEGORIES[CATEGORIES.length - 1];

  return (
    <div className="space-y-4" data-testid="expenses-page">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="expense-add-button"><Plus className="w-4 h-4 mr-2" /> Add Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Expense</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Amount (₹) *</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1.5" data-testid="expense-amount" /></div>
                <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1.5" /></div>
              </div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" /></div>
              <Button type="submit" className="w-full" data-testid="expense-submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">This Month Total</div><div className="text-2xl font-bold">{formatCurrency(stats.thisM)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Last Month</div><div className="text-2xl font-bold">{formatCurrency(stats.lastM)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Biggest Category</div><div className="text-2xl font-bold">{stats.top ? `${stats.top[0]} — ${formatCurrency(stats.top[1])}` : "—"}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Profit & Loss (6 months)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={plChart}>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Income" fill="#01696f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card><CardContent className="p-4">
        {expenses.length === 0 ? <div className="py-12 text-center text-muted-foreground">Koi expense nahi</div> :
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Date</th><th className="py-2">Category</th><th className="py-2">Description</th><th className="py-2">Amount</th><th></th></tr></thead>
            <tbody>{expenses.map((e) => {
              const c = catBadge(e.category);
              return (
                <tr key={e.id} className="border-b border-border last:border-0">
                  <td className="py-2">{formatDate(e.date)}</td>
                  <td className="py-2"><Badge variant="outline" className={c.c}>{c.l}</Badge></td>
                  <td className="py-2 text-muted-foreground">{e.description || "—"}</td>
                  <td className="py-2 font-medium">{formatCurrency(e.amount)}</td>
                  <td className="py-2 text-right"><Button variant="ghost" size="icon" onClick={() => remove(e.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button></td>
                </tr>
              );
            })}</tbody>
          </table></div>
        }
      </CardContent></Card>
    </div>
  );
}
