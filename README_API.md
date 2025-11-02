# GreenWin Backend v3 API

本後端支援 **PostgreSQL + JSON fallback** 模式。

## 🔹 基本路由
| Method | Route | Description |
|--------|--------|-------------|
| GET | /api/health | 回傳伺服器狀態 |
| GET | /api/orders | 取得訂單列表 |
| POST | /api/orders | 新增訂單 |

## 🔹 排程與廚房（核心邏輯）
| Route | 功能 |
|--------|--------|
| POST /api/scheduling/confirm | 建立主排程單 |
| DELETE /api/scheduling/reset | 清除排程 |
| GET /api/kitchen/production/:date | 查詢當日主排程 |
| PUT /api/kitchen/production/:date/:productName/status | 標記完成（加庫存一次） |
| GET /api/inventory/scheduling | 查詢可排程庫存 |

> 若設定 `.env` 中的 `DATABASE_URL`，自動切換 PostgreSQL 模式；否則使用 `data.local.json`。
