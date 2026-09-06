import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppRoutes } from '@/routes';
import { installApiMocks } from '@/mocks/install';
import { setTokens } from '@/services/api';

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

const renderWithContext = (route: string) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Comprehensive System-Wide Route Verification Test', () => {
  beforeEach(() => {
    installApiMocks();
    sessionStorage.clear();
    setTokens({
      access_token: 'mock-access-admin@demo.local',
      refresh_token: 'mock-refresh-admin@demo.local',
    });
  });

  it('renders Public Routes cleanly without errors', async () => {
    // 1. /login
    const { unmount: u1 } = renderWithContext('/login');
    expect(screen.getByText(/SECURE LEGAL DMS/i)).toBeInTheDocument();
    u1();

    // 2. /forgot-password
    const { unmount: u2 } = renderWithContext('/forgot-password');
    expect(screen.getByText(/Reset Credentials/i)).toBeInTheDocument();
    u2();

    // 3. /reset-password
    const { unmount: u3 } = renderWithContext('/reset-password');
    expect(screen.getByText(/Set New Password/i)).toBeInTheDocument();
    u3();

    // 4. /unauthorized
    const { unmount: u4 } = renderWithContext('/unauthorized');
    expect(screen.getByText(/Restricted Authorization/i)).toBeInTheDocument();
    u4();

    // 5. /verify
    const { unmount: u5 } = renderWithContext('/verify');
    expect(screen.getByText(/Public Judicial Verification Portal/i)).toBeInTheDocument();
    u5();
  });

  it('renders Core Operations routes (Dashboard, Cases, Case Detail, Case Create)', async () => {
    // 1. Dashboard
    const { unmount: u1 } = renderWithContext('/dashboard');
    await waitFor(() => {
      expect(screen.getByText(/Operations Center/i)).toBeInTheDocument();
    });
    u1();

    // 2. Cases List
    const { unmount: u2 } = renderWithContext('/cases');
    await waitFor(() => {
      expect(screen.getByText(/Cases & Investigation Files/i)).toBeInTheDocument();
    });
    u2();

    // 3. Case Create
    const { unmount: u3 } = renderWithContext('/cases/new');
    await waitFor(() => {
      expect(screen.getByText(/Open New Case or Legal Matter/i)).toBeInTheDocument();
    });
    u3();

    // 4. Case Detail
    const { unmount: u4 } = renderWithContext('/cases/33333333-cccc-4ccc-8ccc-000000000001');
    await waitFor(() => {
      expect(screen.getAllByText(/NCRB-WS-2026-0189/i)[0]).toBeInTheDocument();
    });
    u4();
  });

  it('renders Document & Evidence routes (Documents, Detail, Viewer, Evidence, Intake, Detail)', async () => {
    // 1. Documents List
    const { unmount: u1 } = renderWithContext('/documents');
    await waitFor(() => {
      expect(screen.getAllByText(/Document Vault/i)[0]).toBeInTheDocument();
    });
    u1();

    // 2. Document Detail
    const { unmount: u2 } = renderWithContext('/documents/55555555-eeee-4eee-8eee-000000000001');
    await waitFor(() => {
      expect(screen.getByText(/Metadata & Preview/i)).toBeInTheDocument();
    });
    u2();

    // 3. Document Viewer
    const { unmount: u3 } = renderWithContext('/documents/55555555-eeee-4eee-8eee-000000000001/view');
    await waitFor(() => {
      expect(screen.getByText(/Document record/i)).toBeInTheDocument();
    });
    u3();

    // 4. Evidence List
    const { unmount: u4 } = renderWithContext('/evidence');
    await waitFor(() => {
      expect(screen.getByText(/Chain of Custody & Evidence Register/i)).toBeInTheDocument();
    });
    u4();

    // 5. Evidence Upload / Intake
    const { unmount: u5 } = renderWithContext('/evidence/upload');
    await waitFor(() => {
      expect(screen.getByText(/Evidence Intake & Forensic Vault/i)).toBeInTheDocument();
    });
    u5();

    // 6. Evidence Detail
    const { unmount: u6 } = renderWithContext('/evidence/99999999-cccc-4ccc-8ccc-000000000001');
    await waitFor(() => {
      expect(screen.getByText(/Chain of Custody Record/i)).toBeInTheDocument();
    });
    u6();
  });

  it('renders Blockchain Explorer, Global Search, and Governance/Admin routes', async () => {
    // 1. Blockchain Explorer
    const { unmount: u1 } = renderWithContext('/blockchain');
    await waitFor(() => {
      expect(screen.getByText(/MHA Legal Evidence Blockchain Explorer/i)).toBeInTheDocument();
    });
    u1();

    // 2. Global Search
    const { unmount: u2 } = renderWithContext('/search');
    await waitFor(() => {
      expect(screen.getByText(/Universal Investigation Search/i)).toBeInTheDocument();
    });
    u2();

    // 3. Audit Logs
    const { unmount: u3 } = renderWithContext('/audit-logs');
    await waitFor(() => {
      expect(screen.getByText(/Immutable Audit Ledger/i)).toBeInTheDocument();
    });
    u3();

    // 4. Admin Security Console
    const { unmount: u4 } = renderWithContext('/admin/security');
    await waitFor(() => {
      expect(screen.getByText(/Admin console/i)).toBeInTheDocument();
    });
    u4();

    // 5. Users Page
    const { unmount: u5 } = renderWithContext('/users');
    await waitFor(() => {
      expect(screen.getByText(/Departmental Staff & User Directory/i)).toBeInTheDocument();
    });
    u5();

    // 6. Departments Page
    const { unmount: u6 } = renderWithContext('/departments');
    await waitFor(() => {
      expect(screen.getByText(/Investigation & Legal Departments/i)).toBeInTheDocument();
    });
    u6();

    // 7. Profile Page
    const { unmount: u7 } = renderWithContext('/profile');
    await waitFor(() => {
      expect(screen.getByText(/Operational Profile/i)).toBeInTheDocument();
    });
    u7();

    // 8. Security Settings Page
    const { unmount: u8 } = renderWithContext('/settings/security');
    await waitFor(() => {
      expect(screen.getByText(/Security & Authentication Controls/i)).toBeInTheDocument();
    });
    u8();

    // 9. System Settings Page
    const { unmount: u9 } = renderWithContext('/settings');
    await waitFor(() => {
      expect(screen.getByText(/System Preferences & Settings/i)).toBeInTheDocument();
    });
    u9();
  });
});
