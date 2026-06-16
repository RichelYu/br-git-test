import { useEffect, useState } from 'react'

export default function ScoreRing({ score, size = 80, label, color = '#FF6B9D' }) {
  const [animated, setAnimated] = useState(0)
  const r = (size / 2) - 6
  const circumference = 2 * Math.PI * r
  const offset = circumference - (animated / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#FCE7F0"
          strokeWidth="5"
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
          style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="700"
        >
          {Math.round(animated)}
        </text>
      </svg>
      <span className="text-xs text-slate-500 text-center font-medium">{label}</span>
    </div>
  )
}
