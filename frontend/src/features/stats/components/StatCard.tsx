import React from 'react';

type StatColor = 'blue' | 'green' | 'purple' | 'red' | 'indigo';

const BG: Record<StatColor, string> = {
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  purple: 'bg-purple-50 border-purple-200',
  red: 'bg-red-50 border-red-200',
  indigo: 'bg-indigo-50 border-indigo-200',
};

const TEXT: Record<StatColor, string> = {
  blue: 'text-blue-700',
  green: 'text-green-700',
  purple: 'text-purple-700',
  red: 'text-red-700',
  indigo: 'text-indigo-700',
};

export function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: StatColor;
}) {
  return (
    <div className={`rounded-xl border p-4 ${BG[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-bold ${TEXT[color]}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
