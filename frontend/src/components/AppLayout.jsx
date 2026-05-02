import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Home, Users, CheckSquare, Wallet, Target, UserCog, Calendar,
  Receipt, BarChart3, Settings as SettingsIcon, Dumbbell, Bell,
  Sun, Moon, LogOut, ChevronDown, Menu, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import api from "@/lib/api";
import { daysLeft, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { to: "/app/dashboard", icon: Home, label: "Dashboard", testId: "nav-dashboard" },
  { to: "/app/members", icon: Users, label: "Members", testId: "nav-members" },
  { to: "/app/attendance", icon: CheckSquare, label: "Attendance", testId: "nav-attendance" },
  { to: "/app/payments", icon: Wallet, label: "Payments", testId: "nav-payments" },
  { to: "/app/leads", icon: Target, label: "Leads CRM", testId: "nav-leads" },
  { to: "/app/trainers", icon: UserCog, label: "Trainers", testId: "nav-trainers" },
  { to: "/app/schedules", icon: Calendar, label: "Schedules", testId: "nav-schedules" },
  { to: "/app/expenses", icon: Receipt, label: "Expenses", testId: "nav-expenses" },
  { to: "/app/reports", icon: BarChart3, label: "Reports", testId: "nav-reports" },
];

const PAGE_TITLES = {
  "/app/dashboard": "Dashboard",
  "/app/members": "Members",
  "/app/attendance": "Attendance",
  "/app/payments": "Payments",
  "/app/leads": "Leads CRM",
  "/app/trainers": "Trainers",
  "/app/schedules": "Class Schedule",
  "/app/expenses": "Expenses",
  "/app/reports": "Reports & Analytics",
  "/app/settings": "Settings",
};

function Sidebar({ open, onClose }) {
  const { gym } = useAuth();
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-backdrop"
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-60 z-40 bg-card border-r border-border flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        data-testid="app-sidebar"
      >
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none">GymPro</div>
              <div className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                {gym?.name || "Gym"}
              </div>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              data-testid={item.testId}
              className={({ isActive }) => `gp-side-link ${isActive ? "active" : ""}`}
              onClick={onClose}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <NavLink
            to="/app/settings"
            data-testid="nav-settings"
            className={({ isActive }) => `gp-side-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
}

function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: members }, { data: payments }, { data: leads }] = await Promise.all([
          api.get("/members"),
          api.get("/payments"),
          api.get("/leads"),
        ]);
        const today = new Date().toISOString().slice(0, 10);
        const list = [];
        members.forEach((m) => {
          const d = daysLeft(m.expiryDate);
          if (m.status === "ACTIVE" && d >= 0 && d <= 7) {
            list.push({
              type: d <= 1 ? "danger" : "warn",
              text: `${m.name} ka membership ${d === 0 ? "aaj" : `${d} din mein`} expire`,
            });
          }
        });
        payments
          .filter((p) => p.status === "OVERDUE")
          .forEach((p) => list.push({ type: "danger", text: `${p.memberName} ka ₹${p.amount} overdue` }));
        leads
          .filter((l) => (l.createdAt || "").slice(0, 10) === today)
          .forEach((l) => list.push({ type: "info", text: `New lead: ${l.name}` }));
        setItems(list.slice(0, 8));
      } catch {
        // ignore
      }
    };
    fetchData();
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="notification-bell">
          <Bell className="w-5 h-5" />
          {items.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {items.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground text-center">
            Sab kuch up to date hai
          </div>
        ) : (
          items.map((it, i) => (
            <DropdownMenuItem key={i} className="flex items-start gap-2 py-2">
              <span
                className={`w-2 h-2 mt-1.5 rounded-full ${
                  it.type === "danger" ? "bg-red-500" : it.type === "warn" ? "bg-orange-500" : "bg-blue-500"
                }`}
              />
              <span className="text-sm">{it.text}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header({ onMenuClick }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const title = PAGE_TITLES[location.pathname] || PAGE_TITLES[Object.keys(PAGE_TITLES).find((k) => location.pathname.startsWith(k))] || "GymPro";

  return (
    <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            data-testid="mobile-menu-toggle"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold tracking-tight" data-testid="page-title">{title}</h1>
        </div>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={toggle} data-testid="theme-toggle">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2" data-testid="user-menu-trigger">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {(user?.name || "U")[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium">{user?.name}</span>
                <ChevronDown className="w-4 h-4 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => (window.location.href = "/app/settings")} data-testid="user-menu-profile">
                <SettingsIcon className="w-4 h-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-red-600" data-testid="user-menu-logout">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function MobileBottomNav() {
  const items = NAV.slice(0, 4).concat([{ to: "/app/settings", icon: SettingsIcon, label: "More", testId: "nav-mobile-more" }]);
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-card border-t border-border grid grid-cols-5">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          data-testid={it.testId}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-2 text-[11px] gap-1 ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <it.icon className="w-5 h-5" />
          {it.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 fade-up">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
