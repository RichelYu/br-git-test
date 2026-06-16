import { useState } from 'react'
import { Search, Key, Globe, Info } from 'lucide-react'
import { PLATFORM_LABELS } from '../services/riotApi'

export default function SearchForm({ onSearch, loading }) {
  const [summonerName, setSummonerName] = useState('')
  const [platform, setPlatform] = useState('kr')
  const [apiKey, setApiKey] = useState('')
  const [showApiHelp, setShowApiHelp] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!summonerName.trim()) return
    onSearch({ summonerName: summonerName.trim(), platform, apiKey: apiKey.trim(), demoMode })
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Summoner Name */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lol-gold opacity-60" />
          <input
            type="text"
            value={summonerName}
            onChange={e => setSummonerName(e.target.value)}
            placeholder="召唤师名称 / Summoner Name"
            className="input-gold pl-10"
            disabled={loading}
          />
        </div>

        {/* Platform */}
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lol-gold opacity-60" />
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="input-gold pl-10 appearance-none cursor-pointer"
            disabled={loading}
          >
            {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
              <option key={key} value={key} className="bg-gray-900">{label}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        {!demoMode && (
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lol-gold opacity-60" />
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Riot API Key (RGAPI-...)"
              className="input-gold pl-10"
              disabled={loading}
            />
          </div>
        )}

        {/* API Key Help */}
        <div className="flex items-start gap-2 text-xs text-gray-400">
          <button
            type="button"
            onClick={() => setShowApiHelp(!showApiHelp)}
            className="flex items-center gap-1 text-lol-gold/70 hover:text-lol-gold transition-colors mt-0.5"
          >
            <Info className="w-3 h-3" />
            如何获取 API Key？
          </button>
        </div>

        {showApiHelp && (
          <div className="text-xs text-gray-400 bg-gray-900/50 rounded p-3 border border-gray-700 space-y-1">
            <p>1. 访问 <span className="text-lol-gold">developer.riotgames.com</span></p>
            <p>2. 使用 Riot 账号登录</p>
            <p>3. 在 Dashboard 获取开发者 API Key (每24小时刷新)</p>
            <p>4. API Key 格式为 <code className="text-green-400">RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code></p>
            <p className="text-yellow-500/80">⚠️ 开发者 Key 有每分钟20次、每秒2次的速率限制</p>
          </div>
        )}

        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              onClick={() => setDemoMode(!demoMode)}
              className={`w-10 h-5 rounded-full transition-colors duration-200 relative ${
                demoMode ? 'bg-lol-gold' : 'bg-gray-700'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                demoMode ? 'translate-x-5' : ''
              }`} />
            </div>
            <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
              演示模式 (无需 API Key)
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || (!demoMode && !apiKey.trim()) || !summonerName.trim()}
          className="w-full btn-gold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-lol-dark border-t-transparent rounded-full animate-spin" />
              分析中...
            </span>
          ) : (
            '开始分析 ⚔️'
          )}
        </button>
      </form>
    </div>
  )
}
