#!/usr/bin/env node

/**
 * 掃描未使用的 Props 工具
 * 
 * 功能：
 * - 解析所有 views/*.jsx 檔案
 * - 抓出實際使用的 props（包括 props.xxx、解構）
 * - 解析 index.js，抓出每個 view 被傳入的 props
 * - 自動 diff：哪些 props 有傳但沒用、哪些有用但沒傳
 * - 輸出 JSON 報表
 * - 顯示顏色（綠=used, 黃=unused, 紅=missing）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const VIEWS_DIR = path.join(__dirname, '../client/src/components/AdminPanel/views');
const INDEX_FILE = path.join(__dirname, '../client/src/components/AdminPanel/index.js');

/**
 * 從 JSX 檔案中提取 props 定義（函數參數中的解構）
 */
function extractPropsDefinition(content) {
  const propsDefs = [];
  
  // 匹配 export default function ComponentName({ prop1, prop2, ... })
  // 需要處理多行的情況
  const functionMatch = content.match(/export\s+default\s+function\s+\w+\s*\(/);
  if (!functionMatch) return propsDefs;
  
  const startPos = functionMatch.index + functionMatch[0].length;
  let braceCount = 0;
  let propsStart = -1;
  let propsEnd = -1;
  
  // 尋找第一個 {（props 解構開始）
  for (let i = startPos; i < content.length; i++) {
    if (content[i] === '{') {
      propsStart = i;
      braceCount = 1;
      // 尋找對應的 }
      for (let j = i + 1; j < content.length; j++) {
        if (content[j] === '{') braceCount++;
        if (content[j] === '}') {
          braceCount--;
          if (braceCount === 0) {
            propsEnd = j;
            break;
          }
        }
      }
      break;
    }
    // 如果遇到 ) 但還沒找到 {，表示沒有解構
    if (content[i] === ')') break;
  }
  
  if (propsStart !== -1 && propsEnd !== -1) {
    const propsStr = content.substring(propsStart + 1, propsEnd);
    // 提取所有 props，處理多行
    const propNames = propsStr
      .split(',')
      .map(p => {
        // 移除註釋
        const commentIndex = p.indexOf('//');
        if (commentIndex !== -1) {
          p = p.substring(0, commentIndex);
        }
        return p.trim();
      })
      .filter(p => p && !p.startsWith('//'))
      .map(p => {
        // 處理預設值: prop = defaultValue
        const equalIndex = p.indexOf('=');
        if (equalIndex !== -1) {
          return p.substring(0, equalIndex).trim();
        }
        // 移除解構剩餘運算符
        return p.replace(/\.\.\./, '').trim();
      })
      .filter(p => p && p !== '...');
    propsDefs.push(...propNames);
  }
  
  return propsDefs;
}

/**
 * 從 JSX 檔案中提取實際使用的 props
 */
function extractPropsUsage(content, propsDefs) {
  const usedProps = new Set();
  
  // 移除註釋和字串內容，避免誤判
  let cleanContent = content;
  
  // 移除單行註釋
  cleanContent = cleanContent.replace(/\/\/.*$/gm, '');
  
  // 移除多行註釋
  cleanContent = cleanContent.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 移除字串內容（簡單處理）
  cleanContent = cleanContent.replace(/['"`](?:[^'"`\\]|\\.)*['"`]/g, '');
  
  // 1. 解構的 props 直接使用變數名
  for (const prop of propsDefs) {
    // 排除定義行的使用
    // 在函數定義之外查找變數使用
    const afterDefinition = cleanContent.split(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{/)[1] || cleanContent;
    
    // 使用正則匹配變數使用
    // 避免匹配到字串和註釋中
    const regex = new RegExp(`\\b${prop}\\b`, 'g');
    const matches = afterDefinition.match(regex);
    
    // 如果在定義之後有使用，則認為該 prop 被使用
    if (matches && matches.length > 0) {
      usedProps.add(prop);
    }
  }
  
  // 2. 如果沒有解構，查找 props.xxx 的使用
  if (cleanContent.includes('props.')) {
    const propsDotRegex = /props\.(\w+)/g;
    let match;
    while ((match = propsDotRegex.exec(cleanContent)) !== null) {
      usedProps.add(match[1]);
    }
  }
  
  // 如果定義的 props 為空，則所有 props.xxx 都被視為使用
  // 但這種情況在我們的項目中不常見
  
  return Array.from(usedProps);
}

/**
 * 從 index.js 中提取傳給特定組件的 props
 */
function extractPassedProps(indexContent, componentName) {
  const passedProps = [];
  
  // 匹配 <ComponentName ... /> 或 <ComponentName>...</ComponentName>
  // 使用非貪婪匹配來處理多行
  const regex = new RegExp(`<${componentName}\\s+([\\s\\S]*?)(?:/>|>)`, 'm');
  const match = indexContent.match(regex);
  
  if (!match) return passedProps;
  
  const propsSection = match[1];
  
  // 使用簡單的正則提取 prop={value} 形式
  // 匹配 propName={...}，需要處理嵌套的大括號
  const propRegex = /(\w+)\s*=\s*\{/g;
  let propMatch;
  
  while ((propMatch = propRegex.exec(propsSection)) !== null) {
    const propName = propMatch[1];
    const startPos = propMatch.index + propMatch[0].length - 1; // { 的位置
    let braceCount = 1;
    let endPos = startPos + 1;
    
    // 找到對應的 }
    while (endPos < propsSection.length && braceCount > 0) {
      if (propsSection[endPos] === '{') braceCount++;
      if (propsSection[endPos] === '}') braceCount--;
      endPos++;
    }
    
    // 檢查下一個字符是否是 } 或 /（組件結束標記）
    if (braceCount === 0) {
      passedProps.push(propName);
    }
  }
  
  // 去重
  return [...new Set(passedProps)];
}

/**
 * 掃描所有 view 檔案
 */
function scanViews() {
  const views = {};
  const files = fs.readdirSync(VIEWS_DIR);
  
  for (const file of files) {
    if (!file.endsWith('.jsx') && !file.endsWith('.js')) continue;
    
    const filePath = path.join(VIEWS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const componentName = path.basename(filePath, path.extname(filePath));
    
    const propsDefs = extractPropsDefinition(content);
    const usedProps = extractPropsUsage(content, propsDefs);
    
    views[componentName] = {
      file: file,
      definedProps: propsDefs,
      usedProps: usedProps,
    };
  }
  
  return views;
}

/**
 * 掃描 index.js 中傳給每個組件的 props
 */
function scanIndexFile(views) {
  const indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
  
  const results = {};
  
  for (const [componentName, viewData] of Object.entries(views)) {
    const passedProps = extractPassedProps(indexContent, componentName);
    
    results[componentName] = {
      ...viewData,
      passedProps: passedProps,
    };
  }
  
  return results;
}

/**
 * 分析結果並產生 diff
 */
function analyzeResults(results) {
  const report = {};
  
  for (const [componentName, data] of Object.entries(results)) {
    const { usedProps, passedProps } = data;
    const usedSet = new Set(usedProps);
    const passedSet = new Set(passedProps);
    
    // 未使用的 props：有傳但沒用
    const unused = passedProps.filter(p => !usedSet.has(p));
    
    // 缺失的 props：有用但沒傳
    const missing = usedProps.filter(p => !passedSet.has(p));
    
    // 正確使用的 props
    const correct = passedProps.filter(p => usedSet.has(p));
    
    report[componentName] = {
      correct: correct,
      unused: unused,
      missing: missing,
      allPassed: passedProps,
      allUsed: usedProps,
    };
  }
  
  return report;
}

/**
 * 顯示彩色報表
 */
function displayReport(report) {
  console.log('\n' + '='.repeat(80).cyan);
  console.log('📊 Props 使用情況報表'.cyan.bold);
  console.log('='.repeat(80).cyan + '\n');
  
  for (const [componentName, data] of Object.entries(report)) {
    console.log(`\n🔹 ${componentName}`.yellow.bold);
    console.log('-'.repeat(80).gray);
    
    const { correct, unused, missing, allPassed, allUsed } = data;
    
    // 正確使用的
    if (correct.length > 0) {
      console.log(`  ✅ 正確使用 (${correct.length}):`.green);
      console.log(`     ${correct.join(', ').green}\n`);
    }
    
    // 未使用的
    if (unused.length > 0) {
      console.log(`  ⚠️  未使用 (${unused.length}):`.yellow);
      console.log(`     ${unused.join(', ').yellow}\n`);
    }
    
    // 缺失的
    if (missing.length > 0) {
      console.log(`  ❌ 缺失 (${missing.length}):`.red);
      console.log(`     ${missing.join(', ').red}\n`);
    }
    
    // 統計
    const totalIssues = unused.length + missing.length;
    if (totalIssues === 0) {
      console.log(`  ✨ 完美！所有 props 都正確使用`.green);
    } else {
      console.log(`  📈 統計: 正確 ${correct.length}, 未使用 ${unused.length}, 缺失 ${missing.length}`.gray);
    }
  }
  
  // 總體統計
  console.log('\n' + '='.repeat(80).cyan);
  console.log('📊 總體統計'.cyan.bold);
  console.log('='.repeat(80).cyan);
  
  let totalCorrect = 0;
  let totalUnused = 0;
  let totalMissing = 0;
  
  for (const data of Object.values(report)) {
    totalCorrect += data.correct.length;
    totalUnused += data.unused.length;
    totalMissing += data.missing.length;
  }
  
  console.log(`\n✅ 正確使用: ${totalCorrect.toString().green}`);
  console.log(`⚠️  未使用: ${totalUnused.toString().yellow}`);
  console.log(`❌ 缺失: ${totalMissing.toString().red}`);
  console.log(`📦 總共組件: ${Object.keys(report).length.toString().cyan}\n`);
}

/**
 * 儲存 JSON 報表
 */
function saveJsonReport(report) {
  const reportPath = path.join(__dirname, '../props-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n📄 JSON 報表已儲存至: ${reportPath}`.cyan);
}

/**
 * 主函數
 */
function main() {
  try {
    console.log('🔍 開始掃描...'.cyan);
    
    // 掃描 views
    console.log('📂 掃描 views 檔案...'.gray);
    const views = scanViews();
    console.log(`   找到 ${Object.keys(views).length} 個組件`.gray);
    
    // 掃描 index.js
    console.log('📄 掃描 index.js...'.gray);
    const results = scanIndexFile(views);
    
    // 分析
    console.log('🔬 分析結果...'.gray);
    const report = analyzeResults(results);
    
    // 顯示報表
    displayReport(report);
    
    // 儲存 JSON
    saveJsonReport(report);
    
    console.log('\n✨ 掃描完成！\n'.green);
    
  } catch (error) {
    console.error('❌ 錯誤:'.red, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

