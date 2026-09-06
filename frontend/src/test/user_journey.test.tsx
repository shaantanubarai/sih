import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppRoutes } from '@/routes';
import { installApiMocks } from '@/mocks/install';
import { setTokens } from '@/services/api';

// Setup mock crypto if in JSDOM
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

describe('End-to-End Enterprise Full Application Flow', () => {
  beforeEach(() => {
    installApiMocks();
    sessionStorage.clear();
  });

  it('verifies Public Judicial Verification Portal (/verify) operates without authentication', async () => {
    render(
      <MemoryRouter initialEntries={['/verify?hash=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08']}>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify Government of India header on unauthenticated route
    expect(screen.getByText(/Public Judicial Verification Portal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bharatiya Sakshya Adhiniyam, 2023 \(BSA\)/i)[0]).toBeInTheDocument();

    // Verify consensus on block #1042
    await waitFor(() => {
      expect(screen.getByText(/EVIDENCE BIT-EXACT & UNALTERED ON BLOCKCHAIN/i)).toBeInTheDocument();
      expect(screen.getByText(/Consensus Confirmed • Block #1042/i)).toBeInTheDocument();
    });
  });

  it('verifies Complete Investigating Officer Journey: Login, Dashboard, Case Detail, AI Co-Pilot, Spot Seizure', async () => {
    // 1. Render login page
    const { unmount } = render(
      <MemoryRouter initialEntries={['/login']}>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>
    );

    // Verify login page renders with branding and quick departmental accounts
    expect(screen.getByText(/SECURE LEGAL DMS/i)).toBeInTheDocument();
    expect(screen.getByText(/Departmental Personnel Sign-In/i)).toBeInTheDocument();

    // Quick select Investigating Officer
    const officerBtn = screen.getByText(/Investigating Officer/i);
    fireEvent.click(officerBtn);

    unmount();

    // 2. Set authenticated session in storage for subsequent routes
    setTokens({
      access_token: 'mock-access-officer@demo.local',
      refresh_token: 'mock-refresh-officer@demo.local',
    });

    // 3. Render Case Detail Page with Authenticated Session
    render(
      <MemoryRouter initialEntries={['/cases/33333333-cccc-4ccc-8ccc-000000000001']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify Case Header and Statutory BNSS Clock
    await waitFor(
      () => {
        expect(screen.getAllByText(/NCRB-WS-2026-0189/i)[0]).toBeInTheDocument();
        expect(screen.getByText(/Statutory BNSS Sec 193 Compliance/i)).toBeInTheDocument();
        expect(screen.getByText(/Legal AI Co-Pilot/i)).toBeInTheDocument();
      },
      { timeout: 4000 }
    );

    // 4. Launch Legal AI Co-Pilot
    const aiBtn = screen.getByText(/Legal AI Co-Pilot/i);
    fireEvent.click(aiBtn);

    // Verify AI Co-Pilot Modal opens
    expect(screen.getByText(/Legal AI Co-Pilot & Evidentiary Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Executive 5-Point Brief/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidentiary Health: 98% Strong/i)).toBeInTheDocument();

    // Check Contradiction Detector Tab
    const contraTab = screen.getByText(/Contradiction & Alibi Check/i);
    fireEvent.click(contraTab);
    expect(screen.getByText(/CRITICAL CONTRADICTION #1: Falsified Alibi/i)).toBeInTheDocument();

    // Check BNS Sections Tab
    const sectionsTab = screen.getByText(/BNS \/ BNSS Section Tagging/i);
    fireEvent.click(sectionsTab);
    expect(screen.getByText(/Section 72, Bharatiya Nyaya Sanhita, 2023 \(BNS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 79, Bharatiya Nyaya Sanhita, 2023 \(BNS\)/i)).toBeInTheDocument();

    // Close AI Co-Pilot
    const closeBtn = screen.getByText(/Close AI Co-Pilot/i);
    fireEvent.click(closeBtn);
  });

  it('verifies Evidence Register and Section 105 BNSS Seizure Memo Flow', async () => {
    // Authenticate session
    setTokens({
      access_token: 'mock-access-officer@demo.local',
      refresh_token: 'mock-refresh-officer@demo.local',
    });

    render(
      <MemoryRouter initialEntries={['/evidence']}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify Evidence Register Header
    await waitFor(
      () => {
        expect(screen.getByText(/Chain of Custody & Evidence Register/i)).toBeInTheDocument();
        expect(screen.getByText(/Spot Seizure Memo \(Sec 105 BNSS\)/i)).toBeInTheDocument();
      },
      { timeout: 3500 }
    );

    // Open Spot Seizure Memo Modal
    const seizureBtn = screen.getByText(/Spot Seizure Memo \(Sec 105 BNSS\)/i);
    fireEvent.click(seizureBtn);

    // Verify Section 105 BNSS Form
    expect(screen.getByText(/Crime Scene Spot Seizure Memo & Digital Panchnama/i)).toBeInTheDocument();
    expect(screen.getByText(/Mandatory Section 105 Compliance/i)).toBeInTheDocument();

    // Click Submit
    const generateBtn = screen.getByText(/Generate & Cryptographically Seal Memo/i);
    fireEvent.click(generateBtn);

    // Verify Panchnama output
    await waitFor(
      () => {
        expect(screen.getByText(/Seizure Memo Successfully Generated & Sealed on Blockchain/i)).toBeInTheDocument();
        expect(screen.getByText(/MEMORANDUM OF SEARCH AND SEIZURE \(SPOT PANCHNAMA\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Print Court Panchnama/i)).toBeInTheDocument();
      },
      { timeout: 3500 }
    );
  });
});
