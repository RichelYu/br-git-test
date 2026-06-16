import { useState, useCallback } from 'react'
import { ArrowLeft, FlaskConical, Heart } from 'lucide-react'
import SearchForm from './components/SearchForm'
import StatsOverview from './components/StatsOverview'
import CoPlayersTable from './components/CoPlayersTable'
import CharacterAnalysis from './components/CharacterAnalysis'
import HourChart from './components/HourChart'
import ChampionBadges from './components/ChampionBadges'
import { getSummonerByName, getMatchIds, getMatch } from './services/riotApi'
import { analyzeMatches, generateMockData } from './services/analyzer'

const TABS = [
  { id: 'overview', label: '数据总览' },
  { id: 'partners', label: '开黑搭档' },
  { id: 'analysis', label: '关系分析' },
]

function BubbleBg() {
  const bubbles = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 10}s`,
    duration: `${10 + Math.random() * 10}s`,
    size: `${20 + Math.random() * 60}px`,
  }))

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {bubbles.map(b => (
        <div
          key={b.id}
          className="bubble"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
            animationDuration: b.duration,
          }}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [state, setState] = useState('landing') // landing | loading | result | error
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')
  const [analysisData, setAnalysisData] = useState(null)
  const [summonerInfo, setSummonerInfo] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  const handleSearch = useCallback(async ({ summonerName, platform, apiKey, demoMode }) => {
    setState('loading')
    setError('')
    setActiveTab('overview')

    try {
      let matches
      let summoner = { name: summonerName, summonerLevel: '??', profileIconId: 0 }

      if (demoMode) {
        setLoadingMsg('生成演示数据...')
        await new Promise(r => setTimeout(r, 800))
        matches = generateMockData(summonerName)
        summoner = {
          name: summonerName,
          summonerLevel: 267,
          profileIconId: 29,
          puuid: 'target-puuid',
        }
      } else {
        setLoadingMsg('查询召唤师信息...')
        const s = await getSummonerByName(summonerName, platform, apiKey)
        summoner = { ...s, puuid: s.puuid }
        setSummonerInfo(s)

        setLoadingMsg('获取对局记录...')
        const matchIds = await getMatchIds(s.puuid, platform, apiKey, 50)

        if (!matchIds || matchIds.length === 0) {
          throw new Error('未找到该召唤师的排位赛记录，请尝试调整服务器区域。')
        }

        setLoadingMsg(`分析 ${matchIds.length} 场对局数据...`)
        const batchSize = 5
        const fetchedMatches = []
        for (let i = 0; i < matchIds.length; i += batchSize) {
          const batch = matchIds.slice(i, i + batchSize)
          const results = await Promise.all(batch.map(id => getMatch(id, platform, apiKey)))
          fetchedMatches.push(...results)
          if (i + batchSize < matchIds.length) {
            setLoadingMsg(`已加载 ${Math.min(i + batchSize, matchIds.length)}/${matchIds.length} 场...`)
            await new Promise(r => setTimeout(r, 1200))
          }
        }
        matches = fetchedMatches
      }

      setLoadingMsg('计算分析结果...')
      const puuid = summoner.puuid || 'target-puuid'
      const result = analyzeMatches(matches, puuid)

      setSummonerInfo(summoner)
      setAnalysisData(result)
      setState('result')

    } catch (err) {
      console.error(err)
      setError(err.message || '分析失败，请检查API Key和召唤师名称是否正确。')
      setState('error')
    }
  }, [])

  return (
    <div className="min-h-screen relative">
      <BubbleBg />

      {/* Header */}
      <header className="relative border-b border-pink-100 bg-white/70 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-pink to-brand-purple flex items-center justify-center shadow-lg shadow-pink-200">
              <Heart className="w-4.5 h-4.5 text-white" fill="white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gradient leading-none">心动雷达</h1>
              <p className="text-xs text-slate-400 leading-none mt-0.5">LOL 关系图谱分析</p>
            </div>
          </div>
          <span className="chip bg-pink-50 text-brand-pink-deep">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-pink mr-1 animate-pulse" />
            Beta
          </span>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 py-8">

        {/* LANDING */}
        {state === 'landing' && (
          <div className="flex flex-col items-center">
            {/* Hero */}
            <div className="text-center mb-10 mt-4">
              <div className="text-6xl mb-4 animate-float">💘</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gradient mb-3">
                召唤师关系分析
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                通过英雄联盟战绩数据，分析召唤师的开黑习惯、社交圈子和游戏性格，
                帮你了解那个 TA 的游戏世界 💕
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
              {[
                { icon: '🔍', title: '战绩深析', desc: '分析最近50场排位赛数据' },
                { icon: '👥', title: '搭档图谱', desc: '发现最常一起开黑的人' },
                { icon: '💞', title: '性格评估', desc: '游戏专情指数·老色批指数' },
              ].map(f => (
                <div key={f.title} className="p-5 rounded-2xl card text-center hover:-translate-y-1 transition-transform">
                  <div className="text-3xl mb-2">{f.icon}</div>
                  <div className="text-sm font-bold text-slate-700">{f.title}</div>
                  <div className="text-xs text-slate-400 mt-1">{f.desc}</div>
                </div>
              ))}
            </div>

            {/* Search Form */}
            <div className="w-full max-w-xl p-6 rounded-3xl card">
              <h3 className="text-sm font-bold text-brand-pink-deep tracking-wide mb-5 text-center">
                ✨ 输入召唤师信息
              </h3>
              <SearchForm onSearch={handleSearch} loading={false} />
            </div>

            <p className="text-xs text-slate-400 mt-6 text-center max-w-sm">
              本工具仅供娱乐，所有分析基于游戏数据，不代表真实人际关系判断。
              请遵守 Riot Games 使用条款。
            </p>
          </div>
        )}

        {/* LOADING */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="heart-spinner" />
            <div className="text-center">
              <p className="text-brand-pink-deep font-bold">{loadingMsg}</p>
              <p className="text-xs text-slate-400 mt-1">数据正在汇聚，请稍候...</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2.5 h-2.5 bg-brand-pink rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="text-5xl">😢</div>
            <div className="text-center max-w-md">
              <h3 className="text-lg font-bold text-rose-500 mb-2">分析失败</h3>
              <p className="text-sm text-slate-500">{error}</p>
            </div>
            <button onClick={() => setState('landing')} className="btn-ghost flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              重新查询
            </button>
          </div>
        )}

        {/* RESULT */}
        {state === 'result' && analysisData && (
          <div className="space-y-6">
            {/* Summoner Header */}
            <div className="flex items-center gap-4 p-4 rounded-2xl card">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-pink to-brand-purple flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-lg shadow-pink-200">
                {summonerInfo?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-700 truncate">{summonerInfo?.name}</h2>
                <p className="text-sm text-slate-400">
                  Lv.{summonerInfo?.summonerLevel} · 分析了 {analysisData.totalGames} 场排位赛
                </p>
              </div>
              <button
                onClick={() => setState('landing')}
                className="btn-ghost flex items-center gap-1 text-xs shrink-0"
              >
                <ArrowLeft className="w-3 h-3" />
                返回
              </button>
            </div>

            {/* Stats Overview */}
            <StatsOverview data={analysisData} />

            {/* Tabs */}
            <div className="flex gap-1.5 p-1.5 rounded-2xl bg-white border border-pink-100 shadow-sm">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-brand-pink to-brand-purple text-white shadow-md shadow-pink-200'
                      : 'text-slate-400 hover:text-brand-pink-deep'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'overview' && (
                <div className="p-5 rounded-2xl card space-y-6">
                  <ChampionBadges champions={analysisData.topChampions} />
                  <HourChart
                    hourDistribution={analysisData.hourDistribution}
                    peakHour={analysisData.peakHour}
                  />
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-pink-100">
                    <div className="text-center p-3 rounded-2xl bg-purple-50">
                      <div className="text-2xl font-bold text-purple-500">{analysisData.totalUniquePlayers}</div>
                      <div className="text-xs text-slate-400 mt-1">不同开黑伙伴</div>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-amber-50">
                      <div className="text-xl font-bold text-amber-500">
                        {analysisData.isNightOwl ? '🦉 夜猫子' : '☀️ 日行者'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">作息类型</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'partners' && (
                <div className="p-5 rounded-2xl card">
                  <CoPlayersTable
                    players={analysisData.topCoPlayers}
                    totalGames={analysisData.totalGames}
                  />
                </div>
              )}

              {activeTab === 'analysis' && (
                <CharacterAnalysis
                  scores={analysisData.scores}
                  personality={analysisData.personality}
                  summonerName={summonerInfo?.name}
                />
              )}
            </div>

            {/* Footer note */}
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
              <FlaskConical className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-600/80">
                分析基于最近 {analysisData.totalGames} 场排位赛数据，仅供参考和娱乐，请勿用于真实关系判断。
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
