# Lewen-Agent

`Lewen-Agent` 是一个前后端分离的论文检索界面与服务端代理项目：

- 前端：React + Vite
- 后端：FastAPI
- 依赖服务：paper search service、paper agent service、scorer service

## 1. 使用前准备

在启动项目前，请先确认本机已经安装：

- Node.js
- npm
- Python 3
- pip

后端 Python 依赖定义在 `server/requirements.txt`，前端依赖定义在 `package.json`。

## 2. 配置 `.env`

各字段含义：

- `VITE_API_BASE_URL`：前端访问后端 API 的基础路径。默认保留 `/api` 即可。
- `PAPER_SEARCH_V2_BASE_URL`：论文检索数据库服务地址。
- `PAPER_SEARCH_V2_API_KEY`：论文检索数据库服务的 API key。
- `PAPER_AGENT_V2_API_KEY`：大模型 agent 服务的 API key。
- `PAPER_AGENT_V2_MODEL_NAME`：agent 服务使用的模型名称。
- `PAPER_AGENT_V2_AGENT_URLS`：一个或多个 agent 服务地址，多个地址用空格分隔。
- `PAPER_AGENT_V2_AGENT_NAMES`：对应 agent 服务的显示名称，多个名称用空格分隔。
- `PAPER_AGENT_V2_ROUND_LOG_PATH`：运行日志输出路径。
- `PAPER_AGENT_V2_SCORER_URLS`：一个或多个 scorer 服务地址，多个地址用空格分隔。
- `PAPER_AGENT_V2_SCORER_NAMES`：对应 scorer 服务名称，多个名称用空格分隔。

说明：

- `PAPER_SEARCH_V2_API_KEY` 是数据库检索服务使用的 key，请填写你自己的真实值。

## 3. 安装依赖

在 `Lewen-Agent` 目录下执行：

```bash
python -m pip install -r server/requirements.txt
```

## 4. 启动后端

在 `Lewen-Agent` 目录下执行：

```bash
npm run api

或者

python -m server.app
```

这会启动 FastAPI 服务。前端会通过 `VITE_API_BASE_URL` 与它通信。


## 5. 启动前端

在另一个终端中，进入 `Lewen-Agent` 目录后执行：

```bash
npm run dev
```

如果只想预览 mock 前端，可使用：

```bash
npm run dev:mock
```

## 6. 生产构建

如果需要验证前端是否可以正常构建：

```bash
npm run build
```

构建产物会输出到 `dist/`。

## 7. 常用检查

### 后端最小测试

```bash
python -m unittest server.paper_agent_v2.test_agent_minimal
```

### 连通性检查

如果你想检查 agent、scorer、paper search service 是否可访问，可以运行：

```bash
python -m server.paper_agent_v2.test_connectivity_minimal
```

## 8. 运行流程建议

推荐的使用顺序如下：

1. 先填写 `Lewen-Agent/.env`
2. 安装前后端依赖
3. 先启动后端：`python -m server.app`
4. 再启动前端：`npm run dev`
5. 打开浏览器访问前端页面，发起检索

## 9. 常见问题

### 为什么会看到很多 `GET /sessions/{id}` 请求？

这是前端在轮询会话状态，用来刷新当前搜索进度。当前实现会定期请求后端读取 session 状态，这属于预期行为。

### 如果论文数据库请求失败，优先检查什么？

优先检查以下几项：

- `PAPER_SEARCH_V2_BASE_URL` 是否正确
- `PAPER_SEARCH_V2_API_KEY` 是否填写
- 数据库服务本身是否可用

### 如果 agent 无法返回结果，优先检查什么？

优先检查以下几项：

- `PAPER_AGENT_V2_API_KEY`
- `PAPER_AGENT_V2_MODEL_NAME`
- `PAPER_AGENT_V2_AGENT_URLS`
- `PAPER_AGENT_V2_SCORER_URLS`

## 10. 日志

- 轮次日志默认输出到 `logs/agent_rounds.log`
- 如果不希望保留历史日志，可以手动清理 `logs/` 目录中的旧文件
