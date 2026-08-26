# dsh-always-status-bar

> DeepSeek Harness Web 插件：让消息原生的状态栏——`日期 | 时间`，以及
> Assistant 侧的 `用时 · 首 token · tok/s`——无需悬停即可始终显示。

[DSH](https://github.com/deepseek-ai/deepseek-harness) 原生已渲染这些信息，但默认仅在 Hover 时显示，容易被错过。本插件以一条 scoped CSS 覆盖将其常驻显示：复用原生渲染与原生位置，日期/时间格式随 DSH 自动更新，不新增任何可见 UI。

- **Always visible**：用户消息与 Assistant 消息的状态栏常驻显示，Hover 前后一致
- **Zero config**：无设置项、无开关、无存储、无后端、无网络请求，安装即生效
- **Clean uninstall**：卸载后完全恢复原生 Hover-only 行为，不残留 DOM / CSS / 配置
- **Minimal & safe**：不扫描 DOM、无 MutationObserver、无轮询；复制、点赞、点踩等按钮不受影响

维护：[Bobnemimimmi](https://github.com/Bobnemimimmi) · 问题与反馈：[GitHub Issues](https://github.com/Bobnemimimmi/dsh-always-status-bar/issues)

## Usage

### 安装

```sh
dsh plugin --profile web add dsh-always-status-bar
```

npm 安装拿到的是发布时构建好的成品，无需任何构建授权。

从 GitHub 安装（会运行本包的 `prepare` 自构建；pnpm ≥10 首次 `add` 会拒绝并要求授权，
按提示把打印的 `allowBuilds` 键加入 profile 的 `pnpm-workspace.yaml` 后重跑）：

```sh
dsh plugin --profile web add github:Bobnemimimmi/dsh-always-status-bar
```

本地目录 / tarball 安装：

```sh
dsh plugin --profile web add ./dsh-always-status-bar
```

重启 `dsh web` 即生效。

### 卸载

```sh
dsh plugin --profile web remove dsh-always-status-bar
```

重启 `dsh web` 后恢复原生 Hover-only 行为。

## Requirements

- DeepSeek Harness（`dsh web`）—— 已在 web 客户端包 `0.1.0-rc.5` 上验证
- `dsh` CLI（或按 DSH 文档以源码方式运行 `pnpm dsh`）

DSH 迭代较快；升级后若状态栏未常驻显示，请核对 `data-time-hover-root` 锚点与
`MessageIconActions.module.css` 的隐藏机制是否仍与当前实现一致。

## License

MIT
