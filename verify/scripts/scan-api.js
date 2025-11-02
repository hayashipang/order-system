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
