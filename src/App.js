import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { SidebarProvider } from './context/SidebarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Common/Loading';
import { getDefaultAuthenticatedPath } from './utils/organization';

const Login = lazy(() => import('./pages/Login'));
const RegisterOrganization = lazy(() => import('./pages/RegisterOrganization'));
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));
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
const OrganizationSettings = lazy(() => import('./pages/OrganizationSettings'));
const OrganizationPaymentResult = lazy(() => import('./pages/OrganizationPaymentResult'));
const PlatformPlanEditor = lazy(() => import('./pages/PlatformPlanEditor'));
const PlatformOrganizationDetails = lazy(() => import('./pages/PlatformOrganizationDetails'));
const PlatformOrganizationEditor = lazy(() => import('./pages/PlatformOrganizationEditor'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

const DefaultRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return <Navigate to={getDefaultAuthenticatedPath(user)} replace />;
};

const SmartHome = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (user) {
    return <Navigate to={getDefaultAuthenticatedPath(user)} replace />;
  }

  return <LandingPage />;
};

function AppContent() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    const storedLanguage = localStorage.getItem('language');
    const userLanguage = user?.languagePreference;
    const language = storedLanguage || userLanguage || 'ar';

    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    i18n.changeLanguage(language);

    if (!storedLanguage) {
      localStorage.setItem('language', language);
    }
  }, [i18n, user]);

  return (
    <SidebarProvider>
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterOrganization />} />
          <Route path="/accept-invitation" element={<AcceptInvitation />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/request-password-reset" element={<RequestPasswordReset />} />

          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/forms"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin', 'organization_admin', 'supervisor']}>
                <FormsList />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/forms/new"
            element={(
              <ProtectedRoute allowedRoles={['organization_admin', 'supervisor']}>
                <SelectTemplate />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/forms/fill/:templateId"
            element={(
              <ProtectedRoute allowedRoles={['organization_admin', 'supervisor']}>
                <FillForm />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/forms/view/:id"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin', 'organization_admin', 'supervisor']}>
                <ViewForm />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/forms/print/:id"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin', 'organization_admin', 'supervisor']}>
                <PrintForm />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/templates"
            element={(
              <ProtectedRoute>
                <TemplatesList />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/templates/create"
            element={(
              <ProtectedRoute allowedRoles={['organization_admin']}>
                <TemplateBuilder />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/templates/edit/:id"
            element={(
              <ProtectedRoute allowedRoles={['organization_admin']}>
                <TemplateBuilder />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/attendance"
            element={(
              <ProtectedRoute
                allowedRoles={['organization_admin', 'supervisor', 'employee', 'qr_manager']}
                requiredFeatures={['attendanceManagement']}
              >
                <AttendancePage />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/qr"
            element={(
              <ProtectedRoute
                allowedRoles={['organization_admin', 'qr_manager']}
                requiredFeatures={['attendanceManagement', 'qrCode']}
              >
                <QRAttendance />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/qr-attendance"
            element={(
              <ProtectedRoute
                allowedRoles={['organization_admin']}
                requiredFeatures={['attendanceManagement', 'qrCode']}
              >
                <QRAttendance />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/attend/:token"
            element={(
              <ProtectedRoute requiredFeatures={['attendanceManagement', 'qrCode']}>
                <AttendAction />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/leaves"
            element={(
              <ProtectedRoute requiredFeatures={['leaveManagement']}>
                <LeavesList />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/leaves/new"
            element={(
              <ProtectedRoute requiredFeatures={['leaveManagement']}>
                <NewLeave />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/leaves/:id"
            element={(
              <ProtectedRoute requiredFeatures={['leaveManagement']}>
                <ViewLeaveRequest />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/users"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin', 'organization_admin', 'supervisor']}>
                <UsersList />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/users/:id/analytics"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin', 'organization_admin']}>
                <UserAnalytics />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/users/:id/report"
            element={(
              <ProtectedRoute>
                <EmployeeReportPDF />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/organization"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin', 'organization_admin']}>
                <OrganizationSettings />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/organization/payment-result"
            element={(
              <ProtectedRoute allowedRoles={['organization_admin', 'platform_admin']}>
                <OrganizationPaymentResult />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/platform/plans/new"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <PlatformPlanEditor />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/platform/plans/:planCode/edit"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <PlatformPlanEditor />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/platform/organizations/:organizationId"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <PlatformOrganizationDetails />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/platform/organizations/:organizationId/edit"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin']}>
                <PlatformOrganizationEditor />
              </ProtectedRoute>
            )}
          />

          <Route
            path="/notifications"
            element={(
              <ProtectedRoute allowedRoles={['platform_admin', 'organization_admin']}>
                <Notifications />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/messages"
            element={(
              <ProtectedRoute requiredFeatures={['messaging']}>
                <Messages />
              </ProtectedRoute>
            )}
          />

          <Route path="/" element={<SmartHome />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="*" element={<DefaultRedirect />} />
        </Routes>
      </Suspense>
    </SidebarProvider>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const language = localStorage.getItem('language') || 'ar';
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    i18n.changeLanguage(language);
  }, [i18n]);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <OrganizationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </OrganizationProvider>
    </Router>
  );
}

export default App;
