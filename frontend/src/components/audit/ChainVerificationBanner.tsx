import React, { useState } from 'react';
import { auditService } from '@/services/audit.service';
import { AuditVerifyOut } from '@/types';
import { ShieldCheck, ShieldAlert, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';

export const ChainVerificationBanner: React.FC = () => {
  const [result, setResult] = useState<AuditVerifyOut | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await auditService.verifyAuditChain();
      setResult(res);
    } catch {
      alert('Failed to execute audit chain cryptographic verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div
          className={`p-2.5 rounded-xl border ${
            result?.valid === true
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              : result?.valid === false
              ? 'bg-rose-950/80 text-rose-400 border-rose-800'
              : 'bg-blue-950/80 text-blue-400 border-blue-800'
          }`}
        >
          {result?.valid === false ? (
            <ShieldAlert className="w-6 h-6" />
          ) : (
            <ShieldCheck className="w-6 h-6" />
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>Cryptographic Ledger Verification</span>
            {result?.valid === true && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                LEDGER VERIFIED
              </span>
            )}
            {result?.valid === false && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                INTEGRITY COMPROMISED
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {result ? (
              result.valid ? (
                <span className="text-emerald-400">
                  All {result.events_checked} audit blocks sequentially verified. Hash chain matches unbroken genesis block.
                </span>
              ) : (
                <span className="text-rose-400">
                  Tamper detected at event index {result.broken_at_index}. Cryptographic chain is invalid!
                </span>
              )
            ) : (
              'Verify the sequential SHA-256 hash chaining across all system operations to prove tamper-evidence.'
            )}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={isVerifying}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-blue-900/30 whitespace-nowrap"
      >
        {isVerifying ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
        <span>{isVerifying ? 'Verifying Chain...' : 'Verify Audit Chain'}</span>
      </button>
    </div>
  );
};
