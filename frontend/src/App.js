import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/Members";
import MemberForm from "@/pages/MemberForm";
import MemberDetail from "@/pages/MemberDetail";
import Attendance from "@/pages/Attendance";
import Payments from "@/pages/Payments";
import Leads from "@/pages/Leads";
import Trainers from "@/pages/Trainers";
import Schedules from "@/pages/Schedules";
import Expenses from "@/pages/Expenses";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

import "@/App.css";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground" data-testid="auth-loading">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="members/new" element={<MemberForm />} />
              <Route path="members/:id" element={<MemberDetail />} />
              <Route path="members/:id/edit" element={<MemberForm />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="payments" element={<Payments />} />
              <Route path="payments/new" element={<Payments newPayment />} />
              <Route path="leads" element={<Leads />} />
              <Route path="trainers" element={<Trainers />} />
              <Route path="schedules" element={<Schedules />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
