import { Sword } from 'lucide-react'

// Map common champion names to LoL CDN icon names
const CHAMP_NAME_MAP = {
  '阿卡丽': 'Akali', '劫': 'Zed', '卡莎': 'Kaisa', '杰斯': 'Jayce',
  '奥瑞利安索尔': 'AurelionSol', '薇恩': 'Vayne', '盲僧': 'LeeSin',
  '锐雯': 'Riven', '泰达米尔': 'Tryndamere',
}

function ChampIcon({ name }) {
  const iconName = CHAMP_NAME_MAP[name] || name
  return (
    <img
      src={`https://ddragon.leagueoflegends.com/cdn/14.14.1/img/champion/${iconName}.png`}
      alt={name}
      className="w-8 h-8 rounded"
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

export default function ChampionBadges({ champions }) {
  if (!champions || champions.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sword className="w-4 h-4 text-lol-gold" />
        <h3 className="text-sm font-semibold text-lol-gold">常用英雄</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {champions.map(({ name, count, rate }) => (
          <div
            key={name}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg gold-border bg-gray-900/50"
          >
            <ChampIcon name={name} />
            <div>
              <div className="text-sm font-medium text-gray-200">{name}</div>
              <div className="text-xs text-gray-500">{count}场 · {rate}%</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
