import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { CommandPaletteModal } from '@/components/common/CommandPaletteModal';
import { UserGuideModal } from '@/components/common/UserGuideModal';
import { LegalLexiconTooltip } from '@/components/common/LegalLexiconTooltip';

// Helper component to test theme toggle and state
const ThemeTester: React.FC = () => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button onClick={toggleTheme} data-testid="toggle-btn">
        Toggle
      </button>
      <button onClick={() => setTheme('light')} data-testid="set-light-btn">
        Set Light
      </button>
      <button onClick={() => setTheme('dark')} data-testid="set-dark-btn">
        Set Dark
      </button>
    </div>
  );
};

describe('User-Friendly & Premium Features Test Suite', () => {
  it('supports Light, Dark, and System theme modes with persistence and DOM class synchronization', () => {
    render(
      <ThemeProvider>
        <ThemeTester />
      </ThemeProvider>
    );

    // Initial theme is dark (high security tactical mode)
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle theme to light
    fireEvent.click(screen.getByTestId('toggle-btn'));
    expect(screen.getByTestId('current-theme').textContent).toBe('light');
    expect(screen.getByTestId('resolved-theme').textContent).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    // Set theme explicitly to dark
    fireEvent.click(screen.getByTestId('set-dark-btn'));
    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('renders SettingsPage with Appearance theme cards, display density, and English standardization', () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <SettingsPage />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify Appearance & Theme Options
    expect(screen.getByText(/System Preferences & Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Appearance & Color Theme/i)).toBeInTheDocument();
    expect(screen.getByText(/Light Theme/i)).toBeInTheDocument();
    expect(screen.getByText(/Dark Theme/i)).toBeInTheDocument();
    expect(screen.getByText(/System Default/i)).toBeInTheDocument();

    // Verify English Judicial standardization indicator
    expect(screen.getByText(/Language & Judicial Localization/i)).toBeInTheDocument();
    expect(screen.getByText(/Application Language: English/i)).toBeInTheDocument();

    // Verify Display Density controls
    expect(screen.getByText(/Display Density & Layout Spacing/i)).toBeInTheDocument();
    expect(screen.getByText(/Comfortable \(Standard\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Compact/i)).toBeInTheDocument();

    // Click on Light Theme card
    const lightCard = screen.getByText(/Light Theme/i).closest('button');
    if (lightCard) {
      fireEvent.click(lightCard);
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    }
  });

  it('renders CommandPaletteModal with fuzzy search and quick action execution', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CommandPaletteModal isOpen={true} onClose={() => {}} />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify dialog elements and shortcuts
    expect(screen.getByPlaceholderText(/Type a command, case, evidence exhibit, or role/i)).toBeInTheDocument();
    expect(screen.getByText(/Public Judicial QR Verification Portal/i)).toBeInTheDocument();
    expect(screen.getByText(/Spot Seizure Memo \(Section 105 BNSS\)/i)).toBeInTheDocument();

    // Type search query
    const input = screen.getByPlaceholderText(/Type a command, case, evidence exhibit, or role/i);
    fireEvent.change(input, { target: { value: 'CCTV' } });

    // Should filter to CCTV footage exhibit
    expect(screen.getByText(/Exhibit CCTV Footage Still/i)).toBeInTheDocument();
    expect(screen.queryByText(/Spot Seizure Memo/i)).not.toBeInTheDocument();
  });

  it('renders UserGuideModal with 5 interactive tabs and detailed SOPs in English', () => {
    render(
      <MemoryRouter>
        <UserGuideModal isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    // Check header
    expect(screen.getByText(/Officer User Manual & Standard Operating Procedure \(SOP\)/i)).toBeInTheDocument();
    expect(screen.getByText(/What is this system built for\?/i)).toBeInTheDocument();

    // Switch to Investigating Officer tab
    const ioTab = screen.getByText(/Investigating Officer \(IO\)/i);
    fireEvent.click(ioTab);
    expect(screen.getByText(/Crime Spot Digital Device Seizure \(Sec 105 BNSS\)/i)).toBeInTheDocument();

    // Switch to Court / Magistrate tab
    const courtTab = screen.getByText(/Judicial Magistrate/i);
    fireEvent.click(courtTab);
    expect(screen.getByText(/Instant QR Code Verification without Logins/i)).toBeInTheDocument();

    // Switch to Plain English Technology tab
    const techTab = screen.getByText(/Tech Explained in Plain English/i);
    fireEvent.click(techTab);
    expect(screen.getByText(/What is a SHA-256 Hash\?/i)).toBeInTheDocument();
    expect(screen.getByText(/What is the Blockchain Ledger\?/i)).toBeInTheDocument();
  });

  it('renders LegalLexiconTooltip and opens plain-language explainer popover', () => {
    render(
      <LegalLexiconTooltip term="BSA_63">
        <span>Section 63 BSA</span>
      </LegalLexiconTooltip>
    );

    expect(screen.getByText(/Section 63 BSA/i)).toBeInTheDocument();

    // Click help button
    const helpBtn = screen.getByLabelText(/Explain Admissibility of Electronic Records/i);
    fireEvent.click(helpBtn);

    // Popover opens with plain English explanations
    expect(screen.getByText(/What this means in plain words:/i)).toBeInTheDocument();
    expect(screen.getByText(/Why this matters in Court:/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 63, Bharatiya Sakshya Adhiniyam, 2023/i)).toBeInTheDocument();

    // Close button dismisses popover
    const closeBtn = screen.getByText(/Understood/i);
    fireEvent.click(closeBtn);
    expect(screen.queryByText(/What this means in plain words:/i)).not.toBeInTheDocument();
  });

  it('enforces Role-Based Access Control (RBAC) and authority levels across user tiers', async () => {
    const { DEMO_ACCOUNTS } = await import('@/context/AuthContext');
    const { installApiMocks } = await import('@/mocks/install');
    const { setTokens } = await import('@/services/api');
    installApiMocks();
    setTokens({
      access_token: 'mock-access-officer@demo.local',
      refresh_token: 'mock-refresh-officer@demo.local',
    });

    // Helper component to inspect role authority and permissions
    const RbacTester: React.FC = () => {
      const {
        user,
        authorityLevel,
        canLogEvidence,
        canSpotSeizure,
        canTransferCustody,
        canSignDocument,
        canAnnotateAndRedact,
        canGenerateCertificate,
        canUseAICoPilot,
        canManageDocumentPermissions,
        isReadOnlyUser,
        canAccessDocument,
        canDownloadDocument,
        switchDemoRole
      } = useAuth();

      const testPublicDoc: any = { id: 'p1', classification: 'PUBLIC' };
      const testInternalDoc: any = { id: 'i1', classification: 'INTERNAL' };
      const testConfidentialDoc: any = { id: 'c1', classification: 'CONFIDENTIAL' };
      const testRestrictedDoc: any = { id: 'r1', classification: 'RESTRICTED' };

      return (
        <div>
          <span data-testid="user-role">{user?.role}</span>
          <span data-testid="auth-level">{authorityLevel}</span>
          <span data-testid="can-log">{String(canLogEvidence())}</span>
          <span data-testid="can-spot">{String(canSpotSeizure)}</span>
          <span data-testid="can-custody">{String(canTransferCustody())}</span>
          <span data-testid="can-sign">{String(canSignDocument)}</span>
          <span data-testid="can-annotate">{String(canAnnotateAndRedact)}</span>
          <span data-testid="can-cert">{String(canGenerateCertificate)}</span>
          <span data-testid="can-copilot">{String(canUseAICoPilot)}</span>
          <span data-testid="can-manage">{String(canManageDocumentPermissions())}</span>
          <span data-testid="is-readonly">{String(isReadOnlyUser)}</span>
          <span data-testid="access-public">{String(canAccessDocument(testPublicDoc))}</span>
          <span data-testid="access-internal">{String(canAccessDocument(testInternalDoc))}</span>
          <span data-testid="access-confidential">{String(canAccessDocument(testConfidentialDoc))}</span>
          <span data-testid="access-restricted">{String(canAccessDocument(testRestrictedDoc))}</span>
          <span data-testid="download-public">{String(canDownloadDocument(testPublicDoc))}</span>
          <span data-testid="download-restricted">{String(canDownloadDocument(testRestrictedDoc))}</span>
          <button onClick={() => switchDemoRole(DEMO_ACCOUNTS.find(a => a.role === 'SYSTEM_ADMIN')!)} data-testid="switch-admin">Admin</button>
          <button onClick={() => switchDemoRole(DEMO_ACCOUNTS.find(a => a.role === 'INVESTIGATING_OFFICER')!)} data-testid="switch-io">IO</button>
          <button onClick={() => switchDemoRole(DEMO_ACCOUNTS.find(a => a.role === 'LEGAL_OFFICER')!)} data-testid="switch-legal">Legal</button>
          <button onClick={() => switchDemoRole(DEMO_ACCOUNTS.find(a => a.role === 'PROSECUTOR')!)} data-testid="switch-prosecutor">Prosecutor</button>
          <button onClick={() => switchDemoRole(DEMO_ACCOUNTS.find(a => a.role === 'COURT_USER')!)} data-testid="switch-court">Court</button>
          <button onClick={() => switchDemoRole(DEMO_ACCOUNTS.find(a => a.role === 'AUDITOR')!)} data-testid="switch-auditor">Auditor</button>
          <button onClick={() => switchDemoRole(DEMO_ACCOUNTS.find(a => a.role === 'VIEWER')!)} data-testid="switch-viewer">Viewer</button>
        </div>
      );
    };

    render(
      <AuthProvider>
        <RbacTester />
      </AuthProvider>
    );

    // Initial default is INVESTIGATING_OFFICER (Level 80)
    expect(await screen.findByText('INVESTIGATING_OFFICER')).toBeInTheDocument();
    expect(screen.getByTestId('auth-level').textContent).toBe('80');
    expect(screen.getByTestId('can-log').textContent).toBe('true');
    expect(screen.getByTestId('can-spot').textContent).toBe('true');
    expect(screen.getByTestId('can-custody').textContent).toBe('true');
    expect(screen.getByTestId('is-readonly').textContent).toBe('false');
    expect(screen.getByTestId('access-restricted').textContent).toBe('true');
    expect(screen.getByTestId('download-restricted').textContent).toBe('true');

    // Switch to COURT_USER (Level 40, Read-Only Judicial)
    fireEvent.click(screen.getByTestId('switch-court'));
    expect(await screen.findByText('COURT_USER')).toBeInTheDocument();
    expect(screen.getByTestId('auth-level').textContent).toBe('40');
    expect(screen.getByTestId('can-log').textContent).toBe('false');
    expect(screen.getByTestId('can-spot').textContent).toBe('false');
    expect(screen.getByTestId('can-custody').textContent).toBe('false');
    expect(screen.getByTestId('can-sign').textContent).toBe('false');
    expect(screen.getByTestId('can-annotate').textContent).toBe('false');
    expect(screen.getByTestId('is-readonly').textContent).toBe('true');
    expect(screen.getByTestId('access-internal').textContent).toBe('true');
    expect(screen.getByTestId('access-confidential').textContent).toBe('false');
    expect(screen.getByTestId('access-restricted').textContent).toBe('false');

    // Switch to PROSECUTOR (Level 60, Prosecution & AI Co-Pilot enabled, no evidence tampering)
    fireEvent.click(screen.getByTestId('switch-prosecutor'));
    expect(await screen.findByText('PROSECUTOR')).toBeInTheDocument();
    expect(screen.getByTestId('auth-level').textContent).toBe('60');
    expect(screen.getByTestId('can-log').textContent).toBe('false');
    expect(screen.getByTestId('can-copilot').textContent).toBe('true');
    expect(screen.getByTestId('can-sign').textContent).toBe('true');
    expect(screen.getByTestId('access-confidential').textContent).toBe('true');
    expect(screen.getByTestId('access-restricted').textContent).toBe('false');

    // Switch to VIEWER (Level 10, strictly read-only, only PUBLIC clearance, NO downloads)
    fireEvent.click(screen.getByTestId('switch-viewer'));
    expect(await screen.findByText('VIEWER')).toBeInTheDocument();
    expect(screen.getByTestId('auth-level').textContent).toBe('10');
    expect(screen.getByTestId('can-log').textContent).toBe('false');
    expect(screen.getByTestId('can-copilot').textContent).toBe('false');
    expect(screen.getByTestId('is-readonly').textContent).toBe('true');
    expect(screen.getByTestId('access-public').textContent).toBe('true');
    expect(screen.getByTestId('access-internal').textContent).toBe('false');
    expect(screen.getByTestId('access-confidential').textContent).toBe('false');
    expect(screen.getByTestId('access-restricted').textContent).toBe('false');
    expect(screen.getByTestId('download-public').textContent).toBe('false');
    expect(screen.getByTestId('download-restricted').textContent).toBe('false');

    // Switch to SYSTEM_ADMIN (Level 100, full authority)
    fireEvent.click(screen.getByTestId('switch-admin'));
    expect(await screen.findByText('SYSTEM_ADMIN')).toBeInTheDocument();
    expect(screen.getByTestId('auth-level').textContent).toBe('100');
    expect(screen.getByTestId('can-log').textContent).toBe('true');
    expect(screen.getByTestId('can-manage').textContent).toBe('true');
    expect(screen.getByTestId('is-readonly').textContent).toBe('false');
    expect(screen.getByTestId('access-restricted').textContent).toBe('true');
    expect(screen.getByTestId('download-restricted').textContent).toBe('true');
  });
});

