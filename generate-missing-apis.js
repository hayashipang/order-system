#!/usr/bin/env node

/**
 * 批量添加缺失的 API 到 server_v4.js
 */

import fs from 'fs';

// 讀取 server_v3.js 中的所有 API
const serverV3Content = fs.readFileSync('./server_v3.js', 'utf8');

// 提取所有 API 端點
const apiRegex = /app\.(get|post|put|delete)\('\/api\/[^']+',[^}]+}/g;
const apis = serverV3Content.match(apiRegex) || [];

console.log(`找到 ${apis.length} 個 API 端點`);

// 讀取 server_v4.js
let serverV4Content = fs.readFileSync('./server_v4.js', 'utf8');

// 檢查哪些 API 已經存在
const existingApis = [];
apis.forEach(api => {
  const endpointMatch = api.match(/app\.(get|post|put|delete)\('(\/api\/[^']+)'/);
  if (endpointMatch) {
    const endpoint = endpointMatch[2];
    if (serverV4Content.includes(`app.${endpointMatch[1]}('${endpoint}'`)) {
      existingApis.push(endpoint);
    }
  }
});

console.log(`已存在的 API: ${existingApis.length} 個`);
existingApis.forEach(api => console.log(`  ✅ ${api}`));

// 找出缺失的 API
const missingApis = [];
apis.forEach(api => {
  const endpointMatch = api.match(/app\.(get|post|put|delete)\('(\/api\/[^']+)'/);
  if (endpointMatch) {
    const endpoint = endpointMatch[2];
    if (!existingApis.includes(endpoint)) {
      missingApis.push({ endpoint, method: endpointMatch[1], fullApi: api });
    }
  }
});

console.log(`\n缺失的 API: ${missingApis.length} 個`);
missingApis.forEach(api => console.log(`  ❌ ${api.method.toUpperCase()} ${api.endpoint}`));

// 生成缺失的 API 代碼
if (missingApis.length > 0) {
  console.log('\n🔧 生成缺失的 API 代碼...');
  
  let newApiCode = '\n// 缺失的 API 端點\n';
  
  missingApis.forEach(api => {
    // 簡化 API 實現，使用統一的 query/run 函數
    const simplifiedApi = api.fullApi
      .replace(/if \(usePostgres\) \{[^}]+\} else \{[^}]+\}/g, '// 統一實現')
      .replace(/const db = readLocalData\(\);/g, '// 使用資料庫')
      .replace(/writeLocalData\(db\);/g, '// 保存資料')
      .replace(/pool\.query\(/g, 'await query(')
      .replace(/db\./g, '// db.')
      .replace(/JSON\.parse\(fs\.readFileSync\(DATA_PATH, 'utf8'\)\)/g, '// 讀取資料')
      .replace(/fs\.writeFileSync\(DATA_PATH, JSON\.stringify\(data, null, 2\), 'utf8'\)/g, '// 寫入資料');
    
    newApiCode += simplifiedApi + '\n\n';
  });
  
  // 將新 API 添加到 server_v4.js 的適當位置
  const insertPoint = serverV4Content.lastIndexOf('// 啟動服務器');
  if (insertPoint !== -1) {
    serverV4Content = serverV4Content.slice(0, insertPoint) + newApiCode + serverV4Content.slice(insertPoint);
    
    // 寫入文件
    fs.writeFileSync('./server_v4_with_apis.js', serverV4Content);
    console.log('✅ 已生成 server_v4_with_apis.js');
  }
}











