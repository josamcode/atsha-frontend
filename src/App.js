import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Common/Loading';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const RequestPasswordReset = lazy(() => import('./pages/RequestPasswordReset'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const FormsList = lazy(() => import('./pages/Forms/FormsList'));
const SelectTemplate = lazy(() => import('./pages/Forms/SelectTemplate'));
const FillForm = lazy(() => import('./pages/Forms/FillForm'));
const ViewForm = lazy(() => import('./pages/Forms/ViewForm'));
const PrintForm = lazy(() => import('./pages/Forms/PrintForm'));
const TemplatesList = lazy(() => import('./pages/Forms/TemplatesList'));
const CreateTemplate = lazy(() => import('./pages/Forms/CreateTemplate'));
const TemplateBuilder = lazy(() => import('./pages/Forms/TemplateBuilder'));
const AttendancePage = lazy(() => import('./pages/Attendance/AttendancePage'));
const QRAttendance = lazy(() => import('./pages/Admin/QRAttendance'));
const AttendAction = lazy(() => import('./pages/Public/AttendAction'));
const LeavesList = lazy(() => import('./pages/Leaves/LeavesList'));
const NewLeave = lazy(() => import('./pages/Leaves/NewLeave'));
const ViewLeaveRequest = lazy(() => import('./pages/Leaves/ViewLeaveRequest'));
const UsersList = lazy(() => import('./pages/Users/UsersList'));
const UserAnalytics = lazy(() => import('./pages/Users/UserAnalytics'));
const EmployeeReportPDF = lazy(() => import('./pages/Users/Employeereportpdf'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Messages = lazy(() => import('./pages/Messages/Messages'));

// Redirect component for default routes
const DefaultRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Will be handled by ProtectedRoute
  }

  if (user?.role === 'qr-manager') {
    return <Navigate to="/qr" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Inner component to handle language restoration with auth context
function AppContent() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    // Set initial direction based on language
    // Priority: localStorage (current session) > user preference > default Arabic
    // This prevents switching from Arabic to English when user loads
    const storedLang = localStorage.getItem('language');
    const userLang = user?.languagePreference;

    // Only use user preference if localStorage is empty (first time)
    // Otherwise, keep the current language to maintain consistency
    const lang = storedLang || userLang || 'ar';

    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    i18n.changeLanguage(lang);
    if (!storedLang) {
      localStorage.setItem('language', lang);
    }
  }, [i18n, user]);

  return (
    <SidebarProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={i18n.language === 'ar'}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/request-password-reset" element={<RequestPasswordReset />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/forms"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <FormsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms/new"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <SelectTemplate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms/fill/:templateId"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <FillForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms/view/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <ViewForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forms/print/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <PrintForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <TemplatesList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates/create"
              element={
                <ProtectedRoute roles={['admin']} department="management">
                  <TemplateBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates/edit/:id"
              element={
                <ProtectedRoute roles={['admin']} department="management">
                  <TemplateBuilder />
                </ProtectedRoute>
              }
            />

            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />

            {/* QR Attendance - Admin and QR Manager */}
            <Route
              path="/qr"
              element={
                <ProtectedRoute allowedRoles={['admin', 'qr-manager']}>
                  <QRAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/qr-attendance"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <QRAttendance />
                </ProtectedRoute>
              }
            />

            {/* Public QR Action Route */}
            <Route
              path="/attend/:token"
              element={
                <ProtectedRoute>
                  <AttendAction />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leaves"
              element={
                <ProtectedRoute>
                  <LeavesList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leaves/new"
              element={
                <ProtectedRoute>
                  <NewLeave />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leaves/:id"
              element={
                <ProtectedRoute>
                  <ViewLeaveRequest />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                  <UsersList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users/:id/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UserAnalytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users/:id/report"
              element={
                <ProtectedRoute>
                  <EmployeeReportPDF />
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Notifications />
                </ProtectedRoute>
              }
            />

            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              }
            />

            {/* Default Route - Redirect based on role */}
            <Route path="/" element={<DefaultRedirect />} />
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
        </Suspense>
      </Router>
    </SidebarProvider>
  );
}

function App() {
  const { i18n } = useTranslation();

  // Initial language setup (before auth context is available)
  useEffect(() => {
    const lang = localStorage.getItem('language') || 'ar';
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    i18n.changeLanguage(lang);
  }, [i18n]);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
