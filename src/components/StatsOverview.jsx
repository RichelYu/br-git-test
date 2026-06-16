import { Gamepad2, Users, TrendingUp, Calendar } from 'lucide-react'

function StatCard({ icon: Icon, label, value, sub, color = 'text-lol-gold' }) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl gold-border card-bg text-center">
      <Icon className={`w-5 h-5 mb-2 ${color}`} />
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs font-medium text-gray-300 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function StatsOverview({ data }) {
  const winColor = data.winRate >= 55 ? 'text-green-400' : data.winRate >= 45 ? 'text-blue-400' : 'text-red-400'

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={Gamepad2}
        label="分析场次"
        value={data.totalGames}
        sub="场排位赛"
      />
      <StatCard
        icon={TrendingUp}
        label="胜率"
        value={`${data.winRate}%`}
        sub={`${data.totalWins}胜 ${data.totalGames - data.totalWins}负`}
        color={winColor}
      />
      <StatCard
        icon={Users}
        label="认识的人"
        value={data.totalUniquePlayers}
        sub="个不同召唤师"
        color="text-purple-400"
      />
      <StatCard
        icon={Calendar}
        label="每日搭档"
        value={data.avgCoPlayersPerDay}
        sub={`活跃 ${data.activeDays} 天`}
        color="text-cyan-400"
      />
    </div>
  )
}
