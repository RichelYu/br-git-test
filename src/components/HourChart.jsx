import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Moon } from 'lucide-react'

const NIGHT_HOURS = [22, 23, 0, 1, 2, 3, 4, 5]

export default function HourChart({ hourDistribution, peakHour }) {
  const data = hourDistribution.map((count, hour) => ({
    hour: `${hour}时`,
    count,
    isNight: NIGHT_HOURS.includes(hour),
    isPeak: hour === peakHour,
  }))

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Moon className="w-4 h-4 text-brand-purple" />
        <h3 className="text-sm font-bold text-slate-700">活跃时段分布</h3>
        <span className="text-xs text-slate-400 ml-auto">
          高峰: {peakHour}:00 - {(peakHour + 1) % 24}:00
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="hour"
            tick={{ fill: '#94a3b8', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: 'rgba(255,107,157,0.06)' }}
            contentStyle={{
              background: '#fff',
              border: '1px solid #FCE0EC',
              borderRadius: '12px',
              color: '#5b5066',
              fontSize: '12px',
              boxShadow: '0 6px 24px rgba(255,107,157,0.15)',
            }}
            formatter={(value) => [value + ' 场', '游戏数']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.isPeak ? '#FF6B9D'
                  : entry.isNight ? '#A78BFA'
                  : '#FBCFE0'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{background: '#FF6B9D'}} />
          <span className="text-xs text-slate-400">高峰时段</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{background: '#A78BFA'}} />
          <span className="text-xs text-slate-400">深夜时段</span>
        </div>
      </div>
    </div>
  )
}
