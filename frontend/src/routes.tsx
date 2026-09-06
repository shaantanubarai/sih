import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { RoleGuard } from '@/components/common/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';

// Public pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { UnauthorizedPage } from '@/pages/auth/UnauthorizedPage';
import { PublicVerificationPage } from '@/pages/verify/PublicVerificationPage';

// Protected pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CasesListPage } from '@/pages/cases/CasesListPage';
import { CaseDetailPage } from '@/pages/cases/CaseDetailPage';
import { CaseCreatePage } from '@/pages/cases/CaseCreatePage';
import { CaseEditPage } from '@/pages/cases/CaseEditPage';

import { DocumentsListPage } from '@/pages/documents/DocumentsListPage';
import { DocumentDetailPage } from '@/pages/documents/DocumentDetailPage';

import { EvidenceListPage } from '@/pages/evidence/EvidenceListPage';
import { EvidenceDetailPage } from '@/pages/evidence/EvidenceDetailPage';

import { AuditLogsPage } from '@/pages/audit/AuditLogsPage';
import { GlobalSearchPage } from '@/pages/search/GlobalSearchPage';

import { UsersPage } from '@/pages/admin/UsersPage';
import { DepartmentsPage } from '@/pages/admin/DepartmentsPage';
import { AdminConsolePage } from '@/pages/admin/AdminConsolePage';

import { ProfilePage } from '@/pages/settings/ProfilePage';
import { SecuritySettingsPage } from '@/pages/settings/SecuritySettingsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { EvidenceUploadPage } from '@/pages/evidence/EvidenceUploadPage';
import { DocumentViewerPage } from '@/pages/documents/DocumentViewerPage';
import { BlockchainExplorerPage } from '@/pages/blockchain/BlockchainExplorerPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/verify" element={<PublicVerificationPage />} />

      {/* Protected App Routes wrapped inside AppShell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Cases */}
        <Route path="cases" element={<CasesListPage />} />
        <Route path="cases/new" element={<CaseCreatePage />} />
        <Route path="cases/:caseId" element={<CaseDetailPage />} />
        <Route path="cases/:caseId/edit" element={<CaseEditPage />} />
        <Route path="cases/:caseId/documents" element={<CaseDetailPage />} />

        {/* Documents */}
        <Route path="documents" element={<DocumentsListPage />} />
        <Route path="documents/:documentId" element={<DocumentDetailPage />} />
        <Route path="documents/:documentId/view" element={<DocumentViewerPage />} />
        <Route path="documents/:documentId/versions" element={<DocumentDetailPage />} />
        <Route path="documents/:documentId/permissions" element={<DocumentDetailPage />} />
        <Route path="documents/:documentId/comments" element={<DocumentDetailPage />} />
        <Route path="documents/:documentId/signatures" element={<DocumentDetailPage />} />

        {/* Evidence */}
        <Route path="evidence" element={<EvidenceListPage />} />
        <Route path="evidence/upload" element={<EvidenceUploadPage />} />
        <Route path="evidence/:evidenceId" element={<EvidenceDetailPage />} />

        {/* Blockchain & Merkle Notarization */}
        <Route path="blockchain" element={<BlockchainExplorerPage />} />

        {/* Search */}
        <Route path="search" element={<GlobalSearchPage />} />

        {/* Audit Trail - Guarded for Admin and Auditor */}
        <Route
          path="audit-logs"
          element={
            <RoleGuard allowedRoles={['SYSTEM_ADMIN', 'AUDITOR']}>
              <AuditLogsPage />
            </RoleGuard>
          }
        />

        {/* Administration - Guarded for Admin */}
        <Route
          path="admin/security"
          element={
            <RoleGuard allowedRoles={['SYSTEM_ADMIN']}>
              <AdminConsolePage />
            </RoleGuard>
          }
        />
        <Route
          path="users"
          element={
            <RoleGuard allowedRoles={['SYSTEM_ADMIN']}>
              <UsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="departments"
          element={
            <RoleGuard allowedRoles={['SYSTEM_ADMIN']}>
              <DepartmentsPage />
            </RoleGuard>
          }
        />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings/security" element={<SecuritySettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
