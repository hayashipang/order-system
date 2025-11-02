#!/usr/bin/env bash
set -euo pipefail

echo "🚀 初始化 Verify 測試環境..."

# 1️⃣ 安裝依賴
echo "📦 安裝必要套件..."
npm install --save-dev jest supertest @playwright/test express-list-endpoints jq

echo "📁 建立目錄結構..."
mkdir -p verify/scripts verify/__tests__ verify/e2e

# 2️⃣ 建立 smoke.sh
cat > verify/scripts/smoke.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
BASE=${1:-http://localhost:3001}
echo "🔎 Smoke Test against $BASE"

echo "1) /api/health"
curl -fsS "$BASE/api/health" | jq . >/dev/null

echo "2) /api/orders/history"
curl -fsS "$BASE/api/orders/history" | jq 'arrays' >/dev/null

echo "3) 建立測試訂單"
NEW='{"customer_id":1,"order_date":"2025-10-28","delivery_date":"2025-10-28","order_type":"normal","status":"pending","notes":"SMOKE TEST","items":[{"product_name":"即飲瓶-元氣綠","quantity":2,"unit_price":134}],"shipping_type":"normal","shipping_fee":50,"credit_card_fee":0,"shopee_fee":0}'
RESPONSE=$(curl -fsS -X POST "$BASE/api/orders" -H "Content-Type: application/json" -d "$NEW")
ORDER_ID=$(echo "$RESPONSE" | jq -r '.id')
echo "  創建訂單 ID: $ORDER_ID"

echo "4) 查驗訂單是否存在"
curl -fsS "$BASE/api/orders/history" | jq "[ .[] | select(.id==$ORDER_ID) ] | length > 0" | grep true >/dev/null

echo "5) 測試訂單狀態更新"
curl -fsS -X PUT "$BASE/api/orders/$ORDER_ID/status" -H "Content-Type: application/json" -d '{"status":"completed"}' | jq . >/dev/null

echo "6) 測試客戶訂單查詢"
curl -fsS "$BASE/api/orders/customers/2025-10-28" | jq 'arrays' >/dev/null

echo "7) 測試產品列表"
curl -fsS "$BASE/api/products" | jq 'arrays' >/dev/null

echo "8) 測試客戶列表"
curl -fsS "$BASE/api/customers" | jq 'arrays' >/dev/null

echo "9) 測試庫存查詢"
curl -fsS "$BASE/api/inventory/scheduling" | jq 'arrays' >/dev/null

echo "10) 測試廚房生產"
curl -fsS "$BASE/api/kitchen/production/2025-10-28" | jq 'arrays' >/dev/null

echo "11) 刪除測試訂單"
curl -fsS -X DELETE "$BASE/api/orders/$ORDER_ID" | jq . >/dev/null

echo "✅ SMOKE PASSED"
EOF

chmod +x verify/scripts/smoke.sh

# 3️⃣ 建立 scan-api.js
cat > verify/scripts/scan-api.js <<'EOF'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 開始掃描前後端 API 對應...');

// 1. 掃描後端 API 端點
console.log('📋 掃描後端 API 端點...');
const serverFile = path.join(__dirname, '../../server_v4.js');
const serverContent = fs.readFileSync(serverFile, 'utf8');

// 提取所有 API 路由
const backendRoutes = [];
const routeRegex = /app\.(get|post|put|delete)\('([^']+)'/g;
let match;
while ((match = routeRegex.exec(serverContent)) !== null) {
  const method = match[1].toUpperCase();
  let route = match[2];
  
  // 將動態參數轉換為通用模式
  route = route.replace(/:\w+/g, '${id}');
  
  backendRoutes.push(`${method} ${route}`);
}

// 保存後端 API 端點
fs.writeFileSync(
  path.join(__dirname, '../api-endpoints.json'), 
  JSON.stringify(backendRoutes, null, 2)
);

console.log(`✅ 找到 ${backendRoutes.length} 個後端 API 端點`);

// 2. 掃描前端 API 調用
console.log('📋 掃描前端 API 調用...');
const frontendDir = path.join(__dirname, '../../client/src');
const frontendFiles = [];

// 遞歸掃描前端文件
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
      frontendFiles.push(fullPath);
    }
  }
}

scanDirectory(frontendDir);

const frontendApiCalls = [];
for (const file of frontendFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    // 匹配 axios 調用
    const axiosRegex = /axios\.(get|post|put|delete)\(`\${config\.apiUrl}(\/api\/[^`]+)`/g;
    let match;
    while ((match = axiosRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      let route = match[2];
      
      // 將動態參數轉換為通用模式
      route = route.replace(/\$\{[^}]+\}/g, '${id}');
      
      frontendApiCalls.push(`${method} ${route}`);
    }
    
    // 匹配其他 API 調用模式
    const apiRegex = /\/api\/[a-zA-Z0-9/_-]+/g;
    const matches = content.match(apiRegex);
    if (matches) {
      for (const apiCall of matches) {
        let normalizedCall = apiCall.replace(/\$\{[^}]+\}/g, '${id}');
        
        // 嘗試推斷 HTTP 方法
        if (content.includes(`axios.get(\`\${config.apiUrl}${apiCall}\``)) {
          frontendApiCalls.push(`GET ${normalizedCall}`);
        } else if (content.includes(`axios.post(\`\${config.apiUrl}${apiCall}\``)) {
          frontendApiCalls.push(`POST ${normalizedCall}`);
        } else if (content.includes(`axios.put(\`\${config.apiUrl}${apiCall}\``)) {
          frontendApiCalls.push(`PUT ${normalizedCall}`);
        } else if (content.includes(`axios.delete(\`\${config.apiUrl}${apiCall}\``)) {
          frontendApiCalls.push(`DELETE ${normalizedCall}`);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠️ 無法讀取文件 ${file}:`, error.message);
  }
}

// 去重並排序
const uniqueFrontendCalls = [...new Set(frontendApiCalls)].sort();

// 保存前端 API 調用
fs.writeFileSync(
  path.join(__dirname, '../api-calls.json'), 
  JSON.stringify(uniqueFrontendCalls, null, 2)
);

console.log(`✅ 找到 ${uniqueFrontendCalls.length} 個前端 API 調用`);

// 3. 比對缺失的 API
console.log('📋 比對前後端 API...');
const missingApis = [];
const extraApis = [];

for (const frontendCall of uniqueFrontendCalls) {
  if (!backendRoutes.includes(frontendCall)) {
    missingApis.push(frontendCall);
  }
}

for (const backendRoute of backendRoutes) {
  if (!uniqueFrontendCalls.includes(backendRoute)) {
    extraApis.push(backendRoute);
  }
}

// 輸出結果
if (missingApis.length > 0) {
  console.error('❌ 缺少的 API 端點：');
  missingApis.forEach(api => console.error(`  - ${api}`));
  process.exit(1);
}

if (extraApis.length > 0) {
  console.warn('⚠️ 未使用的前端 API 端點：');
  extraApis.forEach(api => console.warn(`  - ${api}`));
}

console.log('✅ 前端與後端 API 對應正確！');

// 4. 生成報告
const report = {
  timestamp: new Date().toISOString(),
  backend_apis: backendRoutes.length,
  frontend_calls: uniqueFrontendCalls.length,
  missing_apis: missingApis.length,
  extra_apis: extraApis.length,
  status: missingApis.length === 0 ? 'PASS' : 'FAIL'
};

fs.writeFileSync(
  path.join(__dirname, '../api-report.json'), 
  JSON.stringify(report, null, 2)
);

console.log('📊 API 對應報告已生成: verify/api-report.json');
EOF

# 4️⃣ 建立 Jest 單元測試
cat > verify/__tests__/api.test.js <<'EOF'
import request from 'supertest';
const BASE = process.env.API_URL || 'http://localhost:3001';

describe('API Endpoints', () => {
  test('GET /api/health should return status ok', async () => {
    const res = await request(BASE).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/orders/history should return array', async () => {
    const res = await request(BASE).get('/api/orders/history');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/products should return array', async () => {
    const res = await request(BASE).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/customers should return array', async () => {
    const res = await request(BASE).get('/api/customers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
EOF

# 5️⃣ 建立 E2E 測試
cat > verify/e2e/orders.e2e.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';
const BASE = process.env.API_URL || 'http://localhost:3001';

test('orders history returns array', async ({ request }) => {
  const res = await request.get(`${BASE}/api/orders/history`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
});

test('products API returns array', async ({ request }) => {
  const res = await request.get(`${BASE}/api/products`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
});

test('customers API returns array', async ({ request }) => {
  const res = await request.get(`${BASE}/api/customers`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
});
EOF

# 6️⃣ 建立 404 偵測測試
cat > verify/e2e/no-404.e2e.spec.ts <<'EOF'
import { test, expect } from '@playwright/test';
const FRONT = process.env.FRONT_URL || 'http://localhost:3000';

test('無 404 API 錯誤 - 主頁', async ({ page }) => {
  const errors: string[] = [];
  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    if (status === 404 && url.includes('/api/')) {
      errors.push(url);
    }
  });

  await page.goto(`${FRONT}/`);
  await page.waitForTimeout(2000);
  expect(errors.length, `404 APIs detected: ${errors.join(', ')}`).toBe(0);
});

test('無 404 API 錯誤 - 後台管理', async ({ page }) => {
  const errors: string[] = [];
  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    if (status === 404 && url.includes('/api/')) {
      errors.push(url);
    }
  });

  await page.goto(`${FRONT}/admin`);
  await page.waitForTimeout(2000);
  expect(errors.length, `404 APIs detected: ${errors.join(', ')}`).toBe(0);
});

test('無 404 API 錯誤 - 廚房', async ({ page }) => {
  const errors: string[] = [];
  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    if (status === 404 && url.includes('/api/')) {
      errors.push(url);
    }
  });

  await page.goto(`${FRONT}/kitchen`);
  await page.waitForTimeout(2000);
  expect(errors.length, `404 APIs detected: ${errors.join(', ')}`).toBe(0);
});

test('無 Console 錯誤', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto(`${FRONT}/`);
  await page.waitForTimeout(2000);
  expect(errors.length, `Console errors: ${errors.join('\n')}`).toBe(0);
});
EOF

# 7️⃣ 建立 playwright.config.ts
cat > verify/playwright.config.ts <<'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './verify/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.FRONT_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run start-sqlite',
    url: 'http://localhost:3001/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
EOF

# 8️⃣ 建立總測試腳本
cat > verify/scripts/test-all-apis.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

echo "🚀 開始執行完整 API 測試流程..."

# 檢查服務器是否運行
echo "📋 Step 0: 檢查服務器狀態"
if ! curl -fsS http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "❌ 服務器未運行，請先啟動服務器："
    echo "   npm run start-sqlite"
    exit 1
fi
echo "✅ 服務器運行正常"

echo ""
echo "📋 Step 1: 掃描前後端 API 對應"
node verify/scripts/scan-api.js

echo ""
echo "📋 Step 2: 執行 Smoke 測試"
bash verify/scripts/smoke.sh

echo ""
echo "📋 Step 3: 執行 Jest 單元測試"
npm run test:verify

echo ""
echo "📋 Step 4: 執行 Playwright E2E（含 404 偵測）"
npm run e2e:verify

echo ""
echo "🎉 所有測試皆通過！"
echo ""
echo "📊 測試報告："
echo "  - API 對應檢查: ✅"
echo "  - Smoke 測試: ✅"
echo "  - 單元測試: ✅"
echo "  - E2E 測試: ✅"
echo "  - 404 偵測: ✅"
EOF

chmod +x verify/scripts/test-all-apis.sh

# 9️⃣ 更新 package.json
echo "🧩 更新 package.json scripts..."

# 檢查是否已經有 verify scripts
if grep -q "verify:all" package.json; then
    echo "⚠️ package.json 中已存在 verify scripts，跳過更新"
else
    # 使用 sed 來添加 scripts
    sed -i.bak '/"postinstall": "cd client && npm install"/a\
    "verify:all": "bash verify/scripts/test-all-apis.sh",\
    "verify:smoke": "bash verify/scripts/smoke.sh",\
    "verify:scan": "node verify/scripts/scan-api.js",\
    "test:verify": "jest --runInBand --roots verify/__tests__",\
    "e2e:verify": "playwright test verify/e2e"' package.json
    echo "✅ package.json scripts 已更新"
fi

echo "🎭 安裝 Playwright 瀏覽器依賴..."
npx playwright install --with-deps

echo ""
echo "✅ 初始化完成！你現在可以執行："
echo "--------------------------------------------"
echo "npm run verify:all"
echo "--------------------------------------------"
echo "🚀 會自動檢查 API 對應、Smoke、單元、E2E、404。"
echo ""
echo "📋 可用的測試指令："
echo "  npm run verify:all     - 完整測試流程"
echo "  npm run verify:smoke   - 煙霧測試"
echo "  npm run verify:scan    - API 掃描"
echo "  npm run test:verify    - Jest 單元測試"
echo "  npm run e2e:verify     - Playwright E2E 測試"











