import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import RatingPage from './pages/RatingPage';
import RolePermissionPage from './pages/RolePermissionPage';
import RoadSummaryPage from './pages/RoadSummaryPage';
import RatingDetailPage from './pages/RatingDetailPage';
import DashboardPage from './pages/DashboardPage';
import ClonePage from './pages/ClonePage';
import NotificationPage from './pages/NotificationPage';
import UserManagementPage from './pages/UserManagementPage';
import MasterListPage from './pages/MasterListPage';
import InspectionEnginePage from './pages/InspectionEnginePage';
import RoadwaySamplingPage from './pages/RoadwaySampling/RoadwaySamplingPage';
import StructureSamplingPage from './pages/StructureSampling/StructureSamplingPage';
import ProjectFacilitiesPage from './pages/ProjectFacilities/ProjectFacilitiesPage';
import AtmsPage from './pages/Atms/AtmsPage';
import SurveyLibraryPage from './pages/SurveyLibraryPage';
import SurveyProcessingPage from './pages/SurveyProcessingPage';
import ImageReviewPage from './pages/ImageReviewPage';
import InspectorApp from './pages/InspectorApp';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
import ShipDashboard from './pages/Ship/ShipDashboard';
import SkipGalleryPage from './pages/SkipGalleryPage';
import RatingV2Page from './pages/RatingV2/RatingV2Page';

import UserInsightsPage from './pages/UserInsightsPage';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute moduleName="Dashboard"><DashboardPage /></ProtectedRoute>} />
      <Route path="/demo" element={<ProtectedRoute moduleName="Clone Page" allowedRoles={['Admin', 'Administrator']}><ClonePage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute moduleName="Notifications"><NotificationPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute moduleName="Users"><UserManagementPage /></ProtectedRoute>} />
      <Route path="/user-insights" element={<ProtectedRoute moduleName="User Insights"><UserInsightsPage /></ProtectedRoute>} />
      <Route path="/master-list" element={<ProtectedRoute moduleName="Master List"><MasterListPage /></ProtectedRoute>} />
      <Route path="/inspection-engine" element={<ProtectedRoute moduleName="Inspection Engine"><InspectionEnginePage /></ProtectedRoute>} />
      <Route path="/roadway-sampling" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator']}><RoadwaySamplingPage /></ProtectedRoute>} />
      <Route path="/structure-sampling" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator']}><StructureSamplingPage /></ProtectedRoute>} />
      <Route path="/project-facilities" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator']}><ProjectFacilitiesPage /></ProtectedRoute>} />
      <Route path="/atms" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator']}><AtmsPage /></ProtectedRoute>} />
      <Route path="/survey-library" element={<ProtectedRoute moduleName="Survey Library"><SurveyLibraryPage /></ProtectedRoute>} />
      <Route path="/survey-processing" element={<ProtectedRoute moduleName="Survey Processing"><SurveyProcessingPage /></ProtectedRoute>} />
      <Route path="/skip-gallery" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator', 'HO', 'SPV', 'User']}><SkipGalleryPage /></ProtectedRoute>} />
      <Route path="/image-review" element={<ProtectedRoute moduleName="Image Review"><ImageReviewPage /></ProtectedRoute>} />
      <Route path="/rating" element={<ProtectedRoute moduleName="Rating"><RatingPage /></ProtectedRoute>} />
      <Route path="/rating/inspector/:batchId" element={<ProtectedRoute moduleName="Rating"><InspectorApp /></ProtectedRoute>} />
      <Route path="/rating-v2" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator', 'HO', 'SPV', 'User']}><RatingPage /></ProtectedRoute>} />
      <Route path="/rating-v2/:roadId" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator', 'HO', 'SPV', 'User']}><RoadSummaryPage /></ProtectedRoute>} />
      <Route path="/rating-v2/inspector/:batchId" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator', 'HO', 'SPV', 'User']}><RatingV2Page /></ProtectedRoute>} />
      <Route path="/role" element={<ProtectedRoute moduleName="Role Management"><RolePermissionPage /></ProtectedRoute>} />
      <Route path="/rating/:roadId" element={<ProtectedRoute moduleName="Rating"><RoadSummaryPage /></ProtectedRoute>} />
      <Route path="/rating/:roadId/detail/:detailId" element={<ProtectedRoute moduleName="Rating"><RatingDetailPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute allowedRoles={['Admin', 'Administrator', 'HO', 'SPV', 'User']}><ProfilePage /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute moduleName="Reports"><ReportsPage /></ProtectedRoute>} />
      <Route path="/ship" element={<ProtectedRoute moduleName="SHIP"><ShipDashboard /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
