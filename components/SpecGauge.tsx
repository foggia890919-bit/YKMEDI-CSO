'use client';

import { motion } from 'framer-motion';

// 원형 게이지 (헬스 대시보드 스타일)
export function CircularGauge({
  value,
  max,
  label,
  unit,
  color,
  displayValue,
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color: string;
  displayValue?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          {/* 배경 트랙 */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-gray-100"
          />
          {/* 진행 게이지 */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            whileInView={{ strokeDashoffset: offset }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>
            {displayValue ?? value}
          </span>
          <span className="text-xs text-gray-400">{unit}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-gray-700">{label}</p>
    </div>
  );
}

// 막대 게이지 (스포츠 대시보드 스타일)
export function BarGauge({
  value,
  max,
  label,
  color,
  unit = '',
}: {
  value: number;
  max: number;
  label: string;
  color: string;
  unit?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
