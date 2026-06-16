import { useState, useEffect } from 'react'
import { Search, Key, Globe, Info, Sparkles } from 'lucide-react'
import { PLATFORM_LABELS, DEMO_ONLY_PLATFORMS } from '../services/riotApi'

export default function SearchForm({ onSearch, loading }) {
  const [summonerName, setSummonerName] = useState('')
  const [platform, setPlatform] = useState('cn')
  const [apiKey, setApiKey] = useState('')
  const [showApiHelp, setShowApiHelp] = useState(false)
  const [demoMode, setDemoMode] = useState(true)

  const isDemoOnly = DEMO_ONLY_PLATFORMS.includes(platform)

  // 国服等仅演示服务器：强制开启演示模式
  useEffect(() => {
    if (isDemoOnly) setDemoMode(true)
  }, [isDemoOnly])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!summonerName.trim()) return
    const effectiveDemo = isDemoOnly ? true : demoMode
    onSearch({ summonerName: summonerName.trim(), platform, apiKey: apiKey.trim(), demoMode: effectiveDemo })
  }

  const showApiKeyInput = !demoMode && !isDemoOnly

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Summoner Name */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-pink" />
          <input
            type="text"
            value={summonerName}
            onChange={e => setSummonerName(e.target.value)}
            placeholder="召唤师名称 / Summoner Name"
            className="input-field pl-10"
            disabled={loading}
          />
        </div>

        {/* Platform */}
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-pink" />
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="input-field pl-10 appearance-none cursor-pointer"
            disabled={loading}
          >
            {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* 国服提示 */}
        {isDemoOnly && (
          <div className="text-xs text-pink-500 bg-pink-50 rounded-xl p-3 border border-pink-100 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              国服由腾讯运营，<b>没有 Riot 官方 API</b> 可查询真实战绩，已自动切换为演示模式。
              想查真实数据请选择韩服 / 日服 / 美服等 Riot 直营服。
            </span>
          </div>
        )}

        {/* API Key */}
        {showApiKeyInput && (
          <div className="relative">
            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-pink" />
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Riot API Key (RGAPI-...)"
              className="input-field pl-10"
              disabled={loading}
            />
          </div>
        )}

        {/* API Key Help */}
        {!isDemoOnly && (
          <button
            type="button"
            onClick={() => setShowApiHelp(!showApiHelp)}
            className="flex items-center gap-1 text-xs text-brand-pink-deep hover:underline"
          >
            <Info className="w-3 h-3" />
            免费 API Key 怎么获取？
          </button>
        )}

        {showApiHelp && !isDemoOnly && (
          <div className="text-xs text-slate-500 bg-purple-50/60 rounded-xl p-3.5 border border-purple-100 space-y-1.5 leading-relaxed">
            <p className="font-semibold text-purple-600">Riot API Key 全部免费，没有付费版 👇</p>
            <p>1. 打开 <span className="font-semibold text-brand-pink-deep">developer.riotgames.com</span> 用 Riot 账号登录</p>
            <p>2. 首页直接领取 <b>开发 Key（Development）</b>，格式 <code className="text-purple-600 bg-white px-1 rounded">RGAPI-xxxx...</code></p>
            <p>3. ⏰ 开发 Key <b>每 24 小时过期</b>，过期后回来重新生成即可</p>
            <p>4. 想长期用：申请 <b>个人 / 生产 Key</b>（同样免费，需填应用说明审核）</p>
            <p className="text-pink-500">⚠️ 限速：20次/10秒、100次/2分钟，本工具已自动分批请求</p>
          </div>
        )}

        {/* Demo Mode Toggle */}
        {!isDemoOnly && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDemoMode(!demoMode)}
              className={`w-11 h-6 rounded-full transition-colors duration-200 relative shrink-0 ${
                demoMode ? 'bg-gradient-to-r from-brand-pink to-brand-purple' : 'bg-slate-200'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                demoMode ? 'translate-x-5' : ''
              }`} />
            </button>
            <span className="text-sm text-slate-500">
              演示模式 <span className="text-slate-400">(无需 API Key，使用模拟数据)</span>
            </span>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (showApiKeyInput && !apiKey.trim()) || !summonerName.trim()}
          className="w-full btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              分析中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              开始分析
            </>
          )}
        </button>
      </form>
    </div>
  )
}
