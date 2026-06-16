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
        <Moon className="w-4 h-4 text-lol-gold" />
        <h3 className="text-sm font-semibold text-lol-gold">活跃时段分布</h3>
        <span className="text-xs text-gray-500 ml-auto">
          高峰: {peakHour}:00 - {(peakHour + 1) % 24}:00
        </span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="hour"
            tick={{ fill: '#6b7280', fontSize: 9 }}
            tickLine={false}
            axisLine={false}
            interval={3}
          />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              background: '#0A1428',
              border: '1px solid rgba(200,155,60,0.3)',
              borderRadius: '6px',
              color: '#F0E6D3',
              fontSize: '12px',
            }}
            formatter={(value) => [value + ' 场', '游戏数']}
          />
          <Bar dataKey="count" radius={[2, 2, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.isPeak ? '#C89B3C'
                  : entry.isNight ? 'rgba(99, 102, 241, 0.6)'
                  : 'rgba(200, 155, 60, 0.25)'
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-1">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{background: '#C89B3C'}} />
          <span className="text-xs text-gray-500">高峰时段</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm" style={{background: 'rgba(99,102,241,0.6)'}} />
          <span className="text-xs text-gray-500">深夜时段</span>
        </div>
      </div>
    </div>
  )
}
