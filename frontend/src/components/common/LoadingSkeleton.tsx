import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'table' | 'detail' | 'list';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  count = 3,
  className = '',
}) => {
  if (type === 'table') {
    return (
      <div className={`w-full bg-slate-900 rounded-xl border border-slate-800 p-4 animate-pulse ${className}`}>
        <div className="h-8 bg-slate-800 rounded w-1/4 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 bg-slate-800/60 rounded w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="h-12 bg-slate-900 border border-slate-800 rounded-xl w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-slate-900 border border-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 bg-slate-900 border border-slate-800 rounded-xl animate-pulse space-y-3"
        >
          <div className="h-5 bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-800/60 rounded w-1/2" />
          <div className="h-16 bg-slate-800/40 rounded w-full mt-4" />
        </div>
      ))}
    </div>
  );
};
