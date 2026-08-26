# dsh-always-status-bar

一个轻量级 DeepSeek Harness（DSH）Web UI 插件：让聊天消息**原生自带的状态栏**——`日期 | 时间`，以及 Assistant 消息上的 `用时`、`首 token`、`tok/s` 等运行时读数——**无需鼠标悬停即可始终显示**。

> 核心原则：只改变 DSH 原生状态栏的可见性，不重新生成时间或用量信息，不改变消息结构，不修改 DSH 源码。

## 行为

| | 未安装（DSH 原生） | 安装本插件后 |
| --- | --- | --- |
| 用户消息状态栏 | 悬停到消息气泡后才显示 | 始终显示在原生位置 |
| Assistant 消息状态栏 | 悬停到消息末尾操作栏后才显示 | 始终显示在操作栏原生位置 |

> 用户消息的原生状态栏是 `日期 | 时间`；Assistant 消息的原生状态栏是 `日期 | 时间 · 用时 Xs · 首 token X.Xs · X tok/s`。它们位于**同一个原生 span** 内（DSH 的 `MessageIconActions` 时钟标签），因此一并常驻显示。

其余全部保持原生：复制 / 点赞 / 点踩 / 分支按钮及其它插件扩展按钮的显示逻辑、Hover 效果、点击行为、排列方式均不受影响；字体、字号、颜色、日期与时间格式、间距、对齐、气泡与操作栏布局均不变。插件不增加任何新的可见 UI。

## 实现原理（以当前 DSH checkout 源码为事实依据）

本插件**不扫描 DOM、不使用 MutationObserver、不轮询、不改 React 结构**，本质是「一个 client 插件 + 一条 CSS 规则」。

DSH 原生机制（`packages/client/ui-conversation`）：

- **用户消息**：`src/client/chat/MessageItem.tsx` 的用户行渲染在
  `<div data-time-hover-root>` 作用域内，状态栏由 `MessageIconActions`
  以 `clock="start"` 渲染（CSS Module 类 `timeStart`）。
- **Assistant 消息**：`src/client/chat/TurnTailNodeView.tsx` 的 turn 尾部同样
  带 `data-time-hover-root`，状态栏以 `clock="end"` 渲染（类 `timeEnd`）。
- **Hover 隐藏机制**：`src/client/chat/MessageIconActions.module.css` 中，
  该状态栏 span **始终存在于 DOM**，仅在 `@media (hover: hover)` 下以
  `opacity: 0` 隐藏，靠 `:hover` / `:focus-within` 恢复 `opacity: 1`。
  即：原生并非条件渲染，而是一次纯 CSS 可见性切换。

因此本插件选择侵入性最低的方案——**最小范围 CSS 覆盖**（`src/client/always-status-bar.css`）：

```css
[data-time-hover-root] :is([class*="timeStart"], [class*="timeEnd"]) {
  opacity: 1 !important;
}
```

- `data-time-hover-root` 是 DSH 源码中语义稳定、且被其自身测试使用
  （`ui-conversation/tests/chat-view.client.spec.tsx`）的 `data-*` 锚点。
- DSH 客户端构建管线以 `cssModules.pattern = '[hash]_[local]'` 编译 CSS
  Modules（`packages/client/tsdown.client.ts`），局部类名**原样保留**在产物
  类名中（如 `_4uWncW_timeStart`），因此 `[class*="timeStart"]` /
  `[class*="timeEnd"]` 能精确命中状态栏 span，而不会命中同行里的
  复制 / 分支 / 第三方按钮。
- `!important` 保证该规则压过原生的普通声明——插件 bundle 与
  ui-conversation 并发物化，样式表先后顺序不在本插件控制范围内。

生命周期（浏览器半，`src/client/index.ts`）：

1. 构建产物 `lib/client.js` 是 classic script，通过 DSH 客户端模块系统的
   `window.__ModuleLoader__.load({ id, factory })` 注册惰性 factory；
2. factory 返回 Cordis 插件形态（`{ name, apply }`），boot Loader 将其作为
   图中的一个 entry 激活；
3. `apply` 注入一个 `<style data-plugin="dsh-always-status-bar">` 标签
   （与原生 CSS 注入的 `data-plugin` 命名一致），并通过 `ctx.effect`
   注册清理：插件卸载时样式标签被移除，DSH 立即恢复原生
   Hover-only 行为，无需刷新页面，也不残留任何 CSS。

## 项目结构

```
├── SPEC.md                       # 需求规格（本项目的开发依据）
├── package.json                  # dsh.bundle + dsh.client 双清单
├── cordis.patch.yml              # bundle 层：插入唯一一个插件行
├── pnpm-workspace.yaml           # pnpm 11 设置（批准 esbuild 构建脚本）
├── build.mjs                     # esbuild 构建：node 半 + client 半
├── src/
│   ├── index.ts                  # node 半：无操作的 Cordis 插件（仅保证行可加载）
│   └── client/
│       ├── index.ts              # 浏览器半：注入/清理样式标签
│       ├── always-status-bar.css # 唯一一条覆盖规则
│       └── css.d.ts
├── lib/                          # 已提交的构建产物
│   ├── index.js
│   └── client.js
└── tests/                        # vitest（见「开发」）
```

## 安装（Web profile）

要求：已安装 `dsh` CLI（或按 DSH README 以源码方式运行 `pnpm dsh`）。

**本地目录安装**（推荐，零构建）：

```sh
dsh plugin --profile web add ./dsh-always-status-bar
```

**GitHub 安装**：

```sh
dsh plugin --profile web add github:<owner>/dsh-always-status-bar
```

git 安装拉取源码并由 pnpm 运行本包的 `prepare`（即 `build`）脚本；
pnpm ≥10 首次会拒绝并打印允许构建的提示，按提示把 `allowBuilds:
dsh-always-status-bar: true` 加入 profile 的 `pnpm-workspace.yaml` 后重跑即可。
`lib/` 已提交，本地目录与 tarball 安装无需任何构建步骤。

安装完成后重启 `dsh web`，加载任意 Session 即可看到状态栏常驻显示。

## 卸载

```sh
dsh plugin --profile web remove dsh-always-status-bar
```

随后重启 `dsh web`：状态栏恢复为仅在 Hover 时显示，不留下 DOM 节点、
CSS、配置或本地存储数据，无需任何手动恢复。

## 验收对照（SPEC §12）

| 场景 | 步骤 | 预期 |
| --- | --- | --- |
| A 用户消息 | 进入已有 Session，不悬停气泡 | 原生 `日期 \| 时间` 已可见 |
| B Assistant 消息 | 不悬停操作栏 | 原生状态栏（含用时/首 token/tok/s）已可见 |
| C Hover | 分别悬停气泡与操作栏 | 状态栏保持显示，无闪烁、跳位、重复 |
| D 新消息 | 发送消息并等待回复 | 双方新消息状态栏自动常驻 |
| E 历史消息 | 切换 Session / 加载更早记录 | 自动生效 |
| F 操作栏 | 使用复制/点赞/点踩/其他插件按钮 | 功能与布局不变 |
| G 卸载 | 移除插件并重启 DSH | 完全恢复原生 Hover-only |

## 兼容性说明

目标环境为当前 checkout 对应的 DSH 版本（web 客户端包 `0.1.0-rc.5` 一带）。
插件依赖两个事实：原生状态栏容器上的 `data-time-hover-root` 锚点，以及
DSH 客户端构建保留 CSS Module 局部类名（`[hash]_[local]`）的约定。
DSH 升级后请核对 `packages/client/ui-conversation/src/client/chat/`
下 `MessageIconActions.tsx` / `MessageIconActions.module.css` /
`TurnTailNodeView.tsx` 与 `MessageItem.tsx` 是否仍符合上述机制；若 DSH
改动了隐藏方式或类名约定，只需调整 `src/client/always-status-bar.css`
中的选择器。

## 零配置承诺

- 无 Settings 页面、无设置项、无开关、无配置文件、无环境变量；
- 无 localStorage / IndexedDB / 数据库 / 后端 API / 网络请求；
- 安装即启用，卸载即停用；
- 不修改 DSH 安装目录中的任何原生源码文件。

## 开发

```sh
pnpm install          # 安装 devDependencies（会自动构建 lib/）
pnpm run build        # 构建 lib/index.js 与 lib/client.js
pnpm run typecheck    # tsc 严格模式
pnpm test             # 先构建，再跑全部 vitest 测试
```

测试分层（`tests/`）：

- `node-half.test.ts` — node 半为静默无操作插件；
- `client-bundle.test.ts` — 在 jsdom 中执行**构建产物**，验证模块注册、
  样式注入、幂等重入与卸载清理（生命周期闭环）；
- `css-override.test.ts` — 静态保证覆盖规则只有一条、只改 `opacity`、
  只命中状态栏 span（SPEC §7 的最小改动契约）；
- `manifest.test.ts` — `dsh.bundle` / `dsh.client` / `exports` / patch 行
  与构建产物的包装格式。

## License

MIT
