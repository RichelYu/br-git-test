# 心动雷达 · 英雄联盟关系分析

通过英雄联盟战绩数据，分析召唤师的开黑习惯、社交圈子与游戏性格（专情指数 / 老色批指数 / 社交能量 / 关系稳定性 / 默契度 / 深夜系数）。

提供 **网页版** 与 **Windows 桌面版** 两种形态：

| 形态 | 外服（韩/日/台/美/欧） | 国服（腾讯） |
|------|:---:|:---:|
| 🌐 网页版 | ✅ Riot 官方 API 真实查询 | 🟡 仅演示数据 |
| 🖥️ 桌面版 | ✅ Riot 官方 API 真实查询 | ✅ **连接本地客户端实测** |

---

## 技术栈

React 18 + Vite + Tailwind CSS + Recharts；桌面版用 Electron 封装。

## 网页版

```bash
npm install
npm run dev      # 开发：http://localhost:3000
npm run build    # 构建到 dist/
```

- **外服**：在 `developer.riotgames.com` 领取免费 API Key（开发 Key 每 24h 过期；个人/生产 Key 长期有效）即可真实查询。
- **国服**：网页沙箱无法读取客户端，国服仅演示模式。

> ⚠️ 网页直连 Riot API 存在 CORS 限制，正式部署需要一个轻量代理（待办）。

## 桌面版（查国服真实战绩）

```bash
npm install
npm run electron:dev     # 开发：自动起 vite + electron
npm run electron:build   # 打包 Windows 安装包到 release/
```

### 国服查询原理（LCU API）

英雄联盟客户端启动后，会在本机开一个 HTTPS 服务（LCU，League Client Update API），
这是 Riot 提供给客户端自身的官方接口。桌面版的做法：

1. **读取连接凭证**：解析正在运行的 `LeagueClientUx` 进程命令行里的
   `--app-port` 与 `--remoting-auth-token`；失败则回退读取安装目录下的 `lockfile`
   （格式 `name:pid:port:password:protocol`）。
2. **请求本地服务**：以 Basic Auth（用户名固定 `riot`，密码为上一步的 token）
   请求 `https://127.0.0.1:{port}/...`（自签名证书，需忽略 TLS 校验）。
3. **拉取数据**：
   - `/lol-summoner/v1/current-summoner` 当前召唤师
   - `/lol-match-history/v1/products/lol/{puuid}/matches` 战绩列表
   - `/lol-game-data/assets/v1/champion-summary.json` 英雄 ID→名称
4. **格式转换**：把 LCU 对局结构转成与 Riot Match-V5 一致的形状，复用同一套分析逻辑。

因为数据来自**本机客户端本地服务**，所以国服 / 腾讯服也能读取，无需 Riot 公共 API。
这套接口不读写内存、不修改游戏文件，相对合规（参考开源工具 Seraphine 同款原理），
但 Riot/腾讯未公开承诺第三方使用，**请自行评估账号风险**。

### 相关文件

```
electron/
  main.cjs      Electron 主进程 + IPC（lcu:status / lcu:analyze）
  preload.cjs   contextBridge 暴露 window.lcu
  lcu.cjs       LCU 连接器：凭证发现 / 请求 / 战绩转换
src/services/
  lcuClient.js  渲染进程侧的 window.lcu 封装
  riotApi.js    外服 Riot 官方 API
  analyzer.js   战绩分析与性格评分（两端共用）
```

### 已验证 / 待验证

- ✅ Electron 外壳启动、加载页面、`window.lcu` 注入、无客户端时优雅报错——已通过自动化冒烟测试。
- ⏳ **真实 LCU 数据拉取需在装有国服客户端的 Windows 上实测**。开发环境无客户端，
  `lcu.cjs` 中的安装路径候选、按名查询、对局字段（国服 puuid 可能为空，已用名称兜底）
  可能需要按实际返回微调。

---

## 免责声明

本工具仅供娱乐，所有分析基于游戏数据，不代表真实人际关系判断。请遵守 Riot Games / 腾讯的使用条款。
