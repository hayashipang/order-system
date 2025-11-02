#!/usr/bin/env node

/**
 * 資料庫初始化腳本
 * 創建 PostgreSQL 資料庫和表格
 */

import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';

// 檢查環境變數
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ 請設定 DATABASE_URL 環境變數');
  console.log('例如: DATABASE_URL=postgresql://username:password@localhost:5432/order_system');
  process.exit(1);
}

const pool = new Pool({ 
  connectionString: DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function initDatabase() {
  try {
    console.log('🔧 開始初始化資料庫...');
    
    // 創建表格
    const createTables = `
      -- 客戶表
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        family_mart_address TEXT,
        source VARCHAR(100),
        payment_method VARCHAR(100),
        order_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 產品表
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        current_stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 訂單表
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        order_date DATE NOT NULL,
        delivery_date DATE,
        order_type VARCHAR(50) DEFAULT 'online',
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        items JSONB,
        shipping_type VARCHAR(50),
        shipping_fee DECIMAL(10,2) DEFAULT 0,
        credit_card_fee DECIMAL(10,2) DEFAULT 0,
        shopee_fee DECIMAL(10,2) DEFAULT 0,
        production_date DATE,
        scheduling_status VARCHAR(50),
        linked_schedule_id VARCHAR(255),
        scheduled_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 庫存交易表
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        transaction_type VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 創建索引
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
      CREATE INDEX IF NOT EXISTS idx_orders_production_date ON orders(production_date);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product_id ON inventory_transactions(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_transactions_date ON inventory_transactions(transaction_date);
    `;

    await pool.query(createTables);
    console.log('✅ 資料庫表格創建完成');

    // 檢查是否有初始數據
    const customerCount = await pool.query('SELECT COUNT(*) FROM customers');
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    
    console.log(`📊 當前數據統計:`);
    console.log(`  - 客戶數量: ${customerCount.rows[0].count}`);
    console.log(`  - 產品數量: ${productCount.rows[0].count}`);

    if (customerCount.rows[0].count === '0' && productCount.rows[0].count === '0') {
      console.log('💡 資料庫為空，建議從 JSON 文件導入初始數據');
    }

    console.log('🎉 資料庫初始化完成！');
    
  } catch (error) {
    console.error('❌ 資料庫初始化失敗:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();

