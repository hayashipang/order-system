#!/usr/bin/env node

/**
 * 自動修正未使用的 Props 工具
 * 
 * 功能：
 * - 讀取 scan-unused-props.js 產生的報表
 * - 自動刪除 index.js 裡沒有使用到的 props（安全模式）
 * - 不更動任何 function / state 內容
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import colors from 'colors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const INDEX_FILE = path.join(__dirname, '../client/src/components/AdminPanel/index.js');
const REPORT_FILE = path.join(__dirname, '../props-report.json');

/**
 * 讀取報表
 */
function loadReport() {
  if (!fs.existsSync(REPORT_FILE)) {
    console.error('❌ 找不到報表檔案:'.red, REPORT_FILE);
    console.error('   請先執行: npm run scan:props'.yellow);
    process.exit(1);
  }
  
  const reportContent = fs.readFileSync(REPORT_FILE, 'utf-8');
  return JSON.parse(reportContent);
}

/**
 * 移除組件中未使用的 prop
 */
function removeUnusedProp(content, componentName, propName) {
  // 找到組件的開始位置
  const componentRegex = new RegExp(`<${componentName}\\s+([\\s\\S]*?)(?:/>|>)`, 'm');
  const match = content.match(componentRegex);
  
  if (!match) {
    console.warn(`  ⚠️  找不到組件: ${componentName}`.yellow);
    return content;
  }
  
  const componentStart = match.index;
  const componentTagStart = componentStart + `<${componentName}`.length;
  const propsSection = match[1];
  const propsSectionStart = componentStart + match[0].indexOf(propsSection);
  
  // 在 props 區塊中尋找該 prop
  // 匹配 propName={...}，需要處理嵌套的大括號
  const propRegex = new RegExp(`\\b${propName}\\s*=\\s*\\{`, 'g');
  let propMatch;
  let found = false;
  
  while ((propMatch = propRegex.exec(propsSection)) !== null) {
    found = true;
    const propNameStart = propsSectionStart + propMatch.index;
    
    // 找到對應的 }（處理嵌套）
    let braceCount = 1;
    let propValueEnd = propNameStart + propMatch[0].length;
    while (propValueEnd < content.length && braceCount > 0) {
      if (content[propValueEnd] === '{') braceCount++;
      if (content[propValueEnd] === '}') braceCount--;
      propValueEnd++;
    }
    
    // 確定要移除的範圍
    // 向前查找：找到這一行或上一個 prop 的結尾
    let removeStart = propNameStart;
    while (removeStart > propsSectionStart && /\s/.test(content[removeStart - 1])) {
      removeStart--;
      if (content[removeStart] === '\n') {
        // 如果上一行是空行，也移除
        while (removeStart > 0 && /\s/.test(content[removeStart - 1])) {
          removeStart--;
          if (content[removeStart] === '\n') break;
        }
        break;
      }
    }
    
    // 向後查找：跳過空白和可能的換行
    let removeEnd = propValueEnd;
    while (removeEnd < content.length && /\s/.test(content[removeEnd])) {
      removeEnd++;
    }
    
    // 如果下一個字符是換行，保留一個換行
    if (content[removeEnd] === '\n') {
      // 檢查是否需要移除這一行（如果整行只有這個 prop）
      const lineEnd = removeEnd;
      while (lineEnd < content.length && content[lineEnd] !== '\n') {
        lineEnd++;
      }
      // 如果整行只有空白，移除整行
      const lineContent = content.substring(propNameStart, lineEnd).trim();
      if (lineContent === propName || lineContent.startsWith(propName + '=')) {
        removeEnd = lineEnd + 1;
      }
    }
    
    // 移除該 prop
    content = content.substring(0, removeStart) + content.substring(removeEnd);
    
    // 只移除第一個匹配（因為內容已改變，需要重新匹配）
    break;
  }
  
  if (!found) {
    console.warn(`  ⚠️  找不到 prop: ${propName} 在 ${componentName}`.yellow);
  }
  
  return content;
}

/**
 * 格式化修復後的代碼（移除多餘空行）
 */
function formatCode(content) {
  // 移除連續的多個空行，保留最多兩個
  content = content.replace(/\n{4,}/g, '\n\n\n');
  
  // 移除組件標籤之間的過多空行
  content = content.replace(/>\s*\n{3,}\s*</g, '>\n\n      <');
  
  return content;
}

/**
 * 主函數
 */
function main() {
  try {
    console.log('🔧 開始修正未使用的 Props...'.cyan);
    console.log('');
    
    // 讀取報表
    console.log('📄 讀取報表...'.gray);
    const report = loadReport();
    console.log(`   找到 ${Object.keys(report).length} 個組件的分析結果`.gray);
    
    // 讀取 index.js
    console.log('📂 讀取 index.js...'.gray);
    let indexContent = fs.readFileSync(INDEX_FILE, 'utf-8');
    const originalContent = indexContent;
    
    // 統計
    let totalRemoved = 0;
    const componentsToFix = [];
    
    // 找出需要修正的組件
    for (const [componentName, data] of Object.entries(report)) {
      if (data.unused && data.unused.length > 0) {
        componentsToFix.push({ componentName, unused: data.unused });
        totalRemoved += data.unused.length;
      }
    }
    
    if (componentsToFix.length === 0) {
      console.log('\n✨ 沒有需要修正的未使用 props！'.green);
      return;
    }
    
    console.log(`\n📊 發現 ${totalRemoved} 個未使用的 props`.yellow);
    console.log(`   將修正 ${componentsToFix.length} 個組件\n`.yellow);
    
    // 備份原始檔案
    const backupPath = INDEX_FILE + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, originalContent, 'utf-8');
    console.log(`💾 已建立備份: ${backupPath}`.cyan);
    console.log('');
    
    // 修正每個組件
    // 每次只移除一個 prop，然後重新匹配（因為內容會改變）
    for (const { componentName, unused } of componentsToFix) {
      console.log(`🔹 修正 ${componentName}:`.yellow);
      
      // 一次移除一個，重複直到所有未使用的 props 都被移除
      let remainingUnused = [...unused];
      let maxIterations = 100; // 防止無限循環
      let iterations = 0;
      
      while (remainingUnused.length > 0 && iterations < maxIterations) {
        iterations++;
        const propName = remainingUnused[0];
        console.log(`   刪除未使用的 prop: ${propName}`.gray);
        const beforeContent = indexContent;
        indexContent = removeUnusedProp(indexContent, componentName, propName);
        
        // 如果內容改變了，從列表中移除這個 prop
        if (indexContent !== beforeContent) {
          remainingUnused.shift();
        } else {
          // 如果沒有改變，跳過這個 prop（可能已經被移除了）
          remainingUnused.shift();
        }
      }
      
      if (remainingUnused.length > 0) {
        console.warn(`  ⚠️  無法移除所有 props，剩餘: ${remainingUnused.join(', ')}`.yellow);
      }
    }
    
    // 格式化代碼
    console.log('\n🎨 格式化代碼...'.gray);
    indexContent = formatCode(indexContent);
    
    // 寫入檔案
    console.log('💾 寫入檔案...'.gray);
    fs.writeFileSync(INDEX_FILE, indexContent, 'utf-8');
    
    console.log('\n' + '='.repeat(80).cyan);
    console.log('✅ 修正完成！'.green.bold);
    console.log('='.repeat(80).cyan);
    console.log(`\n📊 統計:`.cyan);
    console.log(`   修正組件: ${componentsToFix.length}`.green);
    console.log(`   移除 props: ${totalRemoved}`.green);
    console.log(`\n💡 提示:`.cyan);
    console.log(`   如果發現問題，可以使用備份檔案還原:`.gray);
    console.log(`   ${backupPath}\n`.gray);
    
  } catch (error) {
    console.error('❌ 錯誤:'.red, error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

