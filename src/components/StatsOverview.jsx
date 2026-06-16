import { Gamepad2, Users, TrendingUp, Calendar } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-2xl card text-center">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${bg}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs font-semibold text-slate-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function StatsOverview({ data }) {
  const winColor = data.winRate >= 55 ? 'text-emerald-500' : data.winRate >= 45 ? 'text-sky-500' : 'text-rose-500'
  const winBg = data.winRate >= 55 ? 'bg-emerald-50' : data.winRate >= 45 ? 'bg-sky-50' : 'bg-rose-50'

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={Gamepad2}
        label="分析场次"
        value={data.totalGames}
        sub="场排位赛"
        color="text-brand-pink-deep"
        bg="bg-pink-50"
      />
      <StatCard
        icon={TrendingUp}
        label="胜率"
        value={`${data.winRate}%`}
        sub={`${data.totalWins}胜 ${data.totalGames - data.totalWins}负`}
        color={winColor}
        bg={winBg}
      />
      <StatCard
        icon={Users}
        label="认识的人"
        value={data.totalUniquePlayers}
        sub="个不同召唤师"
        color="text-purple-500"
        bg="bg-purple-50"
      />
      <StatCard
        icon={Calendar}
        label="每日搭档"
        value={data.avgCoPlayersPerDay}
        sub={`活跃 ${data.activeDays} 天`}
        color="text-sky-500"
        bg="bg-sky-50"
      />
    </div>
  )
}
