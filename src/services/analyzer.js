// Analyze match data and generate relationship/character insights

// 队列 ID → 模式
export const QUEUE_LABELS = { solo: '单双排', flex: '灵活组排', aram: '大乱斗', other: '其它模式' }
function queueBucket(qid) {
  if (qid === 420) return 'solo'
  if (qid === 440) return 'flex'
  if (qid === 450) return 'aram'
  return 'other'
}

export function analyzeMatches(matches, targetPuuid, options = {}) {
  if (!matches || matches.length === 0) return null
  const targetGender = options.targetGender || null

  const coPlayerMap = {}  // puuid -> { name, count, wins, champions, lastSeen, gender }
  const dayMap = {}       // 'YYYY-MM-DD' -> Set of unique co-player puuids
  const champMap = {}     // champion name -> count
  const hourMap = Array(24).fill(0)  // play hour distribution
  const modeStats = {
    solo: { count: 0, wins: 0 },
    flex: { count: 0, wins: 0 },
    aram: { count: 0, wins: 0 },
    other: { count: 0, wins: 0 },
  }
  let oppositeCount = 0, sameCount = 0, genderedMates = 0
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

    // 模式统计
    const bucket = queueBucket(info.queueId)
    modeStats[bucket].count++
    if (targetParticipant.win) modeStats[bucket].wins++

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

      // 性别聚合（仅当目标与队友均有性别信息时）
      if (targetGender && mate.gender) {
        genderedMates++
        if (mate.gender === targetGender) sameCount++
        else oppositeCount++
      }

      if (!coPlayerMap[puuid]) {
        coPlayerMap[puuid] = {
          puuid, name, count: 0, wins: 0, champions: {},
          lastSeen: ts, profileIconId: mate.profileIcon || 0,
          gender: mate.gender || null,
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

  const topCoPlayers = Object.values(coPlayerMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(p => ({
      ...p,
      winRate: p.count > 0 ? Math.round((p.wins / p.count) * 100) : 0,
      topChampion: Object.entries(p.champions).sort((a, b) => b[1] - a[1])[0]?.[0] || '未知',
      lastSeenDate: new Date(p.lastSeen).toLocaleDateString('zh-CN'),
    }))

  const dayKeys = Object.keys(dayMap).sort()
  const avgCoPlayersPerDay = dayKeys.length > 0
    ? dayKeys.reduce((sum, k) => sum + dayMap[k].size, 0) / dayKeys.length
    : 0

  const totalUniquePlayers = Object.keys(coPlayerMap).length

  const topChampions = Object.entries(champMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count, rate: Math.round((count / totalGames) * 100) }))

  const peakHour = hourMap.indexOf(Math.max(...hourMap))
  const isNightOwl = [22, 23, 0, 1, 2, 3].includes(peakHour)
  const isMorning = [6, 7, 8, 9, 10].includes(peakHour)

  // 模式占比
  for (const k of Object.keys(modeStats)) {
    modeStats[k].rate = Math.round((modeStats[k].count / totalGames) * 100)
    modeStats[k].winRate = modeStats[k].count > 0
      ? Math.round((modeStats[k].wins / modeStats[k].count) * 100) : 0
  }
  const dominantMode = Object.entries(modeStats)
    .sort((a, b) => b[1].count - a[1].count)[0][0]

  // 性别聚合结果
  const hasGenderData = !!targetGender && genderedMates > 0
  const genderStats = hasGenderData ? {
    targetGender,
    oppositeCount, sameCount,
    oppositeRatio: oppositeCount / Math.max(1, oppositeCount + sameCount),
    sameRatio: sameCount / Math.max(1, oppositeCount + sameCount),
  } : { targetGender, hasGenderData: false }

  const top3Rate = topCoPlayers.slice(0, 3).reduce((s, p) => s + p.count, 0) / Math.max(1, totalGames)

  const scores = computeScores({
    topCoPlayers, totalUniquePlayers, totalGames, avgCoPlayersPerDay,
    isNightOwl, modeStats, top3Rate, genderStats, hasGenderData,
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
    modeStats,
    dominantMode,
    genderStats,
    hasGenderData,
    scores,
    personality: generatePersonality({
      scores, isNightOwl, topCoPlayers, totalUniquePlayers, totalGames,
      modeStats, dominantMode, genderStats, hasGenderData,
    }),
  }
}

function computeScores({ topCoPlayers, totalUniquePlayers, totalGames, avgCoPlayersPerDay, isNightOwl, modeStats, top3Rate, genderStats, hasGenderData }) {
  const topPartnerRate = topCoPlayers[0] ? topCoPlayers[0].count / totalGames : 0
  const loyaltyScore = Math.min(100, Math.round(topPartnerRate * 200))

  const diversityRatio = totalGames > 0 ? totalUniquePlayers / (totalGames * 4) : 0
  const playerScore = Math.min(100, Math.round(diversityRatio * 150))

  const socialScore = Math.min(100, Math.round(avgCoPlayersPerDay * 10))
  const nightScore = isNightOwl ? 75 : 25
  const stabilityScore = Math.min(100, Math.round(top3Rate * 150))

  const topPartnerWinBoost = topCoPlayers[0] ? topCoPlayers[0].winRate - 50 : 0
  const chemistryScore = Math.min(100, Math.max(0, 50 + topPartnerWinBoost))

  // —— 模式人格指标 ——
  const soloRate = modeStats.solo.rate / 100
  const flexRate = modeStats.flex.rate / 100
  const aramRate = modeStats.aram.rate / 100

  // 情感绝缘体: 单双排独自上分 × 没有固定队友
  const insulatorScore = Math.min(100, Math.round(soloRate * (1 - top3Rate) * 140))
  // 峡谷养老院: 大乱斗占比
  const aramSeniorScore = Math.min(100, Math.round(aramRate * 130))
  // 群居动物: 灵活组排（必须组队）占比
  const herdScore = Math.min(100, Math.round(flexRate * 160))

  // —— 性别衍生指标（需性别数据）——
  const seaKingScore = hasGenderData ? Math.min(100, Math.round(genderStats.oppositeRatio * 100)) : 0
  const sameSexScore = hasGenderData ? Math.min(100, Math.round(genderStats.sameRatio * 100)) : 0

  return {
    loyaltyScore, playerScore, socialScore, nightScore, stabilityScore, chemistryScore,
    insulatorScore, aramSeniorScore, herdScore, seaKingScore, sameSexScore,
  }
}

function generatePersonality({ scores, isNightOwl, topCoPlayers, totalUniquePlayers, totalGames, dominantMode, genderStats, hasGenderData }) {
  const { loyaltyScore, playerScore, socialScore, stabilityScore } = scores

  let archetype, archetypeDesc, verdict
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

  let flirtRating
  if (playerScore < 20) flirtRating = { level: '专情钻石', emoji: '💎', color: 'text-sky-600' }
  else if (playerScore < 40) flirtRating = { level: '比较专一', emoji: '💙', color: 'text-cyan-600' }
  else if (playerScore < 60) flirtRating = { level: '适度社交', emoji: '💚', color: 'text-emerald-600' }
  else if (playerScore < 80) flirtRating = { level: '广泛社交', emoji: '🧡', color: 'text-orange-500' }
  else flirtRating = { level: '万人迷', emoji: '❤️‍🔥', color: 'text-rose-500' }

  // —— 模式人格称号（犀利 + 抽象）——
  const modeTitle = buildModeTitle(dominantMode, scores)

  // —— 海王浓度评级 ——
  let seaKingRating = null
  if (hasGenderData) {
    const r = genderStats.oppositeRatio
    if (r < 0.15) seaKingRating = { level: '同性修道院', emoji: '⛪', color: 'text-slate-500' }
    else if (r < 0.35) seaKingRating = { level: '偶遇异性', emoji: '🍃', color: 'text-emerald-600' }
    else if (r < 0.55) seaKingRating = { level: '雨露均沾', emoji: '🌊', color: 'text-sky-600' }
    else if (r < 0.75) seaKingRating = { level: '异性磁场', emoji: '🧲', color: 'text-orange-500' }
    else seaKingRating = { level: '深海王座', emoji: '🔱', color: 'text-rose-500' }
  }

  return {
    archetype, archetypeDesc, verdict, nightLabel, partnerNote, flirtRating,
    modeTitle, seaKingRating,
    tips: generateTips(scores, isNightOwl, hasGenderData),
  }
}

function buildModeTitle(dominantMode, scores) {
  if (scores.insulatorScore >= 55 || (dominantMode === 'solo' && scores.herdScore < 30)) {
    return {
      name: '情感绝缘体',
      emoji: '🧊',
      desc: '单双排独自上分、拒绝开黑——感情世界大概也是钢筋水泥浇筑的绝缘体，生人勿近、亲密绝缘。',
    }
  }
  if (dominantMode === 'aram') {
    return {
      name: '峡谷老年人',
      emoji: '🦥',
      desc: '大乱斗养生局常客，上分？不存在的。峡谷养老院金牌会员，佛系摆烂、随遇而安。',
    }
  }
  if (dominantMode === 'flex' || scores.herdScore >= 55) {
    return {
      name: '群居刚需怪',
      emoji: '🐑',
      desc: '灵活组排离了队友就魂不守舍，独自一人浑身难受——主打一个抱团取暖、群居成瘾。',
    }
  }
  return {
    name: '混沌中立体',
    emoji: '🌀',
    desc: '单双、灵活、大乱斗雨露均沾，捉摸不定——是个让人猜不透的薛定谔玩家。',
  }
}

function generateTips(scores, isNightOwl, hasGenderData) {
  const tips = []
  if (scores.insulatorScore >= 55) tips.push('🧊 高浓度独狼上分，亲密关系绝缘，慎入。')
  if (scores.aramSeniorScore >= 55) tips.push('🦥 大乱斗养生选手，胜负心淡薄、佛系一片。')
  if (scores.herdScore >= 55) tips.push('🐑 离不开队友的群居动物，社交需求旺盛。')
  if (hasGenderData && scores.seaKingScore >= 60) tips.push('🔱 异性队友浓度爆表，海王预警，建议查岗。')
  if (hasGenderData && scores.sameSexScore >= 80) tips.push('⛪ 清一色同性队友，异性绝缘体本缘。')
  if (scores.loyaltyScore >= 60) tips.push('💡 有长期游戏伙伴，重视稳定关系。')
  if (scores.nightScore >= 70) tips.push('🌙 深夜活跃，作息需进一步了解。')
  if (tips.length === 0) tips.push('💡 游戏数据均衡，综合表现正常。')
  return tips
}

// ——————————————————— 演示数据 ———————————————————
const QUEUE_IDS = { solo: 420, flex: 440, aram: 450 }

export function generateMockData(summonerName, targetGender) {
  const roster = [
    { n: '小甜心99', g: 'female' },
    { n: '奶茶三分糖', g: 'female' },
    { n: '蒙面大侠客', g: 'male' },
    { n: '午夜玫瑰', g: 'female' },
    { n: '王者峡谷一哥', g: 'male' },
    { n: '柔弱小书生', g: 'male' },
    { n: '清纯学妹', g: 'female' },
    { n: '钢铁直男', g: 'male' },
  ]
  const champions = ['阿卡丽', '劫', '卡莎', '杰斯', '奥瑞利安索尔', '薇恩', '盲僧', '锐雯', '泰达米尔']
  const gender = targetGender || (Math.random() > 0.5 ? 'male' : 'female')

  const coPlayers = roster.map((r, i) => ({
    puuid: `mock-puuid-${i}`,
    summonerName: r.n,
    riotIdGameName: r.n,
    teamId: 100,
    championName: champions[Math.floor(Math.random() * champions.length)],
    gender: r.g,
    profileIcon: 0,
  }))

  // 模式权重：单双 45% / 大乱斗 30% / 灵活 25%
  const pickQueue = () => {
    const r = Math.random()
    if (r < 0.45) return QUEUE_IDS.solo
    if (r < 0.70) return QUEUE_IDS.aram
    return QUEUE_IDS.flex
  }

  const mockMatches = []
  const now = Date.now()
  for (let i = 0; i < 40; i++) {
    const gameTime = now - (i * 3 * 3600 * 1000) - Math.random() * 2 * 3600 * 1000
    const win = Math.random() > 0.45
    const queueId = pickQueue()
    const teamMates = []
    const numMates = 4
    for (let j = 0; j < numMates; j++) {
      const weights = [0.3, 0.2, 0.15, 0.1, 0.1, 0.06, 0.05, 0.04]
      const rand = Math.random()
      let cumulative = 0
      let playerIdx = roster.length - 1
      for (let k = 0; k < weights.length; k++) {
        cumulative += weights[k]
        if (rand < cumulative) { playerIdx = k; break }
      }
      teamMates.push({ ...coPlayers[playerIdx % coPlayers.length], win })
    }

    mockMatches.push({
      info: {
        gameCreation: gameTime,
        gameDuration: 1800 + Math.random() * 1200,
        queueId,
        participants: [
          {
            puuid: 'target-puuid',
            summonerName, riotIdGameName: summonerName,
            teamId: 100, win, gender,
            championName: champions[i % champions.length],
          },
          ...teamMates,
          ...Array(5).fill(null).map((_, k) => ({
            puuid: `enemy-${i}-${k}`,
            summonerName: `对手${k + 1}`,
            teamId: 200, win: !win,
            championName: champions[(i + k) % champions.length],
          }))
        ]
      }
    })
  }

  return mockMatches
}
