// Platform routing map
const PLATFORM_TO_REGION = {
  na1: 'americas', br1: 'americas', la1: 'americas', la2: 'americas',
  kr: 'asia', jp1: 'asia',
  eun1: 'europe', euw1: 'europe', tr1: 'europe', ru: 'europe',
  oc1: 'sea', ph2: 'sea', sg2: 'sea', th2: 'sea', tw2: 'sea', vn2: 'sea',
}

const PLATFORM_LABELS = {
  na1: '北美 (NA)', br1: '巴西 (BR)', la1: '拉美北 (LAN)', la2: '拉美南 (LAS)',
  kr: '韩国 (KR)', jp1: '日本 (JP)',
  eun1: '欧洲北欧 (EUNE)', euw1: '欧洲西部 (EUW)', tr1: '土耳其 (TR)', ru: '俄罗斯 (RU)',
  oc1: '大洋洲 (OCE)',
}

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

export { PLATFORM_LABELS, PLATFORM_TO_REGION }
