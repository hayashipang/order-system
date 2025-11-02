/**
 * server_v3.js
 * ✅ 前後端整合最終版
 * Port: 3000
 * 前端路徑: ../client/build
 * 自動建立 data.local.json
 * Console log API 啟動路徑
 */

import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;
const __dirname = path.resolve();
const app = express();

// Middleware
app.use(helmet());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("vercel.app") ||
        origin.includes("railway.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

// Config
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || "";
const NODE_ENV = process.env.NODE_ENV || "development";

// Database
let usePostgres = false;
let pool = null;
if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  usePostgres = true;
  console.log("✅ Using PostgreSQL");
} else {
  console.log("🗂 Using local JSON storage");
}

// JSON database
const DATA_PATH = path.join(__dirname, "data.local.json");
if (!fs.existsSync(DATA_PATH)) {
  const defaultData = {
    products: [],
    orders: [],
    customers: [],
    order_items: [],
  };
  fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2), "utf8");
  console.log("📁 data.local.json created automatically");
}
const readData = () => JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const writeData = (data) =>
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");

// ---------------------------------- API ----------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    mode: usePostgres ? "PostgreSQL" : "JSON",
  });
});

// Orders list
app.get("/api/orders", async (req, res) => {
  if (usePostgres) {
    const { rows } = await pool.query("SELECT * FROM orders ORDER BY id DESC LIMIT 50");
    res.json(rows);
  } else {
    const db = readData();
    res.json(db.orders || []);
  }
});

// Orders history (alias for orders)
app.get("/api/orders/history", (req, res) => {
  try {
    if (usePostgres) {
      pool.query("SELECT * FROM orders ORDER BY id DESC LIMIT 50")
        .then(({ rows }) => res.json(rows))
        .catch((error) => {
          console.error('取得訂單歷史失敗:', error);
          res.status(500).json({ error: '取得訂單歷史失敗' });
        });
    } else {
      const db = readData();
      res.json(db.orders || []);
    }
  } catch (error) {
    console.error('取得訂單歷史失敗:', error);
    res.status(500).json({ error: '取得訂單歷史失敗' });
  }
});

// Uncompleted orders
app.get("/api/orders/uncompleted", (req, res) => {
  const db = readData();
  const uncompleted = (db.orders || []).filter((o) => o.status !== "completed");
  res.json(uncompleted);
});

// Products
app.get("/api/products", (req, res) => {
  const db = readData();
  res.json(db.products || []);
});

// Customers
app.get("/api/customers", (req, res) => {
  const db = readData();
  res.json(db.customers || []);
});

// Order items
app.get("/api/order-items", (req, res) => {
  const db = readData();
  res.json(db.order_items || []);
});

// Inventory (scheduling view)
app.get("/api/inventory/scheduling", (req, res) => {
  try {
    const db = readData();
    const products = db && Array.isArray(db.products) ? db.products : [];

    const inventory = products.map((p) => ({
      product_name: p.name || p.product_name || "未命名商品",
      current_stock: Number(p.current_stock || 0),
      scheduled: Number(p.scheduled || 0),
    }));

    console.log(`📦 /api/inventory/scheduling → ${inventory.length} items`);
    res.json(Array.isArray(inventory) ? inventory : []);
  } catch (err) {
    console.error("❌ 讀取庫存發生錯誤:", err);
    res.status(500).json({
      error: "Failed to load inventory",
      message: err.message,
    });
  }
});

// Scheduling confirm
app.post("/api/scheduling/confirm", (req, res) => {
  const { orders } = req.body;
  const db = readData();
  db.orders = [...(db.orders || []), ...(orders || [])];
  writeData(db);
  res.json({ success: true, message: "Scheduling confirmed" });
});

// Kitchen production list
app.get("/api/kitchen/production/:date", (req, res) => {
  const { date } = req.params;
  const db = readData();
  const result = (db.orders || []).filter((o) => o.production_date === date);
  res.json(result);
});

// Mark product as completed
app.put("/api/kitchen/production/:date/:productName/status", (req, res) => {
  const { date, productName } = req.params;
  const db = readData();
  let updated = false;
  db.orders = (db.orders || []).map((o) => {
    if (o.production_date === date) {
      o.items = (o.items || []).map((i) => {
        if (i.product_name === productName) {
          i.status = "completed";
          updated = true;
        }
        return i;
      });
    }
    return o;
  });
  if (updated) {
    writeData(db);
  }
  res.json({ success: updated });
});

// -------------------------- Serve frontend ------------------------------
const CLIENT_BUILD_PATH = path.join(__dirname, "../client/build");
app.use(express.static(CLIENT_BUILD_PATH));
app.get("*", (req, res) => {
  res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
});

// ------------------------------ Start -----------------------------------
app.listen(PORT, () => {
  console.log(`
🌍 環境設定:
  NODE_ENV: ${NODE_ENV}
  PORT: ${PORT}
  DATABASE_URL: ${DATABASE_URL || "未設定"}
🗂 使用${usePostgres ? "PostgreSQL 資料庫" : "本地 JSON 儲存"}

📡 API 端點已就緒:
  GET  /api/health ✅ ready
  GET  /api/orders ✅ ready
  POST /api/scheduling/confirm ✅ ready
  GET  /api/kitchen/production/:date ✅ ready
  PUT  /api/kitchen/production/:date/:productName/status ✅ ready
  GET  /api/inventory/scheduling ✅ ready
  GET  /api/products ✅ ready
  GET  /api/customers ✅ ready
  GET  /api/order-items ✅ ready
  GET  /api/orders/uncompleted ✅ ready

🚀 Server running on port ${PORT}
📡 Mode: ${usePostgres ? "PostgreSQL" : "JSON"}
🌐 Local access: http://localhost:${PORT}
📡 API Base: http://localhost:${PORT}/api
`);
});