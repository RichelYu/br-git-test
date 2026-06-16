'use strict'

// LCU (League Client Update) API 连接器
// 原理：LoL 客户端启动后会在本机开一个 HTTPS 服务，端口与密码写在
// 安装目录的 lockfile，或作为命令行参数传给 LeagueClientUx 进程。
// 拿到 端口 + 密码 后，以 Basic Auth（用户名固定 "riot"）请求
// https://127.0.0.1:{port}/... 即可读取国服等任意区服的客户端本地数据。

const fs = require('fs')
const path = require('path')
const https = require('https')
const { execSync } = require('child_process')

/**
 * 获取 LCU 连接凭证 { port, token }
 * 策略 1：解析正在运行的 LeagueClientUx 进程命令行参数（最可靠）
 * 策略 2：读取安装目录下的 lockfile
 */
function getCredentials() {
  // 策略 1：进程命令行
  const fromProc = credsFromProcess()
  if (fromProc) return fromProc

  // 策略 2：lockfile
  const fromLock = credsFromLockfile()
  if (fromLock) return fromLock

  throw new Error('未检测到英雄联盟客户端，请先启动并登录客户端后重试。')
}

function credsFromProcess() {
  try {
    let cmdline = ''
    if (process.platform === 'win32') {
      // 优先用 PowerShell（wmic 在新版 Windows 已被移除）
      try {
        cmdline = execSync(
          'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \\"name=\'LeagueClientUx.exe\'\\" | Select-Object -ExpandProperty CommandLine"',
          { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        )
      } catch {
        cmdline = execSync('wmic PROCESS WHERE "name=\'LeagueClientUx.exe\'" GET CommandLine', {
          encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
        })
      }
    } else if (process.platform === 'darwin') {
      cmdline = execSync("ps -A -o args | grep 'LeagueClientUx' | grep -v grep", {
        encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      })
    }

    const portMatch = cmdline.match(/--app-port=(\d+)/)
    const tokenMatch = cmdline.match(/--remoting-auth-token=([\w-]+)/)
    if (portMatch && tokenMatch) {
      return { port: portMatch[1], token: tokenMatch[1], source: 'process' }
    }
  } catch {
    /* 进程不存在或权限不足，落到 lockfile 策略 */
  }
  return null
}

function credsFromLockfile() {
  const candidates = []
  if (process.platform === 'win32') {
    candidates.push(
      'C:\\Riot Games\\League of Legends\\lockfile',
      'D:\\Riot Games\\League of Legends\\lockfile',
      'C:\\Program Files\\Riot Games\\League of Legends\\lockfile',
      'C:\\Program Files (x86)\\Riot Games\\League of Legends\\lockfile',
      // 国服腾讯安装路径常见位置
      'C:\\Riot Games\\英雄联盟\\LeagueClient\\lockfile',
      'D:\\WeGameApps\\英雄联盟\\LeagueClient\\lockfile',
      'D:\\Program Files\\WeGame\\英雄联盟\\LeagueClient\\lockfile',
    )
  } else if (process.platform === 'darwin') {
    candidates.push('/Applications/League of Legends.app/Contents/LoL/lockfile')
  }

  for (const file of candidates) {
    try {
      if (fs.existsSync(file)) {
        const raw = fs.readFileSync(file, 'utf8')
        // 格式: name:pid:port:password:protocol
        const parts = raw.split(':')
        if (parts.length >= 5) {
          return { port: parts[2], token: parts[3], source: 'lockfile', path: file }
        }
      }
    } catch {
      /* 继续尝试下一个路径 */
    }
  }
  return null
}

/** 发起一次 LCU 请求（忽略自签名证书） */
function lcuRequest(creds, apiPath) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`riot:${creds.token}`).toString('base64')
    const req = https.request(
      {
        host: '127.0.0.1',
        port: creds.port,
        path: apiPath,
        method: 'GET',
        rejectUnauthorized: false, // LCU 使用自签名证书
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: 'application/json',
        },
      },
      (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body))
            } catch {
              resolve(body)
            }
          } else {
            reject(new Error(`LCU ${res.statusCode}: ${apiPath}`))
          }
        })
      }
    )
    req.on('error', reject)
    req.setTimeout(8000, () => req.destroy(new Error('LCU 请求超时')))
    req.end()
  })
}

let championMapCache = null
async function getChampionMap(creds) {
  if (championMapCache) return championMapCache
  try {
    const list = await lcuRequest(creds, '/lol-game-data/assets/v1/champion-summary.json')
    const map = {}
    for (const c of list) map[c.id] = c.name
    championMapCache = map
    return map
  } catch {
    return {}
  }
}

/** 当前登录的召唤师 */
async function getCurrentSummoner(creds) {
  return lcuRequest(creds, '/lol-summoner/v1/current-summoner')
}

/** 按名称查询召唤师（用于查别人；查不到则回退当前召唤师） */
async function getSummonerByName(creds, name) {
  if (!name || !name.trim()) return getCurrentSummoner(creds)
  try {
    const encoded = encodeURIComponent(name.trim())
    return await lcuRequest(creds, `/lol-summoner/v1/summoners?name=${encoded}`)
  } catch {
    // 国服部分版本不支持按名直查，回退到当前召唤师
    return getCurrentSummoner(creds)
  }
}

/** 拉取战绩列表（最多约 count 场） */
async function getMatchHistory(creds, puuid, count = 50) {
  const end = Math.max(0, count - 1)
  const data = await lcuRequest(
    creds,
    `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=0&endIndex=${end}`
  )
  return data?.games?.games || []
}

/** 把 LCU 的对局格式转换成分析器期望的 Match-V5 风格 */
function transformGames(games, champMap) {
  return games.map((game) => {
    const identByPid = {}
    for (const ident of game.participantIdentities || []) {
      identByPid[ident.participantId] = ident.player || {}
    }
    return {
      info: {
        gameCreation: game.gameCreation,
        gameDuration: game.gameDuration,
        queueId: game.queueId,
        participants: (game.participants || []).map((p) => {
          const player = identByPid[p.participantId] || {}
          const name = player.gameName || player.summonerName || '未知召唤师'
          return {
            // 国服部分对局 puuid 可能为空，用名称兜底以便分组统计
            puuid: player.puuid || `name:${name}`,
            summonerName: name,
            riotIdGameName: player.gameName,
            teamId: p.teamId,
            win: p.stats ? p.stats.win : p.win,
            championName: champMap[p.championId] || `英雄${p.championId}`,
          }
        }),
      },
    }
  })
}

/**
 * 一站式：连接客户端 → 查召唤师 → 拉战绩 → 转换格式
 * @returns { summoner, matches }
 */
async function analyze(name, count = 50) {
  const creds = getCredentials()
  const champMap = await getChampionMap(creds)
  const summoner = await getSummonerByName(creds, name)

  const puuid = summoner.puuid
  if (!puuid) throw new Error('无法获取召唤师 puuid，请确认客户端已完全登录。')

  const games = await getMatchHistory(creds, puuid, count)
  if (!games.length) throw new Error('未查询到该召唤师的对局记录。')

  const matches = transformGames(games, champMap)
  return {
    summoner: {
      name: summoner.gameName || summoner.displayName || name || '召唤师',
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
      puuid,
    },
    matches,
  }
}

/** 仅检测连接状态 */
async function status() {
  try {
    const creds = getCredentials()
    const summoner = await getCurrentSummoner(creds)
    return {
      connected: true,
      source: creds.source,
      summoner: {
        name: summoner.gameName || summoner.displayName,
        summonerLevel: summoner.summonerLevel,
      },
    }
  } catch (e) {
    return { connected: false, error: e.message }
  }
}

module.exports = { analyze, status, getCredentials }
