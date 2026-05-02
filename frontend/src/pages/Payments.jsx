import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, FileText, MessageCircle, Search } from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDate, waLink } from "@/lib/format";
import { generateInvoicePDF } from "@/lib/pdf";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const METHOD_COLORS = {
  CASH: "bg-green-100 text-green-800",
  UPI: "bg-purple-100 text-purple-800",
  CARD: "bg-blue-100 text-blue-800",
  ONLINE: "bg-amber-100 text-amber-800",
  CHEQUE: "bg-gray-100 text-gray-800",
};

export default function Payments({ newPayment }) {
  const { gym } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const memberPrefill = params.get("member");

  const [payments, setPayments] = useState(null);
  const [members, setMembers] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(!!newPayment);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const [form, setForm] = useState({
    memberId: memberPrefill || "",
    amount: "",
    method: "CASH",
    status: "PAID",
    description: "",
    paidAt: format(new Date(), "yyyy-MM-dd"),
  });

  const load = async () => {
    const [p, m] = await Promise.all([api.get("/payments"), api.get("/members")]);
    setPayments(p.data);
    setMembers(m.data);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (memberPrefill && members.length) {
      const mem = members.find((x) => x.id === memberPrefill);
      if (mem) {
        setForm((f) => ({ ...f, memberId: mem.id, amount: mem.membershipFee, description: `${mem.membershipType} Membership - ${format(new Date(), "MMM yyyy")}` }));
      }
      setDrawerOpen(true);
    }
  }, [memberPrefill, members]);

  const filtered = useMemo(() => {
    if (!payments) return [];
    const q = search.toLowerCase();
    return payments.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (methodFilter !== "ALL" && p.method !== methodFilter) return false;
      if (q && !`${p.memberName} ${p.invoiceNo}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [payments, search, statusFilter, methodFilter]);

  const stats = useMemo(() => {
    if (!payments) return { month: 0, pending: 0, overdue: 0 };
    const m = format(new Date(), "yyyy-MM");
    return {
      month: payments.filter((p) => p.status === "PAID" && (p.paidAt || "").startsWith(m)).reduce((s, p) => s + p.amount, 0),
      pending: payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0),
      overdue: payments.filter((p) => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0),
    };
  }, [payments]);

  const onMemberChange = (mid) => {
    const mem = members.find((x) => x.id === mid);
    setForm((f) => ({
      ...f,
      memberId: mid,
      amount: mem?.membershipFee || f.amount,
      description: mem ? `${mem.membershipType} Membership - ${format(new Date(), "MMM yyyy")}` : f.description,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.memberId) return toast.error("Member select karein");
    if (!form.amount || form.amount <= 0) return toast.error("Amount ₹1 se zyada hona chahiye");
    try {
      const { data } = await api.post("/payments", {
        memberId: form.memberId,
        amount: Number(form.amount),
        method: form.method,
        status: form.status,
        description: form.description,
        paidAt: new Date(form.paidAt).toISOString(),
      });
      toast.success(`✅ Payment recorded — Invoice ${data.invoiceNo}`);
      setDrawerOpen(false);
      setForm({ memberId: "", amount: "", method: "CASH", status: "PAID", description: "", paidAt: format(new Date(), "yyyy-MM-dd") });
      load();
    } catch {
      toast.error("Payment record fail");
    }
  };

  if (!payments) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-4" data-testid="payments-page">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payments</h2>
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button data-testid="payments-record-button"><Plus className="w-4 h-4 mr-2" /> Record Payment</Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto" data-testid="payment-drawer">
            <SheetHeader><SheetTitle>Record Payment</SheetTitle></SheetHeader>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label>Member *</Label>
                <Select value={form.memberId} onValueChange={onMemberChange}>
                  <SelectTrigger className="mt-1.5" data-testid="pay-member"><SelectValue placeholder="Select member" /></SelectTrigger>
                  <SelectContent>{members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name} — {m.phone}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₹) *</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="mt-1.5" data-testid="pay-amount" />
              </div>
              <div>
                <Label>Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger className="mt-1.5" data-testid="pay-method"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["CASH", "UPI", "CARD", "ONLINE", "CHEQUE"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" />
              </div>
              <Button type="submit" className="w-full" data-testid="pay-submit">Payment Record Karein</Button>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card data-testid="pay-stat-month"><CardContent className="p-4"><div className="text-xs text-muted-foreground">This Month</div><div className="text-2xl font-bold text-primary">{formatCurrency(stats.month)}</div></CardContent></Card>
        <Card data-testid="pay-stat-pending"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Pending</div><div className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pending)}</div></CardContent></Card>
        <Card data-testid="pay-stat-overdue"><CardContent className="p-4"><div className="text-xs text-muted-foreground">Overdue</div><div className="text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</div></CardContent></Card>
      </div>

      <Card><CardContent className="p-4">
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Member ya invoice..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Methods</SelectItem>
              {["CASH", "UPI", "CARD", "ONLINE", "CHEQUE"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">Koi payment nahi</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-2">Invoice</th><th className="py-2">Member</th><th className="py-2">Amount</th><th className="py-2">Method</th><th className="py-2">Status</th><th className="py-2">Date</th><th></th>
            </tr></thead>
            <tbody>{filtered.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0" data-testid={`payment-row-${p.id}`}>
                <td className="py-2 font-medium">{p.invoiceNo}</td>
                <td className="py-2">{p.memberName}</td>
                <td className="py-2">{formatCurrency(p.amount)}</td>
                <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs font-medium ${METHOD_COLORS[p.method] || ""}`}>{p.method}</span></td>
                <td className="py-2"><StatusBadge status={p.status} /></td>
                <td className="py-2">{formatDate(p.paidAt)}</td>
                <td className="py-2 text-right whitespace-nowrap">
                  <Button variant="ghost" size="icon" onClick={() => generateInvoicePDF({ payment: p, gym })} data-testid={`pay-pdf-${p.id}`} title="Invoice PDF"><FileText className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" asChild title="WhatsApp">
                    <a href={waLink(p.memberPhone, `Namaste ${p.memberName}! ${gym?.name || ""} se receipt: Invoice ${p.invoiceNo}, Amount ₹${p.amount}, Date: ${formatDate(p.paidAt)}. Shukriya! 💪`)} target="_blank" rel="noreferrer">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </a>
                  </Button>
                </td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </CardContent></Card>
    </div>
  );
}
