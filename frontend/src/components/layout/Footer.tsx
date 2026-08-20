import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto flex-shrink-0 z-20">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center items-center text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-[#193C6C] text-sm tracking-tight">My Medical</span>
            <span className="text-slate-400">© {new Date().getFullYear()}</span>
            <span className="text-slate-300 mx-2">•</span>
            <span className="text-slate-400">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
