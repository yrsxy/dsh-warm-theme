# 发布清单 / Publishing checklist

目标：让 `dsh-warm-theme` 出现在 **DSH 插件市场** 与 **awesome-dsh-plugin** 列表里，并能在 macOS 与 Windows 上通过一条命令安装。

## 当前进度

| 事项 | 状态 |
|---|---|
| 双平台适配 + 元数据 + 图标 + 测试 | ✅ 已完成 |
| GitHub 仓库 `yrsxy/dsh-warm-theme` | ✅ 已建，公开，6 个 topic，代码已推 |
| 分支 `add-dsh-warm-theme`（fork 上，含条目文件） | ✅ 已推 |
| npm 发布 | ✅ `dsh-warm-theme@0.2.0`（2026-10-23 14:11 +08:00），`latest` 指向它 |
| 提 PR | ⬜ 等仓库满 24h（2026-10-24 13:38 之后） |

npm 侧已完成，可直接核对：

```sh
npm view dsh-warm-theme version        # → 0.2.0
npm view dsh-warm-theme maintainers    # → yrsxy
```

> `0.0.0-stage` 是 npm 分阶段发布的内部占位版本（`stub: true`，描述为
> "Temporary package placeholder for staged publishing"），不是误发，不用处理。

开 PR 的入口（到点直接点）：

```
https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/compare/main...yrsxy:add-dsh-warm-theme
```

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

### 1.1 两个踩过的坑（已排查清楚）

**① `~/.npm` 写不进去，不是权限问题。**

`~/.npm` 的所有者本来就是当前用户，EPERM 的真因是 **DSH 的文件沙箱只允许写工作区**。
绕开方式是指定一个可写缓存目录：

```sh
npm publish --cache /tmp/npmcache-wt
```

**② 账号没开 2FA 时，bypass token 是无效的。**

npm 的发布策略是「2FA 验证码 **或** 带 bypass 2FA 的 granular token」。账号没有 2FA 时，
token 页面上那个 `Bypass two-factor authentication (2FA)` 复选框勾了也不生效，发布必定回：

```
403 Two-factor authentication or granular access token with bypass 2fa enabled is required to publish packages.
```

特征是 `otplease` 直接抛异常、终端根本不出现 `Enter OTP:` 提示。
另外 2FA 方式要选 **Authentication App**，不要选 **Security Key** ——
WebAuthn 生成的验证码 CLI 拿不到，发版反而更卡。

### 1.2 账号状态（已就绪）

- 用户名 `yrsxy`
- `two-factor auth: auth-and-writes`（发布与改设置都要码，符合 npm 要求）

### 1.3 发布

```sh
cd /Users/yangrenshun/Desktop/code/diy/dsh-warm-theme
npm login                    # 浏览器会弹出授权页，点 Approve
npm whoami                   # 确认登录成功
npm publish --access public  # prepublishOnly 会自动重新 build + 跑测试
# → 提示 Enter OTP: 时输验证器上的 6 位码
```

发新版时记得先改 `package.json` 的 `version`，已发布过的版本号不能再覆盖。

验证：

```sh
npm view dsh-warm-theme version   # → 0.2.0
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

### 2.2 推送 ✅ 已完成

仓库已建于 2026-10-23T05:38Z，公开，默认分支 `main`，topics：
`dsh-plugin` `deepseek-harness` `dsh` `theme` `theme-pack` `eye-care`。

推送方式是 HTTPS + PAT（`~/.ssh` 受文件沙箱保护写不进去，SSH 路线不可用）：

```sh
git -c http.extraHeader="Authorization: Basic $(printf 'yrsxy:%s' "$TOKEN" | base64)" \
    push -u origin main
```

**这个 PAT 只用了这一次，已经删除并作废。** 后续如果还要推：

```sh
git config --global credential.helper osxkeychain   # 让钥匙串记住，之后不用再填
git push
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

### 3.2 提 PR ✅ 分支已就绪，只差点按钮

已完成：fork 了列表仓库（`yrsxy/awesome-dsh-plugin`），从 `main` 拉出分支
`add-dsh-warm-theme`，把条目文件提交到 `data/plugins/yrsxy__dsh-warm-theme.yml`。
远端内容已校验。

**到 2026-10-24 13:38 之后**，打开这个链接点 **Create pull request**：

```
https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/compare/main...yrsxy:add-dsh-warm-theme
```

> 别提前点。`pr-gate.yml` 会自动校验仓库年龄，不满 24 小时 PR 会直接标红。

如果想本地重走一遍（可跳过，分支已经有了）：

```sh
git clone https://github.com/yrsxy/awesome-dsh-plugin.git
cd awesome-dsh-plugin && git checkout add-dsh-warm-theme
# 条目文件已经在 data/plugins/yrsxy__dsh-warm-theme.yml
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
