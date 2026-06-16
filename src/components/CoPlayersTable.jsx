import { Trophy, Clock, Swords } from 'lucide-react'

const RANK_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600', 'text-gray-400', 'text-gray-500']
const RANK_BG = ['bg-yellow-400/10', 'bg-gray-300/10', 'bg-amber-600/10', 'bg-gray-400/5', 'bg-gray-500/5']

function WinRateBadge({ rate }) {
  const color = rate >= 60 ? 'text-green-400 bg-green-400/10' :
                rate >= 50 ? 'text-blue-400 bg-blue-400/10' :
                'text-red-400 bg-red-400/10'
  return (
    <span className={`badge ${color}`}>{rate}%</span>
  )
}

export default function CoPlayersTable({ players, totalGames }) {
  if (!players || players.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-4 h-4 text-lol-gold" />
        <h3 className="text-sm font-semibold text-lol-gold">常驻开黑搭档</h3>
        <span className="text-xs text-gray-500 ml-auto">共 {totalGames} 场</span>
      </div>

      {players.map((player, i) => {
        const pct = Math.round((player.count / totalGames) * 100)
        return (
          <div
            key={player.puuid}
            className={`flex items-center gap-3 p-3 rounded-lg ${RANK_BG[Math.min(i, 4)]} gold-border hover:bg-white/5 transition-colors`}
          >
            {/* Rank */}
            <span className={`text-sm font-bold w-5 text-center ${RANK_COLORS[Math.min(i, 4)]}`}>
              {i === 0 ? '👑' : i + 1}
            </span>

            {/* Name & champion */}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-200 text-sm truncate">{player.name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <span>{player.topChampion}</span>
                <span>·</span>
                <Clock className="w-3 h-3" />
                <span>{player.lastSeenDate}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-200">{player.count} 场</div>
                <div className="text-xs text-gray-500">{pct}% 占比</div>
              </div>
              <WinRateBadge rate={player.winRate} />
            </div>
          </div>
        )
      })}

      {/* Bar visualization for top 5 */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 mb-3">开黑频率分布</p>
        {players.slice(0, 5).map((player, i) => {
          const pct = Math.round((player.count / totalGames) * 100)
          const maxPct = Math.round((players[0].count / totalGames) * 100)
          return (
            <div key={player.puuid} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-gray-500 w-16 truncate">{player.name}</span>
              <div className="flex-1 score-bar">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${(pct / maxPct) * 100}%`,
                    background: i === 0
                      ? 'linear-gradient(90deg, #C89B3C, #F0E6D3)'
                      : `rgba(200, 155, 60, ${0.6 - i * 0.1})`,
                  }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
