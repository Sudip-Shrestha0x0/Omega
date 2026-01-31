import React, { Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import NotFound from "@/pages/NotFound";
import TermsOfService from "@/pages/TermsOfService";

// Layouts
const DashboardLayout = React.lazy(() => import("@/layouts/DashboardLayout"));

// Pages
const AdminDashboard = React.lazy(() => import("@/pages/admin/AdminDashboard"));
const Payment = React.lazy(() => import("@/pages/user/Payment"));
const UserChat = React.lazy(() => import("@/pages/user/UserChat"));
const UserHistory = React.lazy(() => import("@/pages/user/UserHistory"));
const UserPlans = React.lazy(() => import("@/pages/user/UserPlans"));
const UserSettings = React.lazy(() => import("@/pages/user/UserSettings"));
const UserTeams = React.lazy(() => import("@/pages/user/UserTeams"));

// Public Pages
const Landing = React.lazy(() => import("@/pages/Landing"));

// Loading Spinner
const FullPageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
  </div>
);

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Suspense fallback={<FullPageLoader />}>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route path="chat" element={<UserChat />} />
                  <Route path="teams" element={<UserTeams />} />
                  <Route path="settings" element={<UserSettings />} />
                  <Route path="plans" element={<UserPlans />} />
                  <Route path="payment" element={<Payment />} />
                  <Route path="history" element={<UserHistory />} />
                  <Route path="admin" element={<AdminDashboard />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
