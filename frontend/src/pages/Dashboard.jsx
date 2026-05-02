import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import {
  Users, TrendingUp, AlertTriangle, CheckCircle2, UserPlus,
  Wallet, Target, ClipboardCheck, ArrowUp, Activity,
} from "lucide-react";
import api from "@/lib/api";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DaysLeftBadge } from "@/components/StatusBadge";

const COLORS = ["#01696f", "#ea580c", "#2563eb", "#9ca3af", "#7c3aed"];

function Kpi({ icon: Icon, label, value, sub, color = "text-primary", testid }) {
  return (
    <Card className="kpi-card" data-testid={testid}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
            <div className="mt-2 text-3xl font-bold">{value}</div>
            <div className={`mt-1 text-xs ${color}`}>{sub}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-accent text-primary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/stats").then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="space-y-4" data-testid="dashboard-loading">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          icon={Users}
          label="Active Members"
          value={stats.activeMembers}
          sub={<span className="inline-flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Total {stats.totalMembers}</span>}
          testid="kpi-active-members"
        />
        <Kpi
          icon={TrendingUp}
          label="Revenue (Month)"
          value={formatCurrency(stats.monthRevenue)}
          sub="Is mahine ki kamai"
          testid="kpi-month-revenue"
        />
        <Kpi
          icon={AlertTriangle}
          label="Renewals Due"
          value={`${stats.expiringCount} members`}
          sub="agle 7 din mein"
          color={stats.expiringCount > 10 ? "text-red-500" : "text-orange-500"}
          testid="kpi-renewals-due"
        />
        <Kpi
          icon={ClipboardCheck}
          label="Today's Attendance"
          value={stats.todayAttendance}
          sub="checked in"
          testid="kpi-today-attendance"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Button className="h-12" onClick={() => navigate("/app/members/new")} data-testid="qa-add-member">
          <UserPlus className="w-4 h-4 mr-2" /> Add Member
        </Button>
        <Button variant="outline" className="h-12" onClick={() => navigate("/app/attendance")} data-testid="qa-mark-attendance">
          <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Attendance
        </Button>
        <Button variant="outline" className="h-12" onClick={() => navigate("/app/payments/new")} data-testid="qa-record-payment">
          <Wallet className="w-4 h-4 mr-2" /> Record Payment
        </Button>
        <Button variant="outline" className="h-12" onClick={() => navigate("/app/leads")} data-testid="qa-add-lead">
          <Target className="w-4 h-4 mr-2" /> Add Lead
        </Button>
      </div>

      {/* Chart row 1 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card data-testid="chart-revenue">
          <CardHeader><CardTitle className="text-base">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.revenueChart}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v) => formatCurrency(v)}
                />
                <Bar dataKey="revenue" fill="#01696f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="chart-plan-distribution">
          <CardHeader><CardTitle className="text-base">Membership Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.planDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {stats.planDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Chart row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card data-testid="chart-new-members">
          <CardHeader><CardTitle className="text-base">New Members per Month</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={stats.newMembersChart}>
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="count" stroke="#01696f" strokeWidth={3} dot={{ fill: "#01696f", r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card data-testid="chart-week-attendance">
          <CardHeader><CardTitle className="text-base">This Week's Attendance</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.weekAttendance}>
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {stats.weekAttendance.map((d, i) => (
                    <Cell key={i} fill={d.isToday ? "#01696f" : "#5fb1b6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expiring */}
      <Card data-testid="expiring-table">
        <CardHeader><CardTitle className="text-base">⚠️ Renewals Due — Next 7 Days</CardTitle></CardHeader>
        <CardContent>
          {stats.expiring.length === 0 ? (
            <div className="py-8 text-center text-green-600 dark:text-green-400">
              ✅ Koi renewal pending nahi hai
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="py-2">Name</th><th className="py-2">Phone</th><th className="py-2">Plan</th><th className="py-2">Expiry</th><th className="py-2">Days Left</th><th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.expiring.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 font-medium">{m.name}</td>
                      <td className="py-2.5 text-muted-foreground">{m.phone}</td>
                      <td className="py-2.5">{m.membershipType}</td>
                      <td className="py-2.5">{formatDate(m.expiryDate)}</td>
                      <td className="py-2.5"><DaysLeftBadge days={m.daysLeft} /></td>
                      <td className="py-2.5 text-right">
                        <Button size="sm" onClick={() => navigate(`/app/payments/new?member=${m.id}`)}>Renew</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity */}
      <Card data-testid="activity-feed">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Activity</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {stats.activity.length === 0 && <li className="text-muted-foreground text-sm">Koi activity nahi</li>}
            {stats.activity.map((a, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span
                  className={`w-2 h-2 mt-2 rounded-full ${
                    a.color === "green" ? "bg-green-500" : a.color === "blue" ? "bg-blue-500" : "bg-red-500"
                  }`}
                />
                <span className="flex-1">{a.text}</span>
                <span className="text-xs text-muted-foreground">{formatDateTime(a.time)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
