import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { getUserRole, useAuthStore, type UserRole } from "@/store/auth";
import { Skeleton } from "@/components/ui/skeleton";
import RealtimeWarningBridge from "@/components/warnings/RealtimeWarningBridge";
import RanaAssistant from "@/components/assistant/RanaAssistant";
import MessageRealtimeBridge from "@/components/messages/MessageRealtimeBridge";
import SessionReplacedDialog from "@/components/auth/SessionReplacedDialog";
import { lazyWithRetry } from "@/lib/lazyWithRetry";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Login = lazyWithRetry(() => import("@/pages/Login"));
const Dashboard = lazyWithRetry(() => import("@/pages/Dashboard"));
const AdminDashboard = lazyWithRetry(() => import("@/pages/AdminDashboard"));
const Elders = lazyWithRetry(() => import("@/pages/Elders"));
const Warnings = lazyWithRetry(() => import("@/pages/Warnings"));
const FollowUp = lazyWithRetry(() => import("@/pages/FollowUp"));
const FollowupTasks = lazyWithRetry(() => import("@/pages/FollowupTasks"));
const Interventions = lazyWithRetry(() => import("@/pages/Interventions"));
const Assessments = lazyWithRetry(() => import("@/pages/Assessments"));
const Referrals = lazyWithRetry(() => import("@/pages/Referrals"));
const Vitals = lazyWithRetry(() => import("@/pages/Vitals"));
const Exams = lazyWithRetry(() => import("@/pages/Exams"));
const Timeline = lazyWithRetry(() => import("@/pages/Timeline"));
const KeyPopulation = lazyWithRetry(() => import("@/pages/KeyPopulation"));
const NurseDashboard = lazyWithRetry(() => import("@/pages/NurseDashboard"));
const NurseRecords = lazyWithRetry(() => import("@/pages/NurseRecords"));
const NursePlans = lazyWithRetry(() => import("@/pages/NursePlans"));
const NurseReview = lazyWithRetry(() => import("@/pages/NurseReview"));
const AiReports = lazyWithRetry(() => import("@/pages/AiReports"));
const WarningRules = lazyWithRetry(() => import("@/pages/WarningRules"));
const Profile = lazyWithRetry(() => import("@/pages/Profile"));
const Messages = lazyWithRetry(() => import("@/pages/Messages"));
const AdminUsers = lazyWithRetry(() => import("@/pages/AdminUsers"));
const AdminOperationLogs = lazyWithRetry(
  () => import("@/pages/AdminOperationLogs"),
);
const ElderCareJourney = lazyWithRetry(() => import("@/pages/ElderCareJourney"));

function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-sky-50 to-medical-50">
      <div className="space-y-4 w-80">
        <Skeleton className="h-8 w-3/4 rounded-lg" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );
}

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { isAuthenticated, userInfo } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(getUserRole(userInfo)))
    return <Navigate to="/" replace />;
  return children;
}

function RoleHome() {
  const { userInfo } = useAuthStore();
  const role = getUserRole(userInfo);
  if (role === "admin") return <Navigate to="/admin-dashboard" replace />;
  if (role === "nurse") return <Navigate to="/nurse-dashboard" replace />;
  return <Dashboard />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse-dashboard"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <NurseDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/elders"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Elders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/elders/:elderId/care-journey"
          element={
            <ProtectedRoute roles={["admin", "doctor"]}>
              <ElderCareJourney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warnings"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Warnings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/followup"
          element={
            <ProtectedRoute roles={["admin", "doctor"]}>
              <FollowUp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/followup-tasks"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <FollowupTasks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/key-population"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <KeyPopulation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interventions"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Interventions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessments"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Assessments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/referrals"
          element={
            <ProtectedRoute roles={["admin", "doctor"]}>
              <Referrals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vitals"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Vitals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Exams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Timeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse-review"
          element={
            <ProtectedRoute roles={["admin", "doctor"]}>
              <NurseReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse-records"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <NurseRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nurse-plans"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <NursePlans />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-reports"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <AiReports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/warning-rules"
          element={
            <ProtectedRoute roles={["admin", "doctor"]}>
              <WarningRules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/operation-logs"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminOperationLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RealtimeWarningBridge />
        <MessageRealtimeBridge />
        <SessionReplacedDialog />
        <AppRoutes />
        <RanaAssistant />
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}

export default App;
