import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import DashboardRedirect from './components/DashboardRedirect';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import theme from './theme';

// Authentication Pages
import LoginPage from './pages/LoginPage';
import SelectOTPMethodPage from './pages/SelectOTPMethodPage';
import VerifyOTPPage from './pages/VerifyOTPPage';
import OnboardingPage from './pages/OnboardingPage';
import SetInitialPasswordPage from './pages/SetInitialPasswordPage';

// Event Pages
import EventSetupWizard from './pages/EventSetupWizard';
import EventDashboard from './pages/EventDashboard';

// Subcommittees Pages
import SubcommitteesListPage from './pages/SubcommitteesListPage';
import RoleCommitteesPage from './pages/RoleCommitteesPage';
import CreateSubcommitteePage from './pages/CreateSubcommitteePage';
import SubcommitteeDetailsPage from './pages/SubcommitteeDetailsPage';

// Budget & Finance Pages
import BudgetManagementPage from './pages/BudgetManagementPage';
import BudgetItemsPage from './pages/BudgetItemsPage';
import RequisitionsPage from './pages/RequisitionsPage';
import PaymentLogsPage from './pages/PaymentLogsPage';
import TreasuryPage from './pages/TreasuryPage';
import FinancePage from './pages/FinancePage';

// Cluster Pages
import ClusterManagementPage from './pages/ClusterManagementPage';
import ClusterListPage from './pages/ClusterListPage';
import ClusterDetailsPage from './pages/ClusterDetailsPage';
import SubmitFundsPage from './pages/SubmitFundsPage';
import TreasurerConfirmationPage from './pages/TreasurerConfirmationPage';

// Approvals
import ApprovalCenterPage from './pages/ApprovalCenterPage';

// Reports Pages
import ReportsPage from './pages/ReportsPage';
import EventReportsPage from './pages/EventReportsPage';
import EventSummaryReportPage from './pages/EventSummaryReportPage';
import FinancialReportPage from './pages/FinancialReportPage';
import SubcommitteeReportsPage from './pages/SubcommitteeReportsPage';

// User Account Pages
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';

// Admin Pages
import ManageUsersPage from './pages/ManageUsersPage';
import ManageCommitteesPage from './pages/ManageCommitteesPage';
import EventSettingsPage from './pages/EventSettingsPage';

// Other Pages
import CommitteesPage from './pages/CommitteesPage';
import CommitteeMembersPage from './pages/CommitteeMembersPage';
import TasksPage from './pages/TasksPage';
import ProvidersPage from './pages/ProvidersPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Authentication Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/select-otp-method" element={<SelectOTPMethodPage />} />
                <Route path="/verify-otp" element={<VerifyOTPPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                
                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  {/* Dashboard */}
                  <Route index element={<DashboardRedirect />} />
                  <Route path="dashboard" element={<DashboardRedirect />} />
                  <Route path="set-password" element={<SetInitialPasswordPage />} />
                  
                  {/* Event Routes - IMPORTANT: Static routes MUST come before dynamic :eventId routes */}
                  {/* Single Event System: Only one event creation route for first-time setup */}
                  <Route path="events/create" element={<EventSetupWizard />} />
                  
                  {/* Dynamic Event Routes - These match actual event IDs */}
                  <Route path="events/:eventId/dashboard" element={<EventDashboard />} />
                  
                  {/* Subcommittees Routes */}
                  <Route path="events/:eventId/role-committees" element={<RoleCommitteesPage />} />
                  <Route path="events/:eventId/subcommittees" element={<SubcommitteesListPage />} />
                  <Route path="events/:eventId/subcommittees/create" element={<CreateSubcommitteePage />} />
                  <Route path="events/:eventId/subcommittees/:subcommitteeId" element={<SubcommitteeDetailsPage />} />
                  
                  {/* Committee Members Route */}
                  <Route path="events/:eventId/committee-members" element={<CommitteeMembersPage />} />
                  
                  {/* Budget & Finance Routes */}
                  <Route path="events/:eventId/budget" element={<BudgetManagementPage />} />
                  <Route path="events/:eventId/budget/items" element={<BudgetItemsPage />} />
                  <Route path="events/:eventId/requisitions" element={<RequisitionsPage />} />
                  <Route path="events/:eventId/payment-logs" element={<PaymentLogsPage />} />
                  <Route path="events/:eventId/treasury" element={<TreasuryPage />} />
                  
                  {/* Cluster Routes */}
                  <Route path="events/:eventId/clusters" element={<ClusterManagementPage />} />
                  <Route path="events/:eventId/clusters/list" element={<ClusterListPage />} />
                  <Route path="events/:eventId/clusters/:clusterId/details" element={<ClusterDetailsPage />} />
                  <Route path="events/:eventId/clusters/:clusterId/submit-funds" element={<SubmitFundsPage />} />
                  <Route path="events/:eventId/treasurer/confirmations" element={<TreasurerConfirmationPage />} />
                  
                  {/* Approvals Route */}
                  <Route path="events/:eventId/approvals" element={<ApprovalCenterPage />} />
                  
                  {/* Reports Routes */}
                  <Route path="events/:eventId/reports" element={<EventReportsPage />} />
                  <Route path="events/:eventId/reports/event-summary" element={<EventSummaryReportPage />} />
                  <Route path="events/:eventId/reports/financial" element={<FinancialReportPage />} />
                  <Route path="events/:eventId/reports/subcommittees" element={<SubcommitteeReportsPage />} />
                  
                  {/* User Account Routes */}
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  
                  {/* Admin Routes */}
                  <Route
                    path="admin/users"
                    element={
                      <ProtectedRoute requiredRoles={['executive_admin']}>
                        <ManageUsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/committees"
                    element={
                      <ProtectedRoute requiredRoles={['executive_admin']}>
                        <ManageCommitteesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="admin/events/:eventId/settings"
                    element={
                      <ProtectedRoute requiredRoles={['chair', 'secretary', 'executive_admin']}>
                        <EventSettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Legacy/Other Routes */}
                  <Route path="committees" element={<CommitteesPage />} />
                  <Route path="tasks" element={<TasksPage />} />
                  <Route
                    path="finance"
                    element={
                      <ProtectedRoute requiredRoles={['chair', 'treasurer', 'finance_member', 'executive_admin']}>
                        <FinancePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="providers" element={<ProvidersPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                </Route>
              </Routes>
              <PWAUpdatePrompt />
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

