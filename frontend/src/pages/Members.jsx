import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, MoreHorizontal, Download } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import MemberAvatar from "@/components/MemberAvatar";
import { StatusBadge, DaysLeftBadge } from "@/components/StatusBadge";
import { formatDate, daysLeft, formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const PER_PAGE = 20;

export default function Members() {
  const navigate = useNavigate();
  const [members, setMembers] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [trainerFilter, setTrainerFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [del, setDel] = useState(null);

  const load = () => {
    Promise.all([api.get("/members"), api.get("/trainers")]).then(([m, t]) => {
      setMembers(m.data);
      setTrainers(t.data);
    });
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (!members) return [];
    const q = search.toLowerCase();
    return members.filter((m) => {
      if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
      if (planFilter !== "ALL" && m.membershipType !== planFilter) return false;
      if (trainerFilter !== "ALL" && m.trainerId !== trainerFilter) return false;
      if (q && !`${m.name} ${m.phone} ${m.membershipId}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [members, search, statusFilter, planFilter, trainerFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCSV = () => {
    const headers = ["MemberID", "Name", "Phone", "Plan", "Fee", "Join", "Expiry", "Status"];
    const rows = filtered.map((m) => [
      m.membershipId, m.name, m.phone, m.membershipType, m.membershipFee,
      m.joinDate, m.expiryDate, m.status,
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "members.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV download ho gayi");
  };

  const handleDelete = async () => {
    if (!del) return;
    try {
      await api.delete(`/members/${del.id}`);
      toast.success("Member delete ho gaya");
      setDel(null);
      load();
    } catch {
      toast.error("Delete fail");
    }
  };

  if (!members) {
    return <div className="space-y-3" data-testid="members-loading"><Skeleton className="h-12" /><Skeleton className="h-96" /></div>;
  }

  return (
    <div className="space-y-4" data-testid="members-page">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">Members</h2>
          <Badge variant="outline" data-testid="members-count">{filtered.length}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV} data-testid="members-export-csv">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => navigate("/app/members/new")} data-testid="members-add-button">
            <Plus className="w-4 h-4 mr-2" /> Add Member
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Naam, phone ya membership ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="members-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger data-testid="members-status-filter"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="FROZEN">Frozen</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger data-testid="members-plan-filter"><SelectValue placeholder="Plan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Plans</SelectItem>
              {[...new Set(members.map((m) => m.membershipType))].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={trainerFilter} onValueChange={setTrainerFilter}>
            <SelectTrigger data-testid="members-trainer-filter"><SelectValue placeholder="Trainer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Trainers</SelectItem>
              {trainers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        {paginated.length === 0 ? (
          <div className="py-16 text-center" data-testid="members-empty">
            <div className="text-5xl mb-3">👥</div>
            <div className="text-muted-foreground">Koi member nahi mila</div>
            <Button className="mt-4" onClick={() => navigate("/app/members/new")}>+ Add First Member</Button>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-border">
                    <th className="p-3">Member</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Expiry</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Trainer</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((m) => {
                    const dl = daysLeft(m.expiryDate);
                    const trainer = trainers.find((t) => t.id === m.trainerId);
                    return (
                      <tr
                        key={m.id}
                        className="border-b border-border last:border-0 hover:bg-secondary/40 cursor-pointer"
                        onClick={() => navigate(`/app/members/${m.id}`)}
                        data-testid={`member-row-${m.id}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <MemberAvatar name={m.name} photoUrl={m.photoUrl} size={36} />
                            <div>
                              <div className="font-medium">{m.name}</div>
                              <div className="text-xs text-muted-foreground">{m.membershipId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">{m.phone}</td>
                        <td className="p-3">
                          <div className="font-medium">{m.membershipType}</div>
                          <div className="text-xs text-muted-foreground">{formatCurrency(m.membershipFee)}</div>
                        </td>
                        <td className="p-3">
                          <div>{formatDate(m.expiryDate)}</div>
                          {m.status === "ACTIVE" && dl <= 7 && <div className="mt-1"><DaysLeftBadge days={dl} /></div>}
                        </td>
                        <td className="p-3"><StatusBadge status={m.status} /></td>
                        <td className="p-3 text-muted-foreground">{trainer?.name || "—"}</td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`member-actions-${m.id}`}><MoreHorizontal className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/app/members/${m.id}`)}>View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/app/members/${m.id}/edit`)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/app/payments/new?member=${m.id}`)}>Record Payment</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => setDel(m)}>Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              {paginated.map((m) => (
                <div key={m.id} className="p-3 flex items-center gap-3" onClick={() => navigate(`/app/members/${m.id}`)}>
                  <MemberAvatar name={m.name} photoUrl={m.photoUrl} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.membershipId} · {m.phone}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <StatusBadge status={m.status} />
                      <span className="text-muted-foreground">{m.membershipType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-border flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Showing {(page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kya aap sure hain?</AlertDialogTitle>
            <AlertDialogDescription>
              {del?.name} permanently delete ho jayega. Ye action undo nahi hoga.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete} data-testid="confirm-delete-member">
              Haan, Delete Karein
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
