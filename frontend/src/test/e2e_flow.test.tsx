import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BlockchainExplorerPage } from '@/pages/blockchain/BlockchainExplorerPage';
import { BSACertificateModal } from '@/components/legal/BSACertificateModal';
import { StatutoryTimelineTracker } from '@/components/cases/StatutoryTimelineTracker';
import { DocumentItem } from '@/types';

// Mock crypto.subtle for JSDOM
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = {};
}
if (!globalThis.crypto.subtle) {
  // @ts-ignore
  globalThis.crypto.subtle = {
    digest: async (_algorithm: string, data: Uint8Array) => {
      // Mock deterministic hash
      const buffer = new ArrayBuffer(32);
      const view = new Uint8Array(buffer);
      for (let i = 0; i < 32; i++) {
        view[i] = (data[i % data.length] || i) ^ 0xaa;
      }
      return buffer;
    },
  };
}

describe('National Digital Evidence Management System End-to-End Component Tests', () => {
  it('renders Blockchain Explorer with consortium nodes, block stream, and interactive tamper defense', async () => {
    render(
      <MemoryRouter>
        <BlockchainExplorerPage />
      </MemoryRouter>
    );

    // Verify title and consortium badges
    expect(screen.getByText(/MHA Legal Evidence Blockchain Explorer/i)).toBeInTheDocument();
    expect(screen.getByText(/Consortium Active/i)).toBeInTheDocument();
    expect(screen.getByText(/BFT Proof-of-Authority/i)).toBeInTheDocument();

    // Verify blocks exist in stream and details
    expect(screen.getAllByText(/Block #1042/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Block #1043/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/Block #1044/i)[0]).toBeInTheDocument();

    // Verify initial tamper state is Validated
    expect(screen.getAllByText(/Cryptographically Validated/i)[0]).toBeInTheDocument();

    // Test tamper simulation
    const tamperBtn = screen.getByText(/Simulate Tamper Attack/i);
    fireEvent.click(tamperBtn);

    // After tampering, it should show Tamper Alert
    await waitFor(() => {
      expect(screen.getByText(/TAMPER DETECTED: Chain Verification Failed/i)).toBeInTheDocument();
      expect(screen.getByText(/CRITICAL TAMPER DETECTED/i)).toBeInTheDocument();
    });

    // Test restoring integrity
    const restoreBtn = screen.getByText(/Restore Integrity/i);
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(screen.getAllByText(/Cryptographically Validated/i)[0]).toBeInTheDocument();
    });
  });

  it('renders Section 63 BSA Court-Admissible Certificate modal with exact statutory details', () => {
    const mockDoc: DocumentItem = {
      id: '55555555-eeee-4eee-8eee-000000000001',
      case_id: '33333333-cccc-4ccc-8ccc-000000000001',
      document_number: 'DOC-FIR-001',
      title: 'FIR No. 104/2026 - PS Connaught Place (Zero FIR under Sec 173 BNSS)',
      description: 'Test description',
      document_type: 'FIR',
      classification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      current_version_id: '66666666-ffff-4fff-8fff-000000000001',
      uploaded_by: '22222222-bbbb-4bbb-8bbb-000000000002',
      owner_department_id: '11111111-aaaa-4aaa-8aaa-000000000001',
      retention_until: '2031-09-01',
      is_evidence: true,
      created_at: '2026-09-01T10:00:00.000Z',
    };

    render(
      <BSACertificateModal
        document={mockDoc}
        isOpen={true}
        documentHash="9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
        onClose={() => {}}
      />
    );

    // Verify statutory heading
    expect(screen.getByText(/Section 63 BSA \/ 65B IEA Electronic Evidence Certificate/i)).toBeInTheDocument();
    expect(screen.getAllByText(/BHARATIYA SAKSHYA ADHINIYAM, 2023/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/FIR No. 104\/2026/i)).toBeInTheDocument();
    expect(screen.getByText(/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08/i)).toBeInTheDocument();
    expect(screen.getAllByText(/National Crime Records Bureau \(NCRB\)/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Print Official Certificate/i)).toBeInTheDocument();
  });

  it('renders Statutory BNSS Timeline Tracker with 60-day investigation clock', () => {
    const pastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days ago

    render(
      <StatutoryTimelineTracker
        caseCreatedAt={pastDate}
        caseNumber="NCRB-WS-2026-0189"
        isHeinousOrWomenSafety={true}
        crimeType="Women Safety & POCSO Fast-Track"
      />
    );

    // Check heading and compliance badge
    expect(screen.getByText(/Statutory BNSS Sec 193 Compliance/i)).toBeInTheDocument();
    expect(screen.getByText(/Investigation Lifecycle & Charge Sheet Statutory Clock/i)).toBeInTheDocument();
    expect(screen.getByText(/Women Safety & POCSO Fast-Track/i)).toBeInTheDocument();
    expect(screen.getByText(/Case: NCRB-WS-2026-0189/i)).toBeInTheDocument();

    // Check remaining days display (around 45 days remaining out of 60)
    expect(screen.getByText(/Within Statutory Period/i)).toBeInTheDocument();
    expect(screen.getByText(/Mandatory Charge Sheet Filing \(Day 60\)/i)).toBeInTheDocument();
  });

  it('renders Public Judicial Verification Portal (/verify) and validates on-chain records & tamper detection', async () => {
    const { PublicVerificationPage } = await import('@/pages/verify/PublicVerificationPage');

    render(
      <MemoryRouter initialEntries={['/verify?hash=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08']}>
        <PublicVerificationPage />
      </MemoryRouter>
    );

    // Verify Government of India header and statutory citation
    expect(screen.getByText(/Public Judicial Verification Portal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Bharatiya Sakshya Adhiniyam, 2023 \(BSA\)/i)[0]).toBeInTheDocument();

    // Verify valid verification card for CCTV Footage (Block #1042)
    await waitFor(() => {
      expect(screen.getByText(/EVIDENCE BIT-EXACT & UNALTERED ON BLOCKCHAIN/i)).toBeInTheDocument();
      expect(screen.getByText(/Consensus Confirmed • Block #1042/i)).toBeInTheDocument();
      expect(screen.getByText(/CCTV Footage Still - Front Gate Cam 04/i)).toBeInTheDocument();
      expect(screen.getByText(/Print Judicial Receipt/i)).toBeInTheDocument();
    });

    // Test tamper exhibit button
    const tamperedBtn = screen.getByText(/Tampered \/ Unrecorded Digest/i);
    fireEvent.click(tamperedBtn);

    await waitFor(() => {
      expect(screen.getByText(/RECORD NOT FOUND OR CRYPTOGRAPHIC DIGEST TAMPERED/i)).toBeInTheDocument();
      expect(screen.getByText(/Tamper Alert \/ Notarization Failed/i)).toBeInTheDocument();
    });
  });

  it('renders Legal AI Co-Pilot with 5-point brief, contradiction detector, and BNS section recommender', async () => {
    const { CaseAIAssistantModal } = await import('@/components/cases/CaseAIAssistantModal');

    const mockCase = {
      id: '33333333-cccc-4ccc-8ccc-000000000001',
      case_number: 'NCRB-WS-2026-0189',
      title: 'Cyber Harassment & Extortion Syndicate',
      description: 'Priority case',
      case_type: 'CRIMINAL_INVESTIGATION' as const,
      status: 'UNDER_INVESTIGATION' as const,
      priority: 'CRITICAL' as const,
      owner_department_id: '11111111-aaaa-4aaa-8aaa-000000000001',
      investigating_department_id: '11111111-aaaa-4aaa-8aaa-000000000001',
      assigned_officer_id: '22222222-bbbb-4bbb-8bbb-000000000002',
      opened_at: '2026-09-01T10:00:00.000Z',
      closed_at: null,
      created_by: '22222222-bbbb-4bbb-8bbb-000000000002',
      created_at: '2026-09-01T10:00:00.000Z',
    };

    render(
      <CaseAIAssistantModal
        caseItem={mockCase}
        documents={[]}
        evidence={[]}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Verify modal header
    expect(screen.getByText(/Legal AI Co-Pilot & Evidentiary Intelligence/i)).toBeInTheDocument();
    expect(screen.getByText(/Case Intelligence & Prosecution Brief Generator: NCRB-WS-2026-0189/i)).toBeInTheDocument();

    // Verify Tab 1 content
    expect(screen.getByText(/Executive 5-Point Brief/i)).toBeInTheDocument();
    expect(screen.getByText(/Evidentiary Health: 98% Strong/i)).toBeInTheDocument();

    // Switch to Tab 2: Contradiction Check
    fireEvent.click(screen.getByText(/Contradiction & Alibi Check/i));
    expect(screen.getByText(/CRITICAL CONTRADICTION #1: Falsified Alibi/i)).toBeInTheDocument();
    expect(screen.getByText(/CORROBORATION CONFIRMED: Witness Corroborates Location/i)).toBeInTheDocument();

    // Switch to Tab 3: BNS / BNSS Sections
    fireEvent.click(screen.getByText(/BNS \/ BNSS Section Tagging/i));
    expect(screen.getByText(/Section 72, Bharatiya Nyaya Sanhita, 2023 \(BNS\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Section 79, Bharatiya Nyaya Sanhita, 2023 \(BNS\)/i)).toBeInTheDocument();
  });

  it('renders Crime Scene Spot Seizure Memo Modal (Section 105 BNSS) and prepares tamper-sealed panchnama', async () => {
    const { SpotSeizureMemoModal } = await import('@/components/evidence/SpotSeizureMemoModal');

    const mockCases = [
      {
        id: '33333333-cccc-4ccc-8ccc-000000000001',
        case_number: 'NCRB-WS-2026-0189',
        title: 'Cyber Harassment Syndicate',
        description: 'Case 1',
        case_type: 'CRIMINAL_INVESTIGATION' as const,
        status: 'UNDER_INVESTIGATION' as const,
        priority: 'CRITICAL' as const,
        owner_department_id: '11111111-aaaa-4aaa-8aaa-000000000001',
        investigating_department_id: '11111111-aaaa-4aaa-8aaa-000000000001',
        assigned_officer_id: '22222222-bbbb-4bbb-8bbb-000000000002',
        opened_at: '2026-09-01T10:00:00.000Z',
        closed_at: null,
        created_by: '22222222-bbbb-4bbb-8bbb-000000000002',
        created_at: '2026-09-01T10:00:00.000Z',
      },
    ];

    render(
      <SpotSeizureMemoModal
        cases={mockCases}
        currentCaseId={mockCases[0].id}
        isOpen={true}
        onClose={() => {}}
      />
    );

    // Check header and Section 105 BNSS badges
    expect(screen.getByText(/Crime Scene Spot Seizure Memo & Digital Panchnama/i)).toBeInTheDocument();
    expect(screen.getByText(/Mandatory Section 105 Compliance/i)).toBeInTheDocument();

    // Check device input fields and panch witness names
    expect(screen.getByDisplayValue(/Apple iPhone 15 Pro/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/TEB-DEL-2026-90412/i)).toBeInTheDocument();
    expect(screen.getByText(/Independent Panch Witnesses \(Compulsory under Section 105\(2\) BNSS\)/i)).toBeInTheDocument();

    // Click submit to seal memo
    const sealBtn = screen.getByText(/Generate & Cryptographically Seal Memo/i);
    fireEvent.click(sealBtn);

    await waitFor(() => {
      expect(screen.getByText(/Seizure Memo Successfully Generated & Sealed on Blockchain/i)).toBeInTheDocument();
      expect(screen.getByText(/MEMORANDUM OF SEARCH AND SEIZURE \(SPOT PANCHNAMA\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Print Court Panchnama/i)).toBeInTheDocument();
    });
  });

  it('renders SecureDocumentViewer with Auto-Mask PII (BNS 72) and opens Section 63 BSA Certificate', async () => {
    const { SecureDocumentViewer } = await import('@/components/documents/SecureDocumentViewer');

    const mockDoc: DocumentItem = {
      id: '44444444-dddd-4ddd-8ddd-000000000001',
      case_id: '33333333-cccc-4ccc-8ccc-000000000001',
      document_number: 'DOC-FIR-001',
      title: 'FIR No. 104/2026 - PS Connaught Place (Zero FIR under Sec 173 BNSS)',
      description: 'Test document description',
      document_type: 'FIR',
      classification: 'CONFIDENTIAL',
      status: 'ACTIVE',
      current_version_id: '66666666-ffff-4fff-8fff-000000000001',
      uploaded_by: '22222222-bbbb-4bbb-8bbb-000000000002',
      owner_department_id: '11111111-aaaa-4aaa-8aaa-000000000001',
      retention_until: '2031-09-01',
      is_evidence: true,
      created_at: '2026-09-01T10:00:00.000Z',
    };

    render(
      <SecureDocumentViewer
        document={mockDoc}
        blobUrl={null}
        mimeType="text/plain"
        textContent="Confidential Witness Information. Victim details protected under BNS 72."
      />
    );

    // Verify Auto-Mask PII button exists
    const piiBtn = screen.getByText(/Auto-Mask PII \(BNS 72\)/i);
    expect(piiBtn).toBeInTheDocument();

    // Click Auto-Mask PII
    fireEvent.click(piiBtn);
    expect(screen.getByText(/PII Protected \(BNS 72\)/i)).toBeInTheDocument();

    // Verify Section 63 BSA Certificate button exists and opens modal
    const certBtn = screen.getByText(/Section 63 BSA Certificate/i);
    expect(certBtn).toBeInTheDocument();
    fireEvent.click(certBtn);

    // Certificate modal should now be visible with statutory headers
    expect(screen.getByText(/Section 63 BSA \/ 65B IEA Electronic Evidence Certificate/i)).toBeInTheDocument();
    expect(screen.getAllByText(/BHARATIYA SAKSHYA ADHINIYAM, 2023/i)[0]).toBeInTheDocument();
  });

  it('renders UserGuideModal with Officer SOP and statutory guidance', async () => {
    const { UserGuideModal } = await import('@/components/common/UserGuideModal');

    render(
      <MemoryRouter>
        <UserGuideModal isOpen={true} onClose={() => {}} />
      </MemoryRouter>
    );

    // Verify modal header and directive badge
    expect(screen.getByText(/Officer User Manual & Standard Operating Procedure/i)).toBeInTheDocument();
    expect(screen.getByText(/MHA • NCRB NATIONAL DIRECTIVE/i)).toBeInTheDocument();

    // Verify statutory guidance
    expect(screen.getByText(/Sec 63 BSA, 2023/i)).toBeInTheDocument();
    expect(screen.getByText(/Sec 105 BNSS, 2023/i)).toBeInTheDocument();
    expect(screen.getByText(/Sec 193 BNSS, 2023/i)).toBeInTheDocument();
  });
});
