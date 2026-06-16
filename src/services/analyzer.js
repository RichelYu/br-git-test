// Analyze match data and generate relationship/character insights

export function analyzeMatches(matches, targetPuuid) {
  if (!matches || matches.length === 0) return null

  const coPlayerMap = {}  // puuid -> { name, count, wins, champions, lastSeen }
  const dayMap = {}       // 'YYYY-MM-DD' -> Set of unique co-player puuids
  const champMap = {}     // champion name -> count
  const hourMap = Array(24).fill(0)  // play hour distribution
  let totalWins = 0
  let totalGames = matches.length

  for (const match of matches) {
    const info = match.info
    const ts = info.gameCreation
    const date = new Date(ts)
    const dayKey = date.toISOString().split('T')[0]
    const hour = date.getHours()
    hourMap[hour]++

    if (!dayMap[dayKey]) dayMap[dayKey] = new Set()

    const targetParticipant = info.participants.find(p => p.puuid === targetPuuid)
    if (!targetParticipant) continue

    if (targetParticipant.win) totalWins++
    const targetTeamId = targetParticipant.teamId

    const champName = targetParticipant.championName
    champMap[champName] = (champMap[champName] || 0) + 1

    // Teammates in same team
    const teammates = info.participants.filter(
      p => p.puuid !== targetPuuid && p.teamId === targetTeamId
    )

    for (const mate of teammates) {
      const puuid = mate.puuid
      const name = mate.summonerName || mate.riotIdGameName || '未知召唤师'
      dayMap[dayKey].add(puuid)

      if (!coPlayerMap[puuid]) {
        coPlayerMap[puuid] = {
          puuid,
          name,
          count: 0,
          wins: 0,
          champions: {},
          lastSeen: ts,
          profileIconId: mate.profileIcon || 0,
        }
      }
      coPlayerMap[puuid].count++
      if (targetParticipant.win) coPlayerMap[puuid].wins++
      if (ts > coPlayerMap[puuid].lastSeen) {
        coPlayerMap[puuid].lastSeen = ts
        coPlayerMap[puuid].name = name
      }
      const mateChamp = mate.championName
      coPlayerMap[puuid].champions[mateChamp] = (coPlayerMap[puuid].champions[mateChamp] || 0) + 1
    }
  }

  // Sort co-players by count
  const topCoPlayers = Object.values(coPlayerMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(p => ({
      ...p,
      winRate: p.count > 0 ? Math.round((p.wins / p.count) * 100) : 0,
      topChampion: Object.entries(p.champions).sort((a, b) => b[1] - a[1])[0]?.[0] || '未知',
      lastSeenDate: new Date(p.lastSeen).toLocaleDateString('zh-CN'),
    }))

  // Daily stats
  const dayKeys = Object.keys(dayMap).sort()
  const avgCoPlayersPerDay = dayKeys.length > 0
    ? dayKeys.reduce((sum, k) => sum + dayMap[k].size, 0) / dayKeys.length
    : 0

  const totalUniquePlayers = Object.keys(coPlayerMap).length

  // Top champions
  const topChampions = Object.entries(champMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, rate: Math.round((count / totalGames) * 100) }))

  // Peak hours
  const peakHour = hourMap.indexOf(Math.max(...hourMap))
  const isNightOwl = [22, 23, 0, 1, 2, 3].includes(peakHour)
  const isMorning = [6, 7, 8, 9, 10].includes(peakHour)

  // Compute scores (0-100)
  const scores = computeScores({
    topCoPlayers,
    totalUniquePlayers,
    totalGames,
    avgCoPlayersPerDay,
    isNightOwl,
    dayCount: dayKeys.length,
  })

  return {
    totalGames,
    totalWins,
    winRate: Math.round((totalWins / totalGames) * 100),
    totalUniquePlayers,
    avgCoPlayersPerDay: Math.round(avgCoPlayersPerDay * 10) / 10,
    topCoPlayers,
    topChampions,
    hourDistribution: hourMap,
    peakHour,
    isNightOwl,
    isMorning,
    activeDays: dayKeys.length,
    scores,
    personality: generatePersonality(scores, isNightOwl, topCoPlayers, totalUniquePlayers, totalGames),
  }
}

function computeScores({ topCoPlayers, totalUniquePlayers, totalGames, avgCoPlayersPerDay, isNightOwl, dayCount }) {
  // 专情指数: top partner concentration
  const topPartnerRate = topCoPlayers[0] ? topCoPlayers[0].count / totalGames : 0
  const loyaltyScore = Math.min(100, Math.round(topPartnerRate * 200))

  // 花心指数: diversity of co-players
  // High unique players per total games = more "花心"
  const diversityRatio = totalGames > 0 ? totalUniquePlayers / (totalGames * 4) : 0
  const playerScore = Math.min(100, Math.round(diversityRatio * 150))

  // 社交能量: avg co-players per day (max 4 teammates per game, multiple games)
  const socialScore = Math.min(100, Math.round(avgCoPlayersPerDay * 10))

  // 深夜玩家指数
  const nightScore = isNightOwl ? 75 : 25

  // 稳定性: plays with same top partners frequently
  const top3Rate = topCoPlayers.slice(0, 3).reduce((s, p) => s + p.count, 0) / Math.max(1, totalGames)
  const stabilityScore = Math.min(100, Math.round(top3Rate * 150))

  // 胜率buff: playing with top partner increases win rate?
  const topPartnerWinBoost = topCoPlayers[0]
    ? topCoPlayers[0].winRate - 50
    : 0
  const chemistryScore = Math.min(100, Math.max(0, 50 + topPartnerWinBoost))

  return {
    loyaltyScore,
    playerScore,
    socialScore,
    nightScore,
    stabilityScore,
    chemistryScore,
  }
}

function generatePersonality(scores, isNightOwl, topCoPlayers, totalUniquePlayers, totalGames) {
  const { loyaltyScore, playerScore, socialScore, stabilityScore } = scores

  // Determine personality archetype
  let archetype, archetypeDesc, warning, verdict

  if (loyaltyScore >= 60 && stabilityScore >= 50) {
    archetype = '忠诚型玩家'
    archetypeDesc = '有固定开黑搭档，游戏圈子稳定，不轻易换队友。'
    verdict = '✅ 在游戏中相当专情，很可能现实生活中也是如此。'
  } else if (playerScore >= 70 || (totalUniquePlayers > totalGames * 2.5)) {
    archetype = '社交达人'
    archetypeDesc = '认识的召唤师遍地都是，每天都在认识新朋友。'
    verdict = '⚠️ 游戏社交圈极广，喜欢接触不同的人，需要多加了解。'
  } else if (socialScore >= 60 && loyaltyScore < 40) {
    archetype = '随缘型玩家'
    archetypeDesc = '什么队友都能打，没有固定搭档，随遇而安。'
    verdict = '🔮 态度随意，感情上可能也比较随缘。'
  } else if (loyaltyScore >= 40 && socialScore < 30) {
    archetype = '内向型单排王'
    archetypeDesc = '喜欢独来独往，偶尔和固定的人开黑，不爱社交。'
    verdict = '💎 独立性强，感情中需要时间建立信任。'
  } else {
    archetype = '均衡发展型'
    archetypeDesc = '游戏习惯均衡，既有固定队友也接受随机匹配。'
    verdict = '😊 游戏行为均衡，是个比较正常的人。'
  }

  const nightLabel = isNightOwl ? '🦉 深夜狩猎者 — 常在凌晨活跃，注意作息时间是否匹配。' : null

  const topPartner = topCoPlayers[0]
  const partnerNote = topPartner
    ? `最常开黑的搭档是 "${topPartner.name}"，共游 ${topPartner.count} 场，胜率 ${topPartner.winRate}%。`
    : null

  // "花心指数" rating text
  let flirtRating
  if (playerScore < 20) flirtRating = { level: '专情钻石', emoji: '💎', color: 'text-sky-600' }
  else if (playerScore < 40) flirtRating = { level: '比较专一', emoji: '💙', color: 'text-cyan-600' }
  else if (playerScore < 60) flirtRating = { level: '适度社交', emoji: '💚', color: 'text-emerald-600' }
  else if (playerScore < 80) flirtRating = { level: '广泛社交', emoji: '🧡', color: 'text-orange-500' }
  else flirtRating = { level: '万人迷', emoji: '❤️‍🔥', color: 'text-rose-500' }

  return {
    archetype,
    archetypeDesc,
    verdict,
    nightLabel,
    partnerNote,
    flirtRating,
    tips: generateTips(scores, isNightOwl),
  }
}

function generateTips(scores, isNightOwl) {
  const tips = []
  if (scores.loyaltyScore >= 60) tips.push('💡 有长期游戏伙伴，说明重视稳定的人际关系。')
  if (scores.playerScore >= 70) tips.push('💡 游戏认识的人多，社交能力强，但需要判断感情的专一性。')
  if (scores.chemistryScore >= 70) tips.push('💡 和常开黑的搭档胜率高，默契度不错。')
  if (scores.nightScore >= 70) tips.push('💡 深夜活跃，生活作息需要进一步了解。')
  if (scores.socialScore < 20) tips.push('💡 每天开黑的人很少，偏向安静的游戏风格。')
  if (tips.length === 0) tips.push('💡 游戏数据均衡，综合表现正常。')
  return tips
}

// Generate mock data for demo/testing
export function generateMockData(summonerName) {
  const names = ['小甜心99', 'Faker', '蒙古大夫', '萝莉控', '午夜星辰', '可爱多多', '天道酬勤', '凌波微步']
  const champions = ['阿卡丽', '劫', '卡莎', '杰斯', '奥瑞利安索尔', '薇恩', '盲僧', '锐雯', '泰达米尔']

  const mockMatches = []
  const now = Date.now()
  const coPlayers = names.map((name, i) => ({
    puuid: `mock-puuid-${i}`,
    summonerName: name,
    riotIdGameName: name,
    teamId: 100,
    win: Math.random() > 0.4,
    championName: champions[Math.floor(Math.random() * champions.length)],
    profileIcon: 0,
  }))

  for (let i = 0; i < 40; i++) {
    const gameTime = now - (i * 3 * 3600 * 1000) - Math.random() * 2 * 3600 * 1000
    const win = Math.random() > 0.45
    const teamMates = []

    // Weighted: first co-player appears more often
    const numMates = 4
    for (let j = 0; j < numMates; j++) {
      const weights = [0.35, 0.2, 0.15, 0.1, 0.08, 0.05, 0.04, 0.03]
      const rand = Math.random()
      let cumulative = 0
      let playerIdx = names.length - 1
      for (let k = 0; k < weights.length; k++) {
        cumulative += weights[k]
        if (rand < cumulative) { playerIdx = k; break }
      }
      const cp = coPlayers[playerIdx % coPlayers.length]
      teamMates.push({ ...cp, win })
    }

    mockMatches.push({
      info: {
        gameCreation: gameTime,
        gameDuration: 1800 + Math.random() * 1200,
        participants: [
          {
            puuid: 'target-puuid',
            summonerName: summonerName,
            riotIdGameName: summonerName,
            teamId: 100,
            win,
            championName: champions[i % champions.length],
          },
          ...teamMates,
          ...Array(5).fill(null).map((_, k) => ({
            puuid: `enemy-${i}-${k}`,
            summonerName: `对手${k + 1}`,
            teamId: 200,
            win: !win,
            championName: champions[(i + k) % champions.length],
          }))
        ]
      }
    })
  }

  return mockMatches
}
