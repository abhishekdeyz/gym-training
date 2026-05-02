import React, { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/format";
import { format, subMonths, parseISO } from "date-fns";

const COLORS = ["#01696f", "#ea580c", "#2563eb", "#7c3aed", "#0d9488", "#9ca3af"];

export default function Reports() {
  const [period, setPeriod] = useState("6m");
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([api.get("/payments"), api.get("/members"), api.get("/expenses"), api.get("/attendance")]).then(([p, m, e, a]) =>
      setData({ payments: p.data, members: m.data, expenses: e.data, attendance: a.data })
    );
  }, []);

  const range = useMemo(() => {
    const today = new Date();
    let from = subMonths(today, 6);
    if (period === "month") from = subMonths(today, 1);
    if (period === "3m") from = subMonths(today, 3);
    if (period === "year") from = subMonths(today, 12);
    return { from: format(from, "yyyy-MM-dd"), to: format(today, "yyyy-MM-dd") };
  }, [period]);

  const revenue = useMemo(() => {
    if (!data) return null;
    const inRange = data.payments.filter((p) => p.status === "PAID" && (p.paidAt || "").slice(0, 10) >= range.from);
    const total = inRange.reduce((s, p) => s + p.amount, 0);
    const expensesRange = data.expenses.filter((e) => (e.date || "").slice(0, 10) >= range.from);
    const totalExp = expensesRange.reduce((s, e) => s + e.amount, 0);

    const byPlan = {};
    inRange.forEach((p) => {
      const m = data.members.find((x) => x.id === p.memberId);
      const k = m?.membershipType || "Other";
      byPlan[k] = (byPlan[k] || 0) + p.amount;
    });
    const planArr = Object.entries(byPlan).map(([name, value]) => ({ name, value }));

    const byMethod = {};
    inRange.forEach((p) => byMethod[p.method] = (byMethod[p.method] || 0) + p.amount);
    const methodArr = Object.entries(byMethod).map(([name, value]) => ({ name, value }));

    // monthwise
    const months = {};
    inRange.forEach((p) => {
      const m = (p.paidAt || "").slice(0, 7);
      months[m] = months[m] || { month: m, revenue: 0, newM: 0, renewals: 0, expenses: 0 };
      months[m].revenue += p.amount;
    });
    data.members.forEach((m) => {
      const k = (m.joinDate || "").slice(0, 7);
      if (k >= range.from.slice(0, 7)) {
        months[k] = months[k] || { month: k, revenue: 0, newM: 0, renewals: 0, expenses: 0 };
        months[k].newM += 1;
      }
    });
    expensesRange.forEach((e) => {
      const k = (e.date || "").slice(0, 7);
      months[k] = months[k] || { month: k, revenue: 0, newM: 0, renewals: 0, expenses: 0 };
      months[k].expenses += e.amount;
    });
    const monthArr = Object.values(months).sort((a, b) => a.month.localeCompare(b.month));

    return { total, totalExp, profit: total - totalExp, planArr, methodArr, monthArr };
  }, [data, range]);

  const exportCSV = () => {
    if (!revenue) return;
    const rows = ["Month,Revenue,New Members,Expenses,Profit"];
    revenue.monthArr.forEach((m) => rows.push(`${m.month},${m.revenue},${m.newM},${m.expenses},${m.revenue - m.expenses}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "report.csv"; a.click();
  };

  const memberStats = useMemo(() => {
    if (!data) return null;
    const months = {};
    data.members.forEach((m) => {
      const k = (m.joinDate || "").slice(0, 7);
      if (!k) return;
      months[k] = months[k] || { month: k, count: 0 };
      months[k].count += 1;
    });
    const monthArr = Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    const active = data.members.filter((m) => m.status === "ACTIVE").length;
    const expired = data.members.filter((m) => m.status === "EXPIRED").length;
    const frozen = data.members.filter((m) => m.status === "FROZEN").length;
    return { monthArr, statusArr: [{ name: "Active", value: active }, { name: "Expired", value: expired }, { name: "Frozen", value: frozen }] };
  }, [data]);

  const attStats = useMemo(() => {
    if (!data) return null;
    const byDate = {};
    data.attendance.forEach((a) => byDate[a.date] = (byDate[a.date] || 0) + 1);
    const arr = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).slice(-30).map(([date, count]) => ({ date: date.slice(5), count }));
    const noAttendance = data.members.filter((m) => !data.attendance.some((a) => a.memberId === m.id && a.date.slice(0, 7) === format(new Date(), "yyyy-MM")));
    return { arr, noAttendance };
  }, [data]);

  if (!data) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-4" data-testid="reports-page">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44" data-testid="reports-period"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="3m">Last 3 Months</SelectItem>
              <SelectItem value="6m">Last 6 Months</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
        </div>
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
          <TabsTrigger value="membership" data-testid="tab-membership">Membership</TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          {revenue && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Revenue</div><div className="text-2xl font-bold text-primary">{formatCurrency(revenue.total)}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Expenses</div><div className="text-2xl font-bold text-red-600">{formatCurrency(revenue.totalExp)}</div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Net Profit</div><div className={`text-2xl font-bold ${revenue.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(revenue.profit)}</div></CardContent></Card>
              </div>
              <div className="grid lg:grid-cols-2 gap-4">
                <Card><CardHeader><CardTitle className="text-base">Revenue by Plan</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={240}><PieChart>
                    <Pie data={revenue.planArr} dataKey="value" nameKey="name" outerRadius={90} label>
                      {revenue.planArr.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie><Tooltip formatter={(v) => formatCurrency(v)} /><Legend />
                  </PieChart></ResponsiveContainer>
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">Revenue by Method</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={240}><BarChart data={revenue.methodArr}>
                    <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} /><Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="value" fill="#01696f" radius={[4, 4, 0, 0]} />
                  </BarChart></ResponsiveContainer>
                </CardContent></Card>
              </div>
              <Card><CardHeader><CardTitle className="text-base">Month-wise</CardTitle></CardHeader><CardContent>
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Month</th><th>New Members</th><th>Revenue</th><th>Expenses</th><th>Profit</th></tr></thead>
                  <tbody>{revenue.monthArr.map((m) => (
                    <tr key={m.month} className="border-b border-border last:border-0"><td className="py-2">{m.month}</td><td>{m.newM}</td><td>{formatCurrency(m.revenue)}</td><td>{formatCurrency(m.expenses)}</td><td className={m.revenue - m.expenses >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(m.revenue - m.expenses)}</td></tr>
                  ))}</tbody>
                </table></div>
              </CardContent></Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="membership">
          {memberStats && (
            <div className="space-y-4">
              <div className="grid lg:grid-cols-2 gap-4">
                <Card><CardHeader><CardTitle className="text-base">New Members per Month</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={240}><BarChart data={memberStats.monthArr}>
                    <XAxis dataKey="month" fontSize={12} /><YAxis fontSize={12} /><Tooltip />
                    <Bar dataKey="count" fill="#01696f" radius={[4, 4, 0, 0]} />
                  </BarChart></ResponsiveContainer>
                </CardContent></Card>
                <Card><CardHeader><CardTitle className="text-base">Active vs Expired</CardTitle></CardHeader><CardContent>
                  <ResponsiveContainer width="100%" height={240}><PieChart>
                    <Pie data={memberStats.statusArr} dataKey="value" nameKey="name" outerRadius={90} label>
                      {memberStats.statusArr.map((_, i) => <Cell key={i} fill={["#16a34a", "#dc2626", "#2563eb"][i]} />)}
                    </Pie><Tooltip /><Legend />
                  </PieChart></ResponsiveContainer>
                </CardContent></Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance">
          {attStats && (
            <div className="space-y-4">
              <Card><CardHeader><CardTitle className="text-base">Daily Attendance (last 30 days)</CardTitle></CardHeader><CardContent>
                <ResponsiveContainer width="100%" height={260}><LineChart data={attStats.arr}>
                  <XAxis dataKey="date" fontSize={11} /><YAxis fontSize={12} /><Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#01696f" strokeWidth={2.5} dot={false} />
                </LineChart></ResponsiveContainer>
              </CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base text-red-600">Members with 0 Attendance (this month)</CardTitle></CardHeader><CardContent>
                {attStats.noAttendance.length === 0 ? <div className="text-sm text-muted-foreground">Sab members ne attend kiya hai 🎉</div> :
                  <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Member</th><th>Phone</th><th>Status</th></tr></thead>
                    <tbody>{attStats.noAttendance.slice(0, 30).map((m) => (
                      <tr key={m.id} className="border-b border-border last:border-0"><td className="py-2">{m.name}</td><td>{m.phone}</td><td>{m.status}</td></tr>
                    ))}</tbody>
                  </table></div>}
              </CardContent></Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
