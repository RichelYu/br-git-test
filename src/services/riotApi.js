// Platform routing map
const PLATFORM_TO_REGION = {
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas',
  kr: 'asia', jp1: 'asia',
  eun1: 'europe', euw1: 'europe', tr1: 'europe', ru: 'europe',
  oc1: 'sea', ph2: 'sea', sg2: 'sea', th2: 'sea', tw2: 'sea', vn2: 'sea',
}

// 国服 (cn) 由腾讯运营，不在 Riot 公共 API 覆盖范围，仅支持演示模式。
// 其余为 Riot 直营服，可用官方 API 真实查询。
const PLATFORM_LABELS = {
  cn: '🇨🇳 国服 (腾讯 · 仅演示)',
  kr: '🇰🇷 韩服 (KR)',
  jp1: '🇯🇵 日服 (JP)',
  tw2: '🇹🇼 台服 (TW)',
  na1: '🇺🇸 美服 (NA)',
  euw1: '🇪🇺 欧服西 (EUW)',
  eun1: '🇪🇺 欧服东 (EUNE)',
  oc1: '🇦🇺 大洋洲 (OCE)',
}

// 仅支持演示模式（无 Riot 官方 API）的服务器
const DEMO_ONLY_PLATFORMS = ['cn']

function getPlatformHost(platform) {
  return `https://${platform}.api.riotgames.com`
}

function getRegionHost(platform) {
  const region = PLATFORM_TO_REGION[platform] || 'americas'
  return `https://${region}.api.riotgames.com`
}

async function riotFetch(url, apiKey) {
  const res = await fetch(url, {
    headers: { 'X-Riot-Token': apiKey }
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.status?.message || res.statusText
    throw new Error(`API错误 ${res.status}: ${msg}`)
  }
  return res.json()
}

export async function getSummonerByName(summonerName, platform, apiKey) {
  const host = getPlatformHost(platform)
  const encoded = encodeURIComponent(summonerName)
  return riotFetch(`${host}/lol/summoner/v4/summoners/by-name/${encoded}`, apiKey)
}

export async function getMatchIds(puuid, platform, apiKey, count = 50) {
  const host = getRegionHost(platform)
  return riotFetch(
    `${host}/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}&type=ranked`,
    apiKey
  )
}

export async function getMatch(matchId, platform, apiKey) {
  const host = getRegionHost(platform)
  return riotFetch(`${host}/lol/match/v5/matches/${matchId}`, apiKey)
}

export async function getLeagueEntries(summonerId, platform, apiKey) {
  const host = getPlatformHost(platform)
  return riotFetch(`${host}/lol/league/v4/entries/by-summoner/${summonerId}`, apiKey)
}

export { PLATFORM_LABELS, PLATFORM_TO_REGION, DEMO_ONLY_PLATFORMS }
