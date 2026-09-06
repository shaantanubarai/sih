export function miniPdf(title: string): Blob {
  const body = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 80>>stream
BT /F1 18 Tf 72 720 Td (${title.replace(/[()]/g, '')}) Tj ET
endstream
endobj
trailer<</Root 1 0 R>>
%%EOF
FICTIONAL DEMO — NO REAL CASE DATA
`;
  return new Blob([body], { type: 'application/pdf' });
}

export function demoSvgImage(label: string): Blob {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <rect width="960" height="540" fill="#0b1624"/>
  <rect x="40" y="40" width="880" height="460" fill="#14253b" stroke="#2dd4bf" stroke-width="2"/>
  <text x="480" y="240" text-anchor="middle" fill="#99f6e4" font-family="Segoe UI, sans-serif" font-size="28">SECURE STILL FRAME</text>
  <text x="480" y="290" text-anchor="middle" fill="#94a3b8" font-family="Segoe UI, sans-serif" font-size="16">${label}</text>
  <text x="480" y="330" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="12">AES-256 at rest · fictional exhibit</text>
</svg>`;
  return new Blob([svg], { type: 'image/svg+xml' });
}

export function silentWav(seconds = 2): Blob {
  const sampleRate = 8000;
  const samples = sampleRate * seconds;
  const dataSize = samples * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const write = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  write(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, dataSize, true);
  return new Blob([buffer], { type: 'audio/wav' });
}

export function demoText(title: string): Blob {
  const body = `SECURE LEGAL DMS — COURT INDEX (FICTIONAL)
${title}

1. Notice of appearance (placeholder)
2. Index of exhibits (placeholder)
3. Proposed hearing calendar (placeholder)

This file contains no real party names.
`;
  return new Blob([body], { type: 'text/plain' });
}

export function placeholderVideo(): Blob {
  return new Blob(['DEMO-VIDEO-CONTAINER'], { type: 'video/mp4' });
}
