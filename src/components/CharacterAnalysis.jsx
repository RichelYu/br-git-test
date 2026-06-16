import { Shield, Heart, Zap, Star, AlertTriangle, CheckCircle, Snowflake, Coffee, Users2, Waves, Church } from 'lucide-react'
import ScoreRing from './ScoreRing'
import { QUEUE_LABELS } from '../services/analyzer'

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
    label: '老色批指数',
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

// 模式人格指标（犀利 + 抽象）
const MODE_SCORE_CONFIGS = [
  {
    key: 'insulatorScore', label: '情感绝缘体', icon: Snowflake, color: '#38bdf8',
    desc: '单双排独自上分、拒绝开黑',
    highText: '钢筋水泥级绝缘，亲密关系生人勿近',
    lowText: '愿意与人同行，没那么孤僻',
  },
  {
    key: 'aramSeniorScore', label: '峡谷老年人', icon: Coffee, color: '#f59e0b',
    desc: '大乱斗养生局占比',
    highText: '峡谷养老院常驻，佛系摆烂随缘',
    lowText: '还在峡谷里拼杀，未到退休年纪',
  },
  {
    key: 'herdScore', label: '群居刚需', icon: Users2, color: '#22c55e',
    desc: '灵活组排（必须组队）占比',
    highText: '离了队友活不了的群居动物',
    lowText: '独立性强，能单飞',
  },
]

const GENDER_SCORE_CONFIGS = [
  {
    key: 'seaKingScore', label: '海王浓度', icon: Waves, color: '#ec4899',
    desc: '异性队友占比',
    highText: '异性磁场爆表，海王预警 🔱',
    lowText: '异性缘平平，比较安分',
  },
  {
    key: 'sameSexScore', label: '同性相吸', icon: Church, color: '#8b5cf6',
    desc: '同性队友占比',
    highText: '清一色同性，异性绝缘体本缘',
    lowText: '同性圈子一般',
  },
]

function MetricBar({ cfg, val }) {
  const { label, icon: Icon, color, desc, highText, lowText } = cfg
  const isHigh = val >= 55
  return (
    <div className="p-3.5 rounded-2xl card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color }} />
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          <span className="text-xs text-slate-400">— {desc}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{val}</span>
      </div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${val}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1.5">{isHigh ? highText : lowText}</p>
    </div>
  )
}

const MODE_COLORS = { solo: '#38bdf8', flex: '#22c55e', aram: '#f59e0b', other: '#cbd5e1' }

function ModeDistribution({ modeStats }) {
  const order = ['solo', 'flex', 'aram', 'other']
  const max = Math.max(1, ...order.map(k => modeStats[k]?.count || 0))
  return (
    <div className="p-4 rounded-2xl card">
      <h4 className="text-sm font-bold text-slate-700 mb-3">🎮 模式分布</h4>
      {order.filter(k => modeStats[k]?.count > 0).map(k => (
        <div key={k} className="flex items-center gap-2 mb-2.5">
          <span className="text-xs text-slate-500 w-16 shrink-0">{QUEUE_LABELS[k]}</span>
          <div className="flex-1 score-bar">
            <div className="score-bar-fill" style={{
              width: `${(modeStats[k].count / max) * 100}%`,
              background: MODE_COLORS[k],
            }} />
          </div>
          <span className="text-xs text-slate-500 w-20 text-right shrink-0">
            {modeStats[k].count}场 · 胜{modeStats[k].winRate}%
          </span>
        </div>
      ))}
    </div>
  )
}

export default function CharacterAnalysis({ scores, personality, modeStats, genderStats, hasGenderData, summonerName }) {
  return (
    <div className="space-y-6">
      {/* Archetype Header */}
      <div className="text-center p-6 rounded-2xl card-soft animate-pop">
        <div className="text-4xl mb-2 animate-float">
          {personality.flirtRating.emoji}
        </div>
        <h3 className="text-2xl font-bold text-gradient mb-1">{personality.archetype}</h3>
        <p className="text-sm text-slate-500">{personality.archetypeDesc}</p>
        <div className={`mt-3 inline-block chip bg-white ${personality.flirtRating.color}`}>
          老色批等级 · {personality.flirtRating.level}
        </div>
      </div>

      {/* Score Rings */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl card">
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
            <div key={key} className="p-3.5 rounded-2xl card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                  <span className="text-xs text-slate-400">— {desc}</span>
                </div>
                <span className="text-sm font-bold" style={{ color }}>{val}</span>
              </div>
              <div className="score-bar">
                <div
                  className="score-bar-fill"
                  style={{
                    width: `${val}%`,
                    background: `linear-gradient(90deg, ${color}99, ${color})`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {isHigh ? highText : lowText}
              </p>
            </div>
          )
        })}
      </div>

      {/* —— 模式人格 —— */}
      <div className="pt-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px flex-1 bg-pink-100" />
          <span className="text-xs font-bold text-slate-400">模式人格 · 抽象鉴定</span>
          <span className="h-px flex-1 bg-pink-100" />
        </div>

        {/* 模式称号 */}
        {personality.modeTitle && (
          <div className="text-center p-5 rounded-2xl card-soft mb-4 animate-pop">
            <div className="text-4xl mb-2">{personality.modeTitle.emoji}</div>
            <h3 className="text-xl font-bold text-gradient mb-1">{personality.modeTitle.name}</h3>
            <p className="text-sm text-slate-500">{personality.modeTitle.desc}</p>
          </div>
        )}

        {modeStats && <ModeDistribution modeStats={modeStats} />}

        <div className="space-y-3 mt-3">
          {MODE_SCORE_CONFIGS.map(cfg => (
            <MetricBar key={cfg.key} cfg={cfg} val={scores[cfg.key]} />
          ))}
        </div>
      </div>

      {/* —— 性别衍生指标 —— */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="h-px flex-1 bg-pink-100" />
          <span className="text-xs font-bold text-slate-400">性别 × 战绩 · 衍生指标</span>
          <span className="h-px flex-1 bg-pink-100" />
        </div>
        {hasGenderData ? (
          <>
            {personality.seaKingRating && (
              <div className="text-center p-4 rounded-2xl card-soft mb-3">
                <div className="text-3xl mb-1">{personality.seaKingRating.emoji}</div>
                <div className={`text-lg font-bold ${personality.seaKingRating.color}`}>
                  {personality.seaKingRating.level}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  异性队友 {genderStats.oppositeCount} 人次 · 同性 {genderStats.sameCount} 人次
                </p>
              </div>
            )}
            <div className="space-y-3">
              {GENDER_SCORE_CONFIGS.map(cfg => (
                <MetricBar key={cfg.key} cfg={cfg} val={scores[cfg.key]} />
              ))}
            </div>
          </>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
            <p className="text-sm text-slate-400">
              「海王浓度」等性别指标需要性别数据 👀
            </p>
            <p className="text-xs text-slate-300 mt-1">
              请在查询时选择「TA 的性别」（演示模式可见效果；外服真实数据暂无队友性别）
            </p>
          </div>
        )}
      </div>

      {/* Verdict */}
      <div className="p-5 rounded-2xl card-soft">
        <h4 className="text-sm font-bold text-brand-pink-deep mb-2">💖 综合判断</h4>
        <p className="text-sm text-slate-600">{personality.verdict}</p>
        {personality.nightLabel && (
          <p className="text-sm text-slate-500 mt-2">{personality.nightLabel}</p>
        )}
        {personality.partnerNote && (
          <p className="text-sm text-slate-500 mt-2">{personality.partnerNote}</p>
        )}
      </div>

      {/* Tips */}
      <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100">
        <h4 className="text-sm font-bold text-purple-500 mb-2">分析小贴士</h4>
        <ul className="space-y-1">
          {personality.tips.map((tip, i) => (
            <li key={i} className="text-xs text-slate-500">{tip}</li>
          ))}
        </ul>
        <p className="text-xs text-slate-400 mt-3 border-t border-purple-100 pt-3">
          ⚠️ 本分析仅供娱乐，游戏行为不能完全代表真实性格，请理性参考。
        </p>
      </div>
    </div>
  )
}
