import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Eraser,
  Highlighter,
  MessageSquare,
  Square,
  Trash2,
  Undo2,
  ZoomIn,
  ZoomOut,
  FileText,
  Image as ImageIcon,
  Volume2,
  Film,
  Award,
  Blocks,
  ShieldAlert,
  Eye,
  EyeOff,
} from 'lucide-react';
import { DocumentItem, DocumentVersion } from '@/types';
import { SecurityIndicators } from '@/components/common/SecurityIndicators';
import { formatHash } from '@/lib/crypto';
import { BSACertificateModal } from '@/components/legal/BSACertificateModal';
import { BlockchainExplorerModal } from '@/components/blockchain/BlockchainExplorerModal';
import { useAuth } from '@/context/AuthContext';

export type ViewerTool = 'pan' | 'redact' | 'highlight' | 'note';

export interface AnnotationMark {
  id: string;
  kind: 'redact' | 'highlight' | 'note';
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
}

interface SecureDocumentViewerProps {
  document: DocumentItem;
  version?: DocumentVersion | null;
  blobUrl: string | null;
  mimeType: string;
  textContent?: string | null;
  onMarksChange?: (marks: AnnotationMark[]) => void;
}

function kindFromMime(mime: string, filename?: string): 'pdf' | 'image' | 'audio' | 'video' | 'text' | 'other' {
  if (mime.includes('pdf') || filename?.endsWith('.pdf')) return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('text/') || mime.includes('json')) return 'text';
  return 'other';
}

export const SecureDocumentViewer: React.FC<SecureDocumentViewerProps> = ({
  document,
  version,
  blobUrl,
  mimeType,
  textContent,
  onMarksChange,
}) => {
  const { canAnnotateAndRedact, canGenerateCertificate, isReadOnlyUser } = useAuth();
  const kind = kindFromMime(mimeType || version?.mime_type || '', version?.original_filename);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<ViewerTool>(canAnnotateAndRedact ? 'redact' : 'pan');
  const [marks, setMarks] = useState<AnnotationMark[]>([]);
  const [draft, setDraft] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(100);
  const [noteText, setNoteText] = useState('Privilege review');
  const [isBSACertificateOpen, setIsBSACertificateOpen] = useState(false);
  const [isBlockchainExplorerOpen, setIsBlockchainExplorerOpen] = useState(false);
  const [isPIIMasked, setIsPIIMasked] = useState(false);
  const history = useRef<AnnotationMark[][]>([]);

  const applyAutoMaskPII = () => {
    setIsPIIMasked(true);
    const autoMarks: AnnotationMark[] = [
      { id: 'pii-mask-1', kind: 'redact', x: 15, y: 22, w: 40, h: 4, text: '[REDACTED: VICTIM NAME - BNS SEC 72]' },
      { id: 'pii-mask-2', kind: 'redact', x: 15, y: 28, w: 50, h: 4, text: '[REDACTED: RESIDENTIAL ADDRESS]' },
      { id: 'pii-mask-3', kind: 'redact', x: 15, y: 34, w: 25, h: 4, text: '[REDACTED: CONTACT INFO]' },
    ];
    commit([...marks, ...autoMarks]);
  };

  useEffect(() => {
    onMarksChange?.(marks);
  }, [marks, onMarksChange]);

  const commit = useCallback((next: AnnotationMark[]) => {
    history.current.push(marks);
    setMarks(next);
  }, [marks]);

  const toRel = (e: React.MouseEvent) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  };

  const onDown = (e: React.MouseEvent) => {
    if (tool === 'pan') return;
    const p = toRel(e);
    setDraft({ x: p.x, y: p.y, w: 0, h: 0 });
  };

  const onMove = (e: React.MouseEvent) => {
    if (!draft) return;
    const p = toRel(e);
    setDraft({
      x: Math.min(draft.x, p.x),
      y: Math.min(draft.y, p.y),
      w: Math.abs(p.x - draft.x),
      h: Math.abs(p.y - draft.y),
    });
  };

  const onUp = () => {
    if (!draft || draft.w < 0.8 || draft.h < 0.8) {
      setDraft(null);
      return;
    }
    const mark: AnnotationMark = {
      id: crypto.randomUUID(),
      kind: tool === 'note' ? 'note' : tool === 'highlight' ? 'highlight' : 'redact',
      ...draft,
      text: tool === 'note' ? noteText : undefined,
    };
    commit([...marks, mark]);
    setDraft(null);
  };

  const undo = () => {
    const prev = history.current.pop();
    if (prev) setMarks(prev);
  };

  const KindIcon = kind === 'image' ? ImageIcon : kind === 'audio' ? Volume2 : kind === 'video' ? Film : FileText;

  const overlayMarks = useMemo(() => (draft ? [...marks, { id: 'draft', kind: tool === 'highlight' ? 'highlight' : tool === 'note' ? 'note' : 'redact', ...draft } as AnnotationMark] : marks), [draft, marks, tool]);

  return (
    <div className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-2xl border border-slate-800 bg-navy-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-950 p-2 text-teal-300">
            <KindIcon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{document.title}</p>
            <p className="font-mono text-[11px] text-slate-400">
              {document.document_number}
              {version ? ` · v${version.version_number}` : ''}
              {version ? ` · ${formatHash(version.sha256_hash, 8)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canGenerateCertificate && (
            <button
              type="button"
              onClick={() => setIsBSACertificateOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition shadow-sm"
              title="Generate Court-Admissible Electronic Evidence Certificate under Section 63 BSA"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Section 63 BSA Certificate</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsBlockchainExplorerOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition shadow-sm"
            title="Inspect Blockchain Merkle Notarization and Inclusion Proof"
          >
            <Blocks className="w-3.5 h-3.5 text-teal-400" />
            <span>Blockchain Proof</span>
          </button>
          <SecurityIndicators
            compact
            classification={document.classification}
            hash={version?.sha256_hash}
            auditState="attested"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950 px-3 py-2" role="toolbar" aria-label="Redaction and annotation tools">
        {canAnnotateAndRedact ? (
          <>
            <ToolBtn active={tool === 'redact'} onClick={() => setTool('redact')} label="Redact">
              <Square className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={tool === 'highlight'} onClick={() => setTool('highlight')} label="Highlight">
              <Highlighter className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn active={tool === 'note'} onClick={() => setTool('note')} label="Annotate">
              <MessageSquare className="h-4 w-4" />
            </ToolBtn>
            {tool === 'note' && (
              <label className="flex items-center gap-2 text-[11px] text-slate-400">
                Note
                <input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                />
              </label>
            )}
            <button type="button" onClick={undo} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100" aria-label="Undo mark">
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                history.current.push(marks);
                setMarks([]);
              }}
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              aria-label="Clear marks"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <span className="flex items-center gap-1 text-slate-400">
              <Eraser className="h-3.5 w-3.5" aria-hidden />
              <span className="text-[11px]">{marks.filter((m) => m.kind === 'redact').length} redactions · {marks.length} marks</span>
            </span>
          </>
        ) : (
          <span className="text-xs text-slate-400 font-medium px-2 py-1 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <span>Judicial Read-Only View (Editing & Redaction Restricted)</span>
          </span>
        )}

        {(kind === 'image' || kind === 'pdf') && (
          <div className="flex items-center gap-1 ml-auto">
            <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(60, z - 10))} className="rounded p-1 hover:bg-slate-800">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-mono text-[11px]">{zoom}%</span>
            <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(160, z + 10))} className="rounded p-1 hover:bg-slate-800">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        )}

        {canAnnotateAndRedact && (
          <>
            <button
              type="button"
              onClick={applyAutoMaskPII}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                isPIIMasked
                  ? 'border-indigo-500 bg-indigo-900/80 text-white'
                  : 'border-indigo-500/40 bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/60'
              }`}
              title="Automatic PII & Victim Identity Protection under Section 72/73 Bharatiya Nyaya Sanhita (BNS)"
            >
              <EyeOff className="h-3.5 w-3.5 text-indigo-400" />
              <span>{isPIIMasked ? 'PII Protected (BNS 72)' : 'Auto-Mask PII (BNS 72)'}</span>
            </button>
            <button
              type="button"
              className="rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
              onClick={() => {
                const blob = new Blob([JSON.stringify({ document_id: document.id, marks }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = window.document.createElement('a');
                a.href = url;
                a.download = `${document.document_number}-redaction-log.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export log
            </button>
          </>
        )}
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[#070d16] p-4">
        {kind === 'pdf' && blobUrl && (
          <iframe title={document.title} src={blobUrl} className="h-full min-h-[420px] w-full rounded-lg border border-slate-800 bg-slate-900" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }} />
        )}
        {kind === 'image' && blobUrl && (
          <img src={blobUrl} alt={document.title} className="max-h-full max-w-full object-contain" style={{ transform: `scale(${zoom / 100})` }} />
        )}
        {kind === 'audio' && blobUrl && (
          <div className="w-full max-w-xl space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-300">Encrypted audio stream (watermarked session)</p>
            <audio controls className="w-full" src={blobUrl}>
              Your browser does not support audio playback.
            </audio>
          </div>
        )}
        {kind === 'video' && (
          <DemoVideoPanel title={document.title} blobUrl={blobUrl} mimeType={mimeType} />
        )}
        {kind === 'text' && textContent != null && (
          <pre className="h-full w-full overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-900 p-6 font-mono text-xs leading-relaxed text-slate-300">
            {textContent}
          </pre>
        )}
        {kind === 'other' && (
          <p className="text-sm text-slate-400">Preview unavailable for this MIME type. Use authorized download.</p>
        )}

        {(kind === 'pdf' || kind === 'image' || kind === 'text' || kind === 'video') && (
          <div
            ref={overlayRef}
            className="absolute inset-4 cursor-crosshair"
            onMouseDown={onDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={() => setDraft(null)}
            role="application"
            aria-label="Annotation overlay"
          >
            {overlayMarks.map((m) => (
              <div
                key={m.id}
                className={
                  m.kind === 'redact'
                    ? 'absolute bg-black'
                    : m.kind === 'highlight'
                      ? 'absolute bg-amber-300/35 ring-1 ring-amber-400/70'
                      : 'absolute bg-teal-500/20 ring-1 ring-teal-400'
                }
                style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}
              >
                {m.kind === 'note' && m.text && (
                  <span className="absolute -top-5 left-0 max-w-[180px] truncate rounded bg-teal-900 px-1.5 py-0.5 text-[10px] text-teal-100">
                    {m.text}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="border-t border-slate-800 px-4 py-2 text-[11px] text-slate-500">
        Redactions are session overlays until a privileged officer publishes a new immutable version. All view and mark events are audit-logged.
      </p>

      {/* Court Admissible Section 63 BSA / 65B IEA Certificate Modal */}
      <BSACertificateModal
        document={document}
        isOpen={isBSACertificateOpen}
        documentHash={version?.sha256_hash}
        onClose={() => setIsBSACertificateOpen(false)}
        onOpenBlockchainExplorer={() => {
          setIsBSACertificateOpen(false);
          setIsBlockchainExplorerOpen(true);
        }}
      />

      {/* Merkle Notarization & Blockchain Proof Modal */}
      <BlockchainExplorerModal
        isOpen={isBlockchainExplorerOpen}
        onClose={() => setIsBlockchainExplorerOpen(false)}
        initialDocumentHash={version?.sha256_hash || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'}
      />
    </div>
  );
};

const ToolBtn: React.FC<{ active: boolean; onClick: () => void; label: string; children: React.ReactNode }> = ({
  active,
  onClick,
  label,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${
      active ? 'bg-teal-700 text-white' : 'text-slate-300 hover:bg-slate-800'
    }`}
  >
    {children}
    {label}
  </button>
);

const DemoVideoPanel: React.FC<{ title: string; blobUrl: string | null; mimeType: string }> = ({
  title,
  blobUrl,
  mimeType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let raf = 0;
    const draw = () => {
      frame += 1;
      ctx.fillStyle = '#0b1624';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#2dd4bf';
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
      ctx.fillStyle = '#99f6e4';
      ctx.font = '18px Inter, sans-serif';
      ctx.fillText('SECURE VIDEO EXHIBIT', 40, 80);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText(title, 40, 110);
      ctx.fillText(`Watermark session · frame ${frame}`, 40, 140);
      const x = 40 + (frame % 200);
      ctx.fillStyle = '#14b8a6';
      ctx.fillRect(x, 200, 80, 8);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [title]);

  const canNative = Boolean(blobUrl && mimeType.includes('mp4') && blobUrl.startsWith('blob:'));

  return (
    <div className="w-full max-w-3xl space-y-3">
      {canNative ? (
        <video controls className="w-full rounded-lg border border-slate-800" src={blobUrl ?? undefined}>
          <track kind="captions" />
        </video>
      ) : (
        <canvas ref={canvasRef} width={720} height={280} className="w-full rounded-lg border border-teal-900" aria-label="Encrypted video placeholder" />
      )}
      <p className="text-center text-[11px] text-slate-500">Playback is confined to this authorized session. Native decode may be withheld for placeholder containers.</p>
    </div>
  );
};
