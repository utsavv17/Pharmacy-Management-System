import React from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

export const GlobalLoader: React.FC = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 pointer-events-none">
      <div className="h-full bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-white/30 animate-[loading-bar_1.5s_ease-in-out_infinite]" />
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
