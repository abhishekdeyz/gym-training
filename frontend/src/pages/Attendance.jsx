import React, { useEffect, useState, useMemo } from "react";
import { format, parseISO, subDays } from "date-fns";
import { Search, Download } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import MemberAvatar from "@/components/MemberAvatar";
import { StatusBadge, DaysLeftBadge } from "@/components/StatusBadge";
import { daysLeft, formatDate } from "@/lib/format";
import { toast } from "sonner";

export default function Attendance() {
  const [members, setMembers] = useState(null);
  const [today, setToday] = useState(format(new Date(), "yyyy-MM-dd"));
  const [todayAtt, setTodayAtt] = useState([]);
  const [allAtt, setAllAtt] = useState([]);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [flashId, setFlashId] = useState(null);

  const load = async () => {
    const [m, ta, all] = await Promise.all([
      api.get("/members"),
      api.get(`/attendance?date=${today}`),
      api.get("/attendance"),
    ]);
    setMembers(m.data);
    setTodayAtt(ta.data);
    setAllAtt(all.data);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [today]);

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    const q = search.toLowerCase();
    return members.filter((m) =>
      !q || `${m.name} ${m.phone} ${m.membershipId}`.toLowerCase().includes(q)
    );
  }, [members, search]);

  const isMarked = (mid) => todayAtt.some((a) => a.memberId === mid);

  const toggle = async (m) => {
    const existing = todayAtt.find((a) => a.memberId === m.id);
    try {
      if (existing) {
        await api.delete(`/attendance/${existing.id}`);
      } else {
        await api.post("/attendance", { memberId: m.id, date: today });
        setFlashId(m.id);
        setTimeout(() => setFlashId(null), 400);
      }
      const ta = await api.get(`/attendance?date=${today}`);
      setTodayAtt(ta.data);
    } catch {
      toast.error("Operation fail");
    }
  };

  const markAll = async () => {
    if (!window.confirm(`Sab ${filteredMembers.filter((m) => m.status === "ACTIVE").length} active members ko mark karein?`)) return;
    try {
      for (const m of filteredMembers.filter((x) => x.status === "ACTIVE")) {
        if (!isMarked(m.id)) {
          await api.post("/attendance", { memberId: m.id, date: today });
        }
      }
      const ta = await api.get(`/attendance?date=${today}`);
      setTodayAtt(ta.data);
      toast.success("Sab mark ho gaye!");
    } catch {
      toast.error("Operation fail");
    }
  };

  const reportData = useMemo(() => {
    const inRange = allAtt.filter((a) => a.date >= from && a.date <= to);
    const byDate = {};
    inRange.forEach((a) => { byDate[a.date] = (byDate[a.date] || 0) + 1; });
    const dateRows = Object.entries(byDate).sort((a, b) => b[0].localeCompare(a[0]));
    const totalDays = dateRows.length;
    const counts = dateRows.map(([, c]) => c);
    const avg = counts.length ? Math.round(counts.reduce((s, c) => s + c, 0) / counts.length) : 0;
    const best = counts.length ? Math.max(...counts) : 0;
    const worst = counts.length ? Math.min(...counts) : 0;

    const byMember = {};
    inRange.forEach((a) => { byMember[a.memberId] = (byMember[a.memberId] || 0) + 1; });
    const memberRows = (members || []).map((m) => ({
      ...m, days: byMember[m.id] || 0,
      pct: totalDays ? Math.round(((byMember[m.id] || 0) / totalDays) * 100) : 0,
      lastVisit: inRange.filter((a) => a.memberId === m.id).map((a) => a.date).sort().reverse()[0],
    })).sort((a, b) => b.days - a.days);
    return { totalDays, avg, best, worst, dateRows, memberRows };
  }, [allAtt, from, to, members]);

  const exportCSV = () => {
    const rows = ["Member,Days Present,% Attendance,Last Visit"];
    reportData.memberRows.forEach((m) => rows.push(`${m.name},${m.days},${m.pct}%,${m.lastVisit || "—"}`));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "attendance.csv"; a.click();
  };

  if (!members) return <Skeleton className="h-96" />;

  const todayStr = format(parseISO(today), "dd MMMM yyyy, EEEE");

  return (
    <div className="space-y-4" data-testid="attendance-page">
      <h2 className="text-2xl font-bold">Attendance</h2>
      <Tabs defaultValue="mark">
        <TabsList>
          <TabsTrigger value="mark" data-testid="tab-mark">Mark Attendance</TabsTrigger>
          <TabsTrigger value="reports" data-testid="tab-reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="mark">
          <Card><CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Input type="date" value={today} onChange={(e) => setToday(e.target.value)} className="w-48" data-testid="att-date-picker" />
              <div className="text-sm font-medium">Aaj: {todayStr}</div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm">{todayAtt.length} members ne attend kiya</span>
                <Button variant="outline" onClick={markAll} data-testid="att-mark-all">Sab ko Present Karein</Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Member ka naam ya phone..." value={search} onChange={(e) => setSearch(e.target.value)} data-testid="att-search" />
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredMembers.map((m) => {
                const marked = isMarked(m.id);
                const expired = m.status === "EXPIRED";
                const dl = daysLeft(m.expiryDate);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggle(m)}
                    data-testid={`att-card-${m.id}`}
                    className={`text-left rounded-lg border p-3 transition-all ${
                      marked ? "bg-green-500 text-white border-green-600" : "bg-card hover:border-primary"
                    } ${expired && !marked ? "border-red-400" : ""} ${flashId === m.id ? "flash-green" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <MemberAvatar name={m.name} photoUrl={m.photoUrl} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{m.name}</div>
                        <div className={`text-[11px] ${marked ? "text-white/80" : "text-muted-foreground"} truncate`}>{m.membershipId}</div>
                      </div>
                      {marked && <span>✅</span>}
                    </div>
                    {!marked && (
                      <div className="mt-1 text-[11px]">
                        {expired ? <span className="text-red-600">Expired</span> : (m.status === "ACTIVE" && dl <= 7) ? <DaysLeftBadge days={dl} /> : <StatusBadge status={m.status} />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card><CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div><label className="text-xs text-muted-foreground">From</label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div><label className="text-xs text-muted-foreground">To</label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
              <Button variant="outline" onClick={exportCSV} className="ml-auto"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Total Days</div><div className="text-2xl font-bold">{reportData.totalDays}</div></CardContent></Card>
              <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Avg per day</div><div className="text-2xl font-bold">{reportData.avg}</div></CardContent></Card>
              <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Best day</div><div className="text-2xl font-bold">{reportData.best}</div></CardContent></Card>
              <Card><CardContent className="p-3"><div className="text-xs text-muted-foreground">Worst day</div><div className="text-2xl font-bold">{reportData.worst}</div></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle className="text-base">Member-wise</CardTitle></CardHeader><CardContent>
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Member</th><th className="py-2">Days</th><th className="py-2">%</th><th className="py-2">Last Visit</th></tr></thead>
                <tbody>{reportData.memberRows.slice(0, 50).map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="py-2">{m.name}</td><td className="py-2">{m.days}</td><td className="py-2">{m.pct}%</td><td className="py-2">{m.lastVisit ? formatDate(m.lastVisit) : "—"}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            </CardContent></Card>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
