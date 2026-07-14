import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { getUserRole, useAuthStore, type UserRole } from "@/store/auth";
import { Skeleton } from "@/components/ui/skeleton";
import RealtimeWarningBridge from "@/components/warnings/RealtimeWarningBridge";
import RanaAssistant from "@/components/assistant/RanaAssistant";
import MessageRealtimeBridge from "@/components/messages/MessageRealtimeBridge";
import SessionReplacedDialog from "@/components/auth/SessionReplacedDialog";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const Elders = lazy(() => import("@/pages/Elders"));
const Warnings = lazy(() => import("@/pages/Warnings"));
const FollowUp = lazy(() => import("@/pages/FollowUp"));
const FollowupTasks = lazy(() => import("@/pages/FollowupTasks"));
const Interventions = lazy(() => import("@/pages/Interventions"));
const Assessments = lazy(() => import("@/pages/Assessments"));
const Referrals = lazy(() => import("@/pages/Referrals"));
const Vitals = lazy(() => import("@/pages/Vitals"));
const Exams = lazy(() => import("@/pages/Exams"));
const Timeline = lazy(() => import("@/pages/Timeline"));
const KeyPopulation = lazy(() => import("@/pages/KeyPopulation"));
const NurseDashboard = lazy(() => import("@/pages/NurseDashboard"));
const NurseRecords = lazy(() => import("@/pages/NurseRecords"));
const NursePlans = lazy(() => import("@/pages/NursePlans"));
const NurseReview = lazy(() => import("@/pages/NurseReview"));
const AiReports = lazy(() => import("@/pages/AiReports"));
const WarningRules = lazy(() => import("@/pages/WarningRules"));
const Profile = lazy(() => import("@/pages/Profile"));
const Messages = lazy(() => import("@/pages/Messages"));
const AdminUsers = lazy(() => import("@/pages/AdminUsers"));
const AdminOperationLogs = lazy(() => import("@/pages/AdminOperationLogs"));
const ElderCareJourney = lazy(() => import("@/pages/ElderCareJourney"));

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
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
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
            <ProtectedRoute roles={["admin", "doctor", "nurse"]}>
              <FollowUp />
            </ProtectedRoute>
          }
        />
        <Route
          path="/followup-tasks"
          element={
            <ProtectedRoute roles={["admin", "doctor"]}>
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
