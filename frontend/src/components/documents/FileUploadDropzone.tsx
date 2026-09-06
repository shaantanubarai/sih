import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface FileUploadDropzoneProps {
  onFileSelected: (file: File) => void;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_MAX_SIZE = 20 * 1024 * 1024; // 20 MB matching backend config

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFileSelected,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  disabled = false,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setErrorMessage(null);

    // Size validation
    if (file.size > maxSizeBytes) {
      setErrorMessage(
        `File exceeds maximum limit of ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB.`
      );
      return;
    }

    // Type validation
    if (acceptedTypes.length > 0 && !acceptedTypes.includes(file.type)) {
      // Also check extension fallback for windows mime anomalies
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const validExts = ['.pdf', '.jpg', '.jpeg', '.png', '.tiff', '.txt', '.docx'];
      if (!validExts.includes(ext)) {
        setErrorMessage('Unsupported file format. Allowed: PDF, JPG, PNG, TIFF, TXT, DOCX.');
        return;
      }
    }

    setSelectedFile(file);
    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
        id="file-upload-input"
      />

      {!selectedFile ? (
        <label
          htmlFor="file-upload-input"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition ${
            disabled ? 'opacity-50 cursor-not-allowed border-slate-800' : ''
          } ${
            dragOver
              ? 'border-blue-500 bg-blue-950/20'
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900'
          }`}
        >
          <div className="p-3 bg-slate-800 rounded-full text-blue-400 mb-3">
            <UploadCloud className="w-7 h-7" />
          </div>
          <span className="text-sm font-semibold text-slate-200">
            Click to upload or drag and drop
          </span>
          <span className="mt-1 text-xs text-slate-400">
            PDF, Images, DOCX, TXT up to 20MB
          </span>
        </label>
      ) : (
        <div className="flex items-center justify-between p-3.5 bg-slate-900 border border-slate-700 rounded-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2.5 bg-blue-950 text-blue-400 rounded-lg">
              <File className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-slate-200 truncate">
                {selectedFile.name}
              </div>
              <div className="text-xs text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Remove selected file"
              className="p-1 text-slate-400 hover:text-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
