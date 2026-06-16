// 桥接 Electron 桌面版暴露的 window.lcu 能力。
// 网页版（无 window.lcu）时 isDesktop 为 false，国服仍走演示模式。

export const isDesktop = typeof window !== 'undefined' && !!window.lcu

export async function getClientStatus() {
  if (!isDesktop) return { connected: false, error: '当前为网页版，无法连接客户端' }
  return window.lcu.status()
}

/**
 * 通过本地客户端查询国服战绩。
 * @param {string} name 召唤师名称（留空则查询当前登录召唤师）
 * @returns {{ summoner, matches }}
 */
export async function analyzeWithClient(name) {
  if (!isDesktop) throw new Error('当前为网页版，无法连接客户端查询国服')
  const res = await window.lcu.analyze(name)
  if (!res || !res.ok) {
    throw new Error(res?.error || '客户端查询失败')
  }
  return { summoner: res.summoner, matches: res.matches }
}
