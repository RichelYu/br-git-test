'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// 向渲染进程（网页）暴露受控的桌面能力
contextBridge.exposeInMainWorld('lcu', {
  isDesktop: true,
  // 检测客户端连接状态 → { connected, summoner? , error? }
  status: () => ipcRenderer.invoke('lcu:status'),
  // 查询国服战绩 → { ok, summoner, matches } | { ok:false, error }
  analyze: (name) => ipcRenderer.invoke('lcu:analyze', name),
})
