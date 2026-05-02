import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Wallet, CheckCircle2, ArrowLeft, MessageCircle, Printer } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import MemberAvatar from "@/components/MemberAvatar";
import { StatusBadge, DaysLeftBadge } from "@/components/StatusBadge";
import { formatDate, formatCurrency, daysLeft, waLink } from "@/lib/format";
import { generateInvoicePDF } from "@/lib/pdf";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { format, parseISO, differenceInDays } from "date-fns";

function bmiCategory(b) {
  if (b < 18.5) return ["Underweight", "bg-blue-100 text-blue-800"];
  if (b < 25) return ["Normal", "bg-green-100 text-green-800"];
  if (b < 30) return ["Overweight", "bg-orange-100 text-orange-800"];
  return ["Obese", "bg-red-100 text-red-800"];
}

export default function MemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { gym } = useAuth();
  const [member, setMember] = useState(null);
  const [trainer, setTrainer] = useState(null);
  const [att, setAtt] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    api.get(`/members/${id}`).then(async (r) => {
      setMember(r.data);
      if (r.data.trainerId) {
        const trs = await api.get("/trainers");
        setTrainer(trs.data.find((t) => t.id === r.data.trainerId) || null);
      }
    });
    api.get(`/attendance?memberId=${id}`).then((r) => setAtt(r.data));
    api.get("/payments").then((r) => setPayments(r.data.filter((p) => p.memberId === id)));
  }, [id]);

  if (!member) return <Skeleton className="h-96" />;

  const dl = daysLeft(member.expiryDate);
  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  // BMI
  const bmi = member.height && member.weight ? Number(member.weight) / Math.pow(Number(member.height) / 100, 2) : null;
  const bmiCat = bmi ? bmiCategory(bmi) : null;

  const markAttendanceToday = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    try {
      await api.post("/attendance", { memberId: id, date: today });
      toast.success("✅ Attendance mark ho gayi!");
      const r = await api.get(`/attendance?memberId=${id}`);
      setAtt(r.data);
    } catch {
      toast.error("Mark nahi ho paya");
    }
  };

  // 30-day heatmap
  const today = new Date();
  const heatmap = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const ds = format(d, "yyyy-MM-dd");
    const present = att.some((a) => a.date === ds);
    heatmap.push({ date: ds, present });
  }
  const presentDays = heatmap.filter((h) => h.present).length;

  return (
    <div className="space-y-5" data-testid="member-detail">
      <Button variant="ghost" onClick={() => navigate("/app/members")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Members
      </Button>

      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-5">
            <MemberAvatar name={member.name} photoUrl={member.photoUrl} size={80} />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">{member.name}</h2>
                <StatusBadge status={member.status} />
              </div>
              <div className="text-sm text-muted-foreground">{member.membershipId}</div>
              <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
                <div>📞 {member.phone}</div>
                <div>📧 {member.email || "—"}</div>
                <div>📋 Plan: <strong>{member.membershipType}</strong> · {formatCurrency(member.membershipFee)}</div>
                <div>📅 Expiry: {formatDate(member.expiryDate)} {member.status === "ACTIVE" && <DaysLeftBadge days={dl} />}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/app/members/${id}/edit`)} data-testid="md-edit"><Edit className="w-4 h-4 mr-2" />Edit</Button>
            <Button onClick={() => navigate(`/app/payments/new?member=${id}`)} data-testid="md-record-payment"><Wallet className="w-4 h-4 mr-2" />Record Payment</Button>
            <Button variant="outline" onClick={markAttendanceToday} data-testid="md-mark-attendance"><CheckCircle2 className="w-4 h-4 mr-2" />Mark Attendance Today</Button>
            <Button variant="outline" onClick={() => window.print()} data-testid="md-print"><Printer className="w-4 h-4 mr-2" />Print</Button>
            <Button variant="outline" asChild>
              <a href={waLink(member.phone, `Namaste ${member.name}!`)} target="_blank" rel="noreferrer"><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</a>
            </Button>
          </div>

          {member.status === "ACTIVE" && dl >= 0 && dl <= 7 && (
            <div className="mt-4 p-3 rounded-md bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-sm">
              ⚠️ Membership {dl === 0 ? "aaj" : `${dl} din mein`} expire ho rahi hai — <button onClick={() => navigate(`/app/payments/new?member=${id}`)} className="font-semibold underline">Renew Karein</button>
            </div>
          )}
          {member.status === "EXPIRED" && (
            <div className="mt-4 p-3 rounded-md bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-sm">
              🔴 Membership expire ho gayi — <button onClick={() => navigate(`/app/payments/new?member=${id}`)} className="font-semibold underline">Renew Karein</button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
          <TabsTrigger value="workout" data-testid="tab-workout">Workout</TabsTrigger>
          <TabsTrigger value="diet" data-testid="tab-diet">Diet</TabsTrigger>
          <TabsTrigger value="stats" data-testid="tab-stats">Body Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card><CardContent className="p-5 grid md:grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs text-muted-foreground">Trainer</div><div className="font-medium">{trainer?.name || "—"}{trainer && ` · ${trainer.speciality}`}</div></div>
            <div><div className="text-xs text-muted-foreground">Gender</div><div>{member.gender}</div></div>
            <div><div className="text-xs text-muted-foreground">DOB</div><div>{member.dateOfBirth ? formatDate(member.dateOfBirth) : "—"}</div></div>
            <div><div className="text-xs text-muted-foreground">Address</div><div>{member.address || "—"}</div></div>
            <div><div className="text-xs text-muted-foreground">Goal</div><div>{member.goal || "—"}</div></div>
            <div><div className="text-xs text-muted-foreground">Emergency</div><div>{member.emergencyContact || "—"} · {member.emergencyPhone || "—"}</div></div>
            <div className="md:col-span-2"><div className="text-xs text-muted-foreground">Notes</div><div>{member.notes || "—"}</div></div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card><CardContent className="p-5 space-y-4">
            <div className="text-sm font-medium">{presentDays} / 30 din pichle 30 din mein ({Math.round((presentDays / 30) * 100)}%)</div>
            <div className="grid grid-cols-15 gap-1.5" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
              {heatmap.map((d) => (
                <div
                  key={d.date}
                  title={d.date}
                  className={`aspect-square rounded ${d.present ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
            {att.length === 0 ? <div className="text-muted-foreground text-sm">Koi attendance record nahi</div> :
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Date</th><th className="py-2">Day</th><th className="py-2">Check-in</th><th className="py-2">Check-out</th></tr></thead>
                <tbody>{att.slice(0, 30).map((a) => <tr key={a.id} className="border-b border-border last:border-0"><td className="py-2">{formatDate(a.date)}</td><td className="py-2">{format(parseISO(a.date), "EEEE")}</td><td className="py-2">{a.checkIn || "—"}</td><td className="py-2">{a.checkOut || "—"}</td></tr>)}</tbody>
              </table></div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card><CardContent className="p-5 space-y-4">
            <div>Total paid: <strong>{formatCurrency(totalPaid)}</strong></div>
            {payments.length === 0 ? <div className="text-muted-foreground text-sm">Koi payment nahi</div> :
              <div className="overflow-x-auto"><table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="py-2">Invoice</th><th className="py-2">Date</th><th className="py-2">Amount</th><th className="py-2">Method</th><th className="py-2">Status</th><th></th></tr></thead>
                <tbody>{payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="py-2">{p.invoiceNo}</td>
                    <td className="py-2">{formatDate(p.paidAt)}</td>
                    <td className="py-2">{formatCurrency(p.amount)}</td>
                    <td className="py-2">{p.method}</td>
                    <td className="py-2"><StatusBadge status={p.status} /></td>
                    <td className="py-2 text-right"><Button size="sm" variant="outline" onClick={() => generateInvoicePDF({ payment: p, gym })}>PDF</Button></td>
                  </tr>
                ))}</tbody>
              </table></div>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="workout">
          <Card><CardContent className="p-10 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🏋️</div>
            Workout plan feature — Coming next iteration
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="diet">
          <Card><CardContent className="p-10 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🥗</div>
            Diet plan feature — Coming next iteration
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card><CardContent className="p-5 space-y-3">
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div><div className="text-xs text-muted-foreground">Height</div><div className="text-lg font-semibold">{member.height ? `${member.height} cm` : "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">Weight</div><div className="text-lg font-semibold">{member.weight ? `${member.weight} kg` : "—"}</div></div>
              <div><div className="text-xs text-muted-foreground">BMI</div>
                <div className="text-lg font-semibold flex items-center gap-2">{bmi ? bmi.toFixed(1) : "—"}{bmiCat && <span className={`text-xs px-2 py-0.5 rounded ${bmiCat[1]}`}>{bmiCat[0]}</span>}</div>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
