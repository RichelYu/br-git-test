import { Clock, Swords } from 'lucide-react'

const RANK_BG = ['bg-pink-50', 'bg-purple-50', 'bg-sky-50', 'bg-slate-50', 'bg-slate-50']
const RANK_TEXT = ['text-brand-pink-deep', 'text-purple-500', 'text-sky-500', 'text-slate-400', 'text-slate-400']

function WinRateBadge({ rate }) {
  const color = rate >= 60 ? 'text-emerald-600 bg-emerald-50' :
                rate >= 50 ? 'text-sky-600 bg-sky-50' :
                'text-rose-500 bg-rose-50'
  return <span className={`chip ${color}`}>{rate}%</span>
}

export default function CoPlayersTable({ players, totalGames }) {
  if (!players || players.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-4 h-4 text-brand-pink" />
        <h3 className="text-sm font-bold text-slate-700">常驻开黑搭档</h3>
        <span className="text-xs text-slate-400 ml-auto">共 {totalGames} 场</span>
      </div>

      {players.map((player, i) => {
        const pct = Math.round((player.count / totalGames) * 100)
        return (
          <div
            key={player.puuid}
            className={`flex items-center gap-3 p-3 rounded-xl ${RANK_BG[Math.min(i, 4)]} hover:brightness-95 transition-all`}
          >
            <span className={`text-sm font-bold w-5 text-center ${RANK_TEXT[Math.min(i, 4)]}`}>
              {i === 0 ? '👑' : i + 1}
            </span>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-700 text-sm truncate">{player.name}</div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <span>{player.topChampion}</span>
                <span>·</span>
                <Clock className="w-3 h-3" />
                <span>{player.lastSeenDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-700">{player.count} 场</div>
                <div className="text-xs text-slate-400">{pct}% 占比</div>
              </div>
              <WinRateBadge rate={player.winRate} />
            </div>
          </div>
        )
      })}

      {/* Bar visualization for top 5 */}
      <div className="mt-4 pt-4 border-t border-pink-100">
        <p className="text-xs text-slate-400 mb-3">开黑频率分布</p>
        {players.slice(0, 5).map((player, i) => {
          const pct = Math.round((player.count / totalGames) * 100)
          const maxPct = Math.round((players[0].count / totalGames) * 100)
          return (
            <div key={player.puuid} className="flex items-center gap-2 mb-2">
              <span className="text-xs text-slate-500 w-16 truncate">{player.name}</span>
              <div className="flex-1 score-bar">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${(pct / maxPct) * 100}%`,
                    background: i === 0
                      ? 'linear-gradient(90deg, #FF6B9D, #A78BFA)'
                      : `rgba(255, 107, 157, ${0.7 - i * 0.12})`,
                  }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
