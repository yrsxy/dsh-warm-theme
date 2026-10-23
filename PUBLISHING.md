# 发布清单 / Publishing checklist

目标：让 `dsh-warm-theme` 出现在 **DSH 插件市场** 与 **awesome-dsh-plugin** 列表里，并能在 macOS 与 Windows 上通过一条命令安装。

---

## 三条发布通道（互相独立，但索引依赖 npm）

| 通道 | 作用 | 前提 |
|---|---|---|
| **npm** | `dsh plugin add dsh-warm-theme` 秒装；**市场索引只收录 npm 上有的包** | npm 账号 |
| **GitHub** | 源码托管；市场卡片的图标、截图只能从 GitHub raw 拉取；列表收录的唯一入口 | 仓库 + topic |
| **awesome-dsh-plugin PR** | 把条目写进市场数据源 | 仓库满 1 天 |

> ⚠️ **顺序很重要**：市场索引（`dsh-plugin-catalog`）从 npm 读取已发布的版本。
> 只推 GitHub 不发 npm，插件在「插件市场 → 发现」里搜不到，只能靠 README 里的命令手动装。
> 所以 **先 npm，再 PR**。

---

## 0. 前置（已完成）

- [x] `package.json` 声明 `dsh.bundle.patch` → `./cordis.patch.yml`（市场收录的硬性要求，只有 `dsh.client` 会被拒）
- [x] `cordis.patch.yml` 放在包根
- [x] `package.json` 去掉 `private: true`，补 `license` / `author` / `repository` / `homepage` / `bugs` / `keywords` / `engines`
- [x] `LICENSE`（MIT © 2026 yrsxy）
- [x] `assets/icon-180.png`（180×180 位图，市场卡片用；SVG 不收）
- [x] `npm pack --dry-run` 通过：10 个文件、23.9 kB
- [x] 冒烟测试全通过（含 400 组对比度、侧栏双锚点断言）

---

## 1. npm 发布

### 1.1 修一下 npm 缓存权限（一次性）

本机 `~/.npm` 里有 root 所有的文件，会导致 `npm publish` 直接 EPERM：

```sh
sudo chown -R $(id -u):$(id -g) ~/.npm
```

不想动权限的话，每次发布都能用干净缓存绕开：

```sh
npm publish --cache /tmp/npmcache-wt
```

### 1.2 注册 npm 账号（需要你自己操作）

1. 打开 https://www.npmjs.com/signup 注册（建议用户名就用 `yrsxy`）
2. 邮箱收验证邮件并点确认
3. **开启 2FA**（现在 npm 强制要求发布时二次验证，不开会卡住）

### 1.3 登录并发布

```sh
cd /Users/yangrenshun/Desktop/code/diy/dsh-warm-theme
npm login                    # 浏览器会弹出授权页，点 Approve
npm whoami                   # 确认登录成功
npm publish --access public  # prepublishOnly 会自动重新 build + 跑测试
```

发布成功后验证：

```sh
npm view dsh-warm-theme version   # 应输出 0.2.0
```

---

## 2. GitHub 仓库

### 2.1 网络：Watt Toolkit 能用，Clash 会打架

Watt Toolkit 的「本地加速」不是代理，而是往 `/etc/hosts` 写了 48 条映射，把
`github.com` / `api.github.com` / `raw.githubusercontent.com` 全部指向 `127.0.0.1`，
再由它在本机 443 端口跑一个反向代理，用自签 CA（`CN = SteamTools Certificate`）做 TLS 终结。

这里有两个后果，踩过一次：

**① 浏览器能开 ≠ 命令行能连。**
浏览器信任系统钥匙串里的这张 CA，所以网页正常；但 `curl` 用自己打包的 CA bundle，
会直接报 `SSL certificate problem: unable to get local issuer certificate`，退出码 000 ——
**看起来像"网络不通"，其实是证书不信任**。`git` 走系统钥匙串，所以 git 一直能连。

修法是把根证书导出来喂给 curl：

```sh
security find-certificate -c "SteamTools Certificate" -p /Library/Keychains/System.keychain \
  > ~/steamtools.pem
curl --cacert ~/steamtools.pem https://api.github.com
```

> 同理，任何基于 curl 的工具（`npm`、`gh`、各种安装脚本）在 Watt Toolkit 下都可能被这条绊住。

**② Clash 和 Watt Toolkit 同时开 = 互相废掉。**
Clash 在系统代理模式下，应用程序把**域名**交给代理，由代理端做远程 DNS 解析 ——
`/etc/hosts` 不参与，Watt Toolkit 那 48 条映射形同虚设，等于绕过加速器直接走代理节点连 GitHub。
节点不稳就表现为"用了 Clash 反而进不去"。

**结论：两个只能开一个。** 走 GitHub 时用 Watt Toolkit，别开系统代理。

### 2.2 推送

> 当前环境 GitHub 可达（git 已实测 `ls-remote` 成功），但**没有推送凭据**：
> 未配置 credential helper、无 SSH key，`~/.ssh` 受沙箱保护写不进去。
> 推送前需要先配一个 PAT 或 SSH key。

```sh
cd /Users/yangrenshun/Desktop/code/diy/dsh-warm-theme

git add -A
git commit -m "feat: 0.2.0 — 双平台适配、市场元数据、发布用图标"

# 先在网页端建空仓库 https://github.com/new（不要勾 README / .gitignore）
git remote add origin https://github.com/yrsxy/dsh-warm-theme.git
git branch -M main
git push -u origin main
```

### 建完后必做两件事

1. **加 topic**：仓库页 → 右上齿轮 → Topics 填 `dsh-plugin`、`deepseek-harness`、`theme`
   （`dsh-plugin` 这个 topic 是列表与搜索引擎发现你的主要方式）
2. **确认 About 里的 description 与实际功能一致** —— 评审会核对

---

## 3. 提交到 awesome-dsh-plugin

### 3.1 准备（本仓库已备好）

条目文件已生成：`market/yrsxy__dsh-warm-theme.yml`

```yaml
url: https://github.com/yrsxy/dsh-warm-theme
name: yrsxy/dsh-warm-theme
category: theme
description:
  en: Five warm, low blue-light color themes that retint the whole DSH interface, including panels and native-leaving tokens, without touching layout.
  zh: 五套低蓝光暖色配色，整体重着色 DSH 界面（含侧栏、浮层与阴影），零布局改动，卸载即还原。
icon: https://raw.githubusercontent.com/yrsxy/dsh-warm-theme/main/assets/icon-180.png
```

### 3.2 提 PR

```sh
git clone https://github.com/awesome-dsh-plugin/awesome-dsh-plugin.git
cd awesome-dsh-plugin
cp /Users/yangrenshun/Desktop/code/diy/dsh-warm-theme/market/yrsxy__dsh-warm-theme.yml \
   data/plugins/yrsxy__dsh-warm-theme.yml
git checkout -b add-dsh-warm-theme
git add data/plugins/yrsxy__dsh-warm-theme.yml
git commit -m "Add yrsxy/dsh-warm-theme"
git push -u origin add-dsh-warm-theme
# 然后在 GitHub 网页开 PR
```

**只加这一个文件。** 两个 README 由脚本从 `data/plugins/*.yml` 生成，
合并后自动重跑，不要手工编辑，也不要提交生成结果。

### 3.3 评审会查的硬条件

| 条件 | 本包状态 |
|---|---|
| `package.json` 声明 `dsh.bundle`（不是只有 `dsh.client`） | ✅ `dsh.bundle.patch` |
| 包根有对应 patch 文件 | ✅ `cordis.patch.yml` |
| 仓库有真实可用代码（非占位 / 纯 README） | ✅ 6000+ 行 token 数据 + 测试 |
| 仓库创建**满 1 天** | ⚠️ 见下 |
| README 描述准确、不夸大 | ✅ 已写清「不改变布局」 |
| 不含冒犯内容、不冒充他人项目 | ✅ |

> ⚠️ **时间线**：仓库必须创建满 24 小时才能通过评审。
> 所以流程是 **今天建仓库 → 明天提 PR**，不要当天建当天提。

### 3.4 合并之后

- 列表的 `plugins.json` 会在站点自动重建后更新
- 市场「发现」里搜「护眼」或 `dsh-warm-theme` 即可看到
- 插件市场也支持直接加索引源：**插件 → 发现 → Index sources** 填
  `https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json`

---

## 4. 后续版本

改了配色或样式之后：

```sh
cd /Users/yangrenshun/Desktop/code/diy/dsh-warm-theme
npm version patch   # 0.2.0 → 0.2.1；minor / major 同理
git push --follow-tags
npm publish --access public
```

列表条目**不用改** —— 它只记仓库地址，版本由索引从 npm 抓。

---

## 5. Windows 验证

本包不依赖任何平台专属 API，token 覆盖在两端一致。但建议在 Windows 上做一次实测：

```powershell
npm i -g @deepseek-ai/dsh
dsh plugin --profile desktop add dsh-warm-theme
dsh web
```

重点看三处：
1. 侧栏与正文是否两段式（Windows 原生即两段式，本包不该破坏它）
2. 正文卡片的 16px 圆角是否完好（本包不碰 `.frame` / `.centerCol`）
3. 切换到深色模式后阴影是否仍可见
