import { useState, useCallback } from 'react'
import { ArrowLeft, Github, FlaskConical } from 'lucide-react'
import SearchForm from './components/SearchForm'
import StatsOverview from './components/StatsOverview'
import CoPlayersTable from './components/CoPlayersTable'
import CharacterAnalysis from './components/CharacterAnalysis'
import HourChart from './components/HourChart'
import ChampionBadges from './components/ChampionBadges'
import { getSummonerByName, getMatchIds, getMatch, getLeagueEntries } from './services/riotApi'
import { analyzeMatches, generateMockData } from './services/analyzer'

const TABS = [
  { id: 'overview', label: '数据总览' },
  { id: 'partners', label: '开黑搭档' },
  { id: 'analysis', label: '关系分析' },
]

function ParticleBg() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 8}s`,
    size: `${1 + Math.random() * 3}px`,
  }))

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
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
        // Fetch in batches to avoid rate limits
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
    <div className="min-h-screen bg-lol-dark relative">
      <ParticleBg />

      {/* Header */}
      <header className="relative border-b border-lol-gold/20 bg-lol-dark-mid/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 hexagon bg-lol-gold flex items-center justify-center text-lol-dark text-sm font-bold">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-lol-gold leading-none">召唤师情报局</h1>
              <p className="text-xs text-gray-500 leading-none">LOL 关系图谱分析</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge bg-green-400/10 text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
              Beta
            </span>
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 py-8">

        {/* LANDING */}
        {state === 'landing' && (
          <div className="flex flex-col items-center">
            {/* Hero */}
            <div className="text-center mb-10 mt-4">
              <div className="text-6xl mb-4 animate-float">⚔️</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-lol-gold text-shadow-gold mb-3">
                召唤师关系分析
              </h2>
              <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                通过英雄联盟战绩数据，分析召唤师的开黑习惯、社交圈子和游戏性格，
                帮你了解那个 TA 的游戏世界。
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-10">
              {[
                { icon: '🔍', title: '战绩深析', desc: '分析最近50场排位赛数据' },
                { icon: '👥', title: '搭档图谱', desc: '发现最常一起开黑的人' },
                { icon: '💘', title: '性格评估', desc: '游戏专情指数·花心指数' },
              ].map(f => (
                <div key={f.title} className="p-4 rounded-xl gold-border card-bg text-center">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <div className="text-sm font-semibold text-lol-gold">{f.title}</div>
                  <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
                </div>
              ))}
            </div>

            {/* Search Form */}
            <div className="w-full max-w-xl p-6 rounded-2xl gold-border card-bg">
              <h3 className="text-sm font-semibold text-lol-gold/70 uppercase tracking-wider mb-5 text-center">
                输入召唤师信息
              </h3>
              <SearchForm onSearch={handleSearch} loading={false} />
            </div>

            <p className="text-xs text-gray-600 mt-6 text-center max-w-sm">
              本工具仅供娱乐，所有分析基于游戏数据，不代表真实人际关系判断。
              请遵守 Riot Games 使用条款。
            </p>
          </div>
        )}

        {/* LOADING */}
        {state === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="lol-spinner" />
            <div className="text-center">
              <p className="text-lol-gold font-semibold">{loadingMsg}</p>
              <p className="text-xs text-gray-500 mt-1">数据正在汇聚，请稍候...</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 bg-lol-gold rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
            <div className="text-5xl">⚠️</div>
            <div className="text-center max-w-md">
              <h3 className="text-lg font-bold text-red-400 mb-2">分析失败</h3>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
            <button onClick={() => setState('landing')} className="btn-outline-gold flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              重新查询
            </button>
          </div>
        )}

        {/* RESULT */}
        {state === 'result' && analysisData && (
          <div className="space-y-6">
            {/* Summoner Header */}
            <div className="flex items-center gap-4 p-4 rounded-xl gold-border card-bg">
              <div className="w-14 h-14 rounded-full bg-lol-gold/20 flex items-center justify-center text-2xl font-bold text-lol-gold border border-lol-gold/40 shrink-0">
                {summonerInfo?.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-lol-gold truncate">{summonerInfo?.name}</h2>
                <p className="text-sm text-gray-400">
                  Lv.{summonerInfo?.summonerLevel} · 分析了 {analysisData.totalGames} 场排位赛
                </p>
              </div>
              <button
                onClick={() => setState('landing')}
                className="btn-outline-gold flex items-center gap-1 text-xs shrink-0"
              >
                <ArrowLeft className="w-3 h-3" />
                返回
              </button>
            </div>

            {/* Stats Overview */}
            <StatsOverview data={analysisData} />

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-gray-900/50 border border-gray-800">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-lol-gold text-lol-dark'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 rounded-xl gold-border card-bg space-y-6">
              {activeTab === 'overview' && (
                <>
                  <ChampionBadges champions={analysisData.topChampions} />
                  <HourChart
                    hourDistribution={analysisData.hourDistribution}
                    peakHour={analysisData.peakHour}
                  />
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                    <div className="text-center p-3 rounded-lg bg-gray-900/50">
                      <div className="text-2xl font-bold text-purple-400">{analysisData.totalUniquePlayers}</div>
                      <div className="text-xs text-gray-500 mt-1">不同开黑伙伴</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-900/50">
                      <div className={`text-2xl font-bold ${analysisData.isNightOwl ? 'text-indigo-400' : 'text-yellow-400'}`}>
                        {analysisData.isNightOwl ? '🦉 夜猫子' : '☀️ 日行者'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">作息类型</div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'partners' && (
                <CoPlayersTable
                  players={analysisData.topCoPlayers}
                  totalGames={analysisData.totalGames}
                />
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
            <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
              <FlaskConical className="w-4 h-4 text-yellow-500/70 shrink-0" />
              <p className="text-xs text-yellow-500/60">
                分析基于最近 {analysisData.totalGames} 场排位赛数据，仅供参考和娱乐，请勿用于真实关系判断。
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
