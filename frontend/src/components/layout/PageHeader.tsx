import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  actions?: React.ReactNode;
}

export const PageHeader = ({ title, description, icon: Icon, actions }: PageHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#E8F0EB] flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0B3B2C] tracking-tight">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};
