'use strict'

const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const lcu = require('./lcu.cjs')

// 开发模式下可通过环境变量指向 vite dev server
const DEV_URL = process.env.ELECTRON_START_URL

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 860,
    minWidth: 420,
    backgroundColor: '#FFF4F8',
    title: '心动雷达 · 桌面版',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (DEV_URL) {
    win.loadURL(DEV_URL)
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// IPC：连接状态检测
ipcMain.handle('lcu:status', async () => {
  return lcu.status()
})

// IPC：查询国服战绩（name 为空则查当前登录召唤师）
ipcMain.handle('lcu:analyze', async (_event, name) => {
  try {
    const result = await lcu.analyze(name, 50)
    return { ok: true, ...result }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
