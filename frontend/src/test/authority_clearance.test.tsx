import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, DEMO_ACCOUNTS } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { DocumentsListPage } from '@/pages/documents/DocumentsListPage';
import { DocumentDetailPage } from '@/pages/documents/DocumentDetailPage';
import { documentsService } from '@/services/documents.service';
import { setTokens } from '@/services/api';
import { documentBundles } from '@/mocks/data';

describe('Granular Role Authority Level & Document Classification Clearances', () => {
  const restrictedDocId = documentBundles[1].document.id; // DOC-WIT-002: RESTRICTED

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('rejects VIEWER from downloading or accessing RESTRICTED documents via service and mock API', async () => {
    setTokens({
      access_token: 'mock-access-viewer@demo.local',
      refresh_token: 'mock-refresh-viewer@demo.local',
    });

    // Attempting to fetch RESTRICTED doc as VIEWER should fail with 403 Forbidden
    await expect(documentsService.getDocument(restrictedDocId)).rejects.toMatchObject({
      response: { status: 403 },
    });

    // Attempting to download as VIEWER should fail with 403 Forbidden
    await expect(documentsService.downloadDocument(restrictedDocId)).rejects.toMatchObject({
      response: { status: 403 },
    });
  });

  it('allows INVESTIGATING_OFFICER (Level 80) to inspect and download RESTRICTED documents', async () => {
    setTokens({
      access_token: 'mock-access-officer@demo.local',
      refresh_token: 'mock-refresh-officer@demo.local',
    });

    const doc = await documentsService.getDocument(restrictedDocId);
    expect(doc).toBeDefined();
    expect(doc.id).toBe(restrictedDocId);
    expect(doc.classification).toBe('RESTRICTED');

    const downloadRes = await documentsService.downloadDocument(restrictedDocId);
    expect(downloadRes.data).toBeDefined();
  });

  it('renders DocumentsListPage with locked indicators for unauthorized records when logged in as VIEWER', async () => {
    setTokens({
      access_token: 'mock-access-viewer@demo.local',
      refresh_token: 'mock-refresh-viewer@demo.local',
    });

    render(
      <MemoryRouter initialEntries={['/documents']}>
        <ThemeProvider>
          <AuthProvider>
            <DocumentsListPage />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Document Vault/i)).toBeInTheDocument();

    await waitFor(() => {
      const restrictedPills = screen.getAllByText(/Restricted/i);
      expect(restrictedPills.length).toBeGreaterThan(0);
    });
  });

  it('displays Clearance Restriction Enforced banner if VIEWER visits restricted document detail page', async () => {
    setTokens({
      access_token: 'mock-access-viewer@demo.local',
      refresh_token: 'mock-refresh-viewer@demo.local',
    });

    render(
      <MemoryRouter initialEntries={[`/documents/${restrictedDocId}`]}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
              <Route path="/unauthorized" element={<div>Access Denied Page</div>} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const denied =
        screen.queryByText(/Access Denied Page/i) ||
        screen.queryByText(/Clearance Restriction Enforced/i);
      expect(denied).toBeInTheDocument();
    });
  });
});
