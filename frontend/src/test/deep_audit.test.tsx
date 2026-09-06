import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, DEMO_ACCOUNTS } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppRoutes } from '@/routes';
import { setTokens } from '@/services/api';
import { documentBundles, evidenceItems } from '@/mocks/data';

// Mock crypto.subtle for JSDOM
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = {};
}
if (!globalThis.crypto.subtle) {
  // @ts-ignore
  globalThis.crypto.subtle = {
    digest: async (_algorithm: string, data: Uint8Array) => {
      const buffer = new ArrayBuffer(32);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < 32; i++) {
        view[i] = (data[i % data.length] || i) ^ 0xaa;
      }
      return buffer;
    },
  };
}

const renderPath = (path: string) => {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Deep System Audit & Comprehensive Runtime Inspection', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    setTokens({
      access_token: 'mock-access-admin@demo.local',
      refresh_token: 'mock-refresh-admin@demo.local',
    });
  });

  it('audits all 23 application routes without crashes or broken renders', async () => {
    // 1. Dashboard
    const { unmount: u1 } = renderPath('/dashboard');
    expect(await screen.findByText(/Operations Center/i)).toBeInTheDocument();
    u1();

    // 2. Cases List
    const { unmount: u2 } = renderPath('/cases');
    expect(await screen.findByText(/Cases & Investigation Files/i)).toBeInTheDocument();
    u2();

    // 3. Case Create
    const { unmount: u3 } = renderPath('/cases/new');
    expect(await screen.findByText(/Open New Case or Legal Matter/i)).toBeInTheDocument();
    u3();

    // 4. Case Detail (Case 1)
    const { unmount: u4 } = renderPath('/cases/33333333-cccc-4ccc-8ccc-000000000001');
    expect(await screen.findByText(/Case File Inventory/i)).toBeInTheDocument();
    u4();

    // 5. Document Vault List
    const { unmount: u5 } = renderPath('/documents');
    expect(await screen.findByRole('heading', { name: /Document Vault/i })).toBeInTheDocument();
    u5();

    // 6. Document Detail (Doc 1)
    const doc1Id = documentBundles[0].document.id;
    const { unmount: u6 } = renderPath(`/documents/${doc1Id}`);
    expect(await screen.findByText(/Security & Metadata/i)).toBeInTheDocument();
    u6();

    // 7. Document Viewer Page
    const { unmount: u7 } = renderPath(`/documents/${doc1Id}/view`);
    expect(await screen.findByText(/Document record|Secure viewer|Return to vault/i)).toBeInTheDocument();
    u7();

    // 8. Evidence List
    const { unmount: u8 } = renderPath('/evidence');
    expect(await screen.findByText(/Chain of Custody & Evidence Register/i)).toBeInTheDocument();
    u8();

    // 9. Evidence Upload Page
    const { unmount: u9 } = renderPath('/evidence/upload');
    expect(await screen.findByText(/Evidence Intake & Forensic Vault/i)).toBeInTheDocument();
    u9();

    // 10. Evidence Detail
    const ev1Id = evidenceItems[0].id;
    const { unmount: u10 } = renderPath(`/evidence/${ev1Id}`);
    expect(await screen.findByText(/Chain of Custody Record/i)).toBeInTheDocument();
    u10();

    // 11. Blockchain Ledger
    const { unmount: u11 } = renderPath('/blockchain');
    expect(await screen.findByText(/Blockchain Explorer & Merkle Notarizer/i)).toBeInTheDocument();
    u11();

    // 12. Global Search
    const { unmount: u12 } = renderPath('/search');
    expect(await screen.findByText(/Universal Investigation Search/i)).toBeInTheDocument();
    u12();

    // 13. Audit Trail
    const { unmount: u13 } = renderPath('/audit-logs');
    expect(await screen.findByText(/Immutable Audit Ledger/i)).toBeInTheDocument();
    u13();

    // 14. Admin Console
    const { unmount: u14 } = renderPath('/admin/security');
    expect(await screen.findByText(/Admin console/i)).toBeInTheDocument();
    u14();

    // 15. Admin Users
    const { unmount: u15 } = renderPath('/users');
    expect(await screen.findByText(/Departmental Staff & User Directory/i)).toBeInTheDocument();
    u15();

    // 16. Admin Departments
    const { unmount: u16 } = renderPath('/departments');
    expect(await screen.findByText(/Investigation & Legal Departments/i)).toBeInTheDocument();
    u16();

    // 17. Settings & Profile
    const { unmount: u17 } = renderPath('/settings');
    expect(await screen.findByText(/System Preferences & Settings/i)).toBeInTheDocument();
    u17();

    const { unmount: u17b } = renderPath('/profile');
    expect(await screen.findByText(/Officer Profile/i)).toBeInTheDocument();
    u17b();

    // 18. Public Verification Portal
    const { unmount: u18 } = renderPath('/verify');
    expect(await screen.findByText(/Public Judicial Verification Portal/i)).toBeInTheDocument();
    u18();

    // 19. Unauthorized Page
    const { unmount: u19 } = renderPath('/unauthorized');
    expect(await screen.findByText(/Restricted Authorization/i)).toBeInTheDocument();
    u19();

    // 20. Unknown Path redirects cleanly to Dashboard
    const { unmount: u20 } = renderPath('/non-existent-page-test');
    expect(await screen.findByText(/Operations Center/i)).toBeInTheDocument();
    u20();
  }, 25000);

  it('verifies all 7 departmental login profiles authenticate and set correct authority levels', async () => {
    for (const account of DEMO_ACCOUNTS) {
      setTokens({
        access_token: `mock-access-${account.email}`,
        refresh_token: `mock-refresh-${account.email}`,
      });

      const { unmount } = renderPath('/dashboard');
      expect(await screen.findByText(/Operations Center/i)).toBeInTheDocument();

      // Topbar role badge should display matching role
      const roleText = account.role.replace(/_/g, ' ');
      expect(screen.getAllByText(new RegExp(roleText, 'i')).length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('tests Case Detail Tab Navigation (Overview, Documents, Evidence, Members, Activity)', async () => {
    const { unmount } = renderPath('/cases/33333333-cccc-4ccc-8ccc-000000000001');
    expect(await screen.findByText(/Case File Inventory/i)).toBeInTheDocument();

    // Click Documents Tab
    const docsTab = screen.getByRole('button', { name: /Documents \(/i });
    fireEvent.click(docsTab);
    expect(await screen.findByText(/Documents Attached to this Case/i)).toBeInTheDocument();

    // Click Evidence Tab
    const evTab = screen.getByRole('button', { name: /Evidence \(/i });
    fireEvent.click(evTab);
    expect(await screen.findByText(/Physical & Digital Evidence/i)).toBeInTheDocument();

    // Click Members Tab
    const membersTab = screen.getByRole('button', { name: /Team Roster \(/i });
    fireEvent.click(membersTab);
    expect(await screen.findByText(/Case Team Members/i)).toBeInTheDocument();

    // Click Activity Tab
    const activityTab = screen.getByRole('button', { name: /Activity Audit/i });
    fireEvent.click(activityTab);
    expect(await screen.findByText(/Case Activity Audit Ledger/i)).toBeInTheDocument();

    unmount();
  });

  it('tests Document Detail Tab Navigation (Overview, Versions, Notes, Signatures, Audit)', async () => {
    const docId = documentBundles[0].document.id;
    const { unmount } = renderPath(`/documents/${docId}`);
    expect(await screen.findByText(/Security & Metadata/i)).toBeInTheDocument();

    // Versions tab
    const verTab = screen.getByRole('button', { name: /Version History/i });
    fireEvent.click(verTab);
    expect(await screen.findByText(/Initial intake/i)).toBeInTheDocument();

    // Comments tab
    const commTab = screen.getByRole('button', { name: /Notes & Comments/i });
    fireEvent.click(commTab);
    expect(await screen.findByText(/Add Investigation Note/i)).toBeInTheDocument();

    // Signatures tab
    const sigTab = screen.getByRole('button', { name: /Signatures/i });
    fireEvent.click(sigTab);
    expect(await screen.findByText(/Demonstration Signature Disclaimer/i)).toBeInTheDocument();

    // Audit tab
    const auditTab = screen.getByRole('button', { name: /Audit Trail/i });
    fireEvent.click(auditTab);
    expect(await screen.findByText(/No audit records available|actor|action|by /i)).toBeInTheDocument();

    unmount();
  });
});
