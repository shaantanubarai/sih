import { api } from './api';
import { SignatureOut, SignatureVerifyOut } from '@/types';

export const signaturesService = {
  signVersion: async (
    documentId: string,
    versionId: string
  ): Promise<SignatureOut> => {
    const res = await api.post<SignatureOut>(
      `/documents/${documentId}/versions/${versionId}/sign`
    );
    return res.data;
  },

  listSignatures: async (
    documentId: string
  ): Promise<{ items: SignatureOut[]; disclaimer: string }> => {
    const res = await api.get<{ items: SignatureOut[]; disclaimer: string }>(
      `/documents/${documentId}/signatures`
    );
    return res.data;
  },

  verifySignature: async (signatureId: string): Promise<SignatureVerifyOut> => {
    const res = await api.get<SignatureVerifyOut>(
      `/signatures/${signatureId}/verify`
    );
    return res.data;
  },
};
