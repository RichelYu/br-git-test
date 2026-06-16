import { Shield, Heart, Zap, Star, AlertTriangle, CheckCircle } from 'lucide-react'
import ScoreRing from './ScoreRing'

const SCORE_CONFIGS = [
  {
    key: 'loyaltyScore',
    label: '专情指数',
    icon: Heart,
    color: '#ec4899',
    desc: '与固定搭档游戏的集中度',
    highText: '固定搭档，专情之人',
    lowText: '广泛游戏，多人共舞',
  },
  {
    key: 'playerScore',
    label: '花心指数',
    icon: Star,
    color: '#f97316',
    desc: '开黑对象的多样程度',
    highText: '认识的人很多很多',
    lowText: '圈子小而精',
  },
  {
    key: 'socialScore',
    label: '社交能量',
    icon: Zap,
    color: '#22c55e',
    desc: '每天平均接触的新伙伴',
    highText: '社交达人',
    lowText: '独行侠',
  },
  {
    key: 'stabilityScore',
    label: '关系稳定性',
    icon: Shield,
    color: '#3b82f6',
    desc: '核心圈子的稳定程度',
    highText: '关系牢固可靠',
    lowText: '流动性较大',
  },
  {
    key: 'chemistryScore',
    label: '默契程度',
    icon: CheckCircle,
    color: '#a855f7',
    desc: '与常驻搭档的配合胜率',
    highText: '配合默契，心有灵犀',
    lowText: '各打各的',
  },
  {
    key: 'nightScore',
    label: '深夜系数',
    icon: AlertTriangle,
    color: '#6366f1',
    desc: '深夜 (22:00-06:00) 活跃度',
    highText: '夜猫子，晚睡成习惯',
    lowText: '作息规律，日出而作',
  },
]

export default function CharacterAnalysis({ scores, personality, summonerName }) {
  return (
    <div className="space-y-6">
      {/* Archetype Header */}
      <div className="text-center p-5 rounded-xl gold-border card-bg">
        <div className="text-3xl mb-2">
          {personality.flirtRating.emoji}
        </div>
        <h3 className="text-xl font-bold text-lol-gold mb-1">{personality.archetype}</h3>
        <p className="text-sm text-gray-400">{personality.archetypeDesc}</p>
        <div className={`mt-3 text-sm font-medium ${personality.flirtRating.color}`}>
          花心等级: {personality.flirtRating.level}
        </div>
      </div>

      {/* Score Rings */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-xl gold-border card-bg">
        {SCORE_CONFIGS.map(({ key, label, color }) => (
          <ScoreRing
            key={key}
            score={scores[key]}
            label={label}
            color={color}
            size={72}
          />
        ))}
      </div>

      {/* Score Details */}
      <div className="space-y-3">
        {SCORE_CONFIGS.map(({ key, label, icon: Icon, color, desc, highText, lowText }) => {
          const val = scores[key]
          const isHigh = val >= 55
          return (
            <div key={key} className="p-3 rounded-lg gold-border card-bg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-sm font-medium text-gray-300">{label}</span>
                  <span className="text-xs text-gray-500">— {desc}</span>
                </div>
                <span className="text-sm font-bold" style={{ color }}>{val}</span>
              </div>
              <div className="score-bar">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${val}%`,
                    background: `linear-gradient(90deg, ${color}80, ${color})`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isHigh ? highText : lowText}
              </p>
            </div>
          )
        })}
      </div>

      {/* Verdict */}
      <div className="p-4 rounded-xl border border-lol-gold/30 bg-lol-gold/5">
        <h4 className="text-sm font-bold text-lol-gold mb-2">综合判断</h4>
        <p className="text-sm text-gray-300">{personality.verdict}</p>
        {personality.nightLabel && (
          <p className="text-sm text-gray-400 mt-2">{personality.nightLabel}</p>
        )}
        {personality.partnerNote && (
          <p className="text-sm text-gray-400 mt-2">{personality.partnerNote}</p>
        )}
      </div>

      {/* Tips */}
      <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/30">
        <h4 className="text-sm font-bold text-gray-400 mb-2">分析小贴士</h4>
        <ul className="space-y-1">
          {personality.tips.map((tip, i) => (
            <li key={i} className="text-xs text-gray-500">{tip}</li>
          ))}
        </ul>
        <p className="text-xs text-gray-600 mt-3 border-t border-gray-800 pt-3">
          ⚠️ 本分析仅供娱乐，游戏行为不能完全代表真实性格，请理性参考。
        </p>
      </div>
    </div>
  )
}
