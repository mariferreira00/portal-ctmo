import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { useUserRole } from "./hooks/useUserRole";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import Teachers from "./pages/Teachers";
import Classes from "./pages/Classes";
import Students from "./pages/Students";
import Users from "./pages/Users";
import StudentPortal from "./pages/StudentPortal";
import StudentProfile from "./pages/StudentProfile";
import InstructorProfile from "./pages/InstructorProfile";
import Attendance from "./pages/Attendance";
import Achievements from "./pages/Achievements";
import TrainingFeed from "./pages/TrainingFeed";
import NotFound from "./pages/NotFound";
import InstructorSetup from "./pages/InstructorSetup";
import StudentSetup from "./pages/StudentSetup";
import InstructorRequests from "./pages/InstructorRequests";
import InstructorReports from "./pages/InstructorReports";
import AdminReports from "./pages/AdminReports";
import EnrollmentRequests from "./pages/EnrollmentRequests";
import { GlobalAchievementNotifications } from "./components/GlobalAchievementNotifications";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function DashboardRoute() {
  const { isAdmin, isInstructor, loading } = useUserRole();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }
  
  if (isAdmin) {
    return (
      <Layout>
        <Dashboard />
      </Layout>
    );
  }
  
  if (isInstructor) {
    return (
      <Layout>
        <InstructorDashboard />
      </Layout>
    );
  }
  
  return (
    <Layout>
      <StudentPortal />
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <GlobalAchievementNotifications />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/landing" element={<Landing />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRoute />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Teachers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Classes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/students"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Students />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Users />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-portal"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentPortal />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Attendance />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Achievements />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/training-feed"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TrainingFeed />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudentProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor-profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InstructorProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor-setup"
              element={
                <ProtectedRoute>
                  <InstructorSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-setup"
              element={
                <ProtectedRoute>
                  <StudentSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor-dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InstructorDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor-reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InstructorReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin-reports"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminReports />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/enrollment-requests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EnrollmentRequests />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/instructor-requests"
              element={
                <ProtectedRoute>
                  <Layout>
                    <InstructorRequests />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
