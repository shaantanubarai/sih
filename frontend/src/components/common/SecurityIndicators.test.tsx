import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SecurityIndicators } from './SecurityIndicators';

describe('SecurityIndicators', () => {
  it('communicates encrypted, restricted and attested state without relying on color', () => {
    render(<SecurityIndicators classification="RESTRICTED" auditState="attested" hash="abc123" />);
    expect(screen.getByText('Encrypted')).toBeInTheDocument();
    expect(screen.getByText(/Need-to-know/)).toBeInTheDocument();
    expect(screen.getByText('Audit chain intact')).toBeInTheDocument();
    expect(screen.getByText(/SHA-256/)).toBeInTheDocument();
  });
});
