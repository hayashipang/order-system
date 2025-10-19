#!/bin/bash

# 版本管理腳本
# 用法: ./scripts/version-manager.sh [create|switch|list|rollback] [version]

ACTION=${1:-help}
VERSION=${2:-""}

# 版本目錄
VERSION_DIR="versions"
CURRENT_VERSION_FILE=".current_version"

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 顯示幫助信息
show_help() {
    echo -e "${BLUE}📋 版本管理系統使用說明${NC}"
    echo ""
    echo "用法: $0 [動作] [版本號]"
    echo ""
    echo "動作:"
    echo "  create [版本號]    - 創建新版本 (例如: v1.0, v2.0, v2.1)"
    echo "  switch [版本號]    - 切換到指定版本"
    echo "  list              - 列出所有可用版本"
    echo "  rollback [版本號]  - 回滾到指定版本"
    echo "  current           - 顯示當前版本"
    echo "  backup            - 備份當前狀態"
    echo ""
    echo "範例:"
    echo "  $0 create v1.0     # 創建 v1.0 版本"
    echo "  $0 switch v2.0     # 切換到 v2.0"
    echo "  $0 rollback v1.0   # 回滾到 v1.0"
    echo "  $0 list            # 查看所有版本"
}

# 創建版本目錄
create_version_dir() {
    if [ ! -d "$VERSION_DIR" ]; then
        mkdir -p "$VERSION_DIR"
        echo -e "${GREEN}📁 創建版本目錄: $VERSION_DIR${NC}"
    fi
}

# 獲取當前版本
get_current_version() {
    if [ -f "$CURRENT_VERSION_FILE" ]; then
        cat "$CURRENT_VERSION_FILE"
    else
        echo "unknown"
    fi
}

# 設置當前版本
set_current_version() {
    echo "$1" > "$CURRENT_VERSION_FILE"
}

# 創建新版本
create_version() {
    if [ -z "$VERSION" ]; then
        echo -e "${RED}❌ 請指定版本號 (例如: v1.0, v2.0)${NC}"
        exit 1
    fi
    
    create_version_dir
    
    VERSION_PATH="$VERSION_DIR/$VERSION"
    
    if [ -d "$VERSION_PATH" ]; then
        echo -e "${YELLOW}⚠️  版本 $VERSION 已存在，是否覆蓋? (y/N)${NC}"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            echo "❌ 取消創建版本"
            exit 1
        fi
    fi
    
    echo -e "${BLUE}🔄 創建版本 $VERSION...${NC}"
    
    # 創建版本目錄
    mkdir -p "$VERSION_PATH"
    
    # 備份關鍵文件
    echo "📦 備份系統文件..."
    
    # 備份配置文件
    cp -r client/src/config* "$VERSION_PATH/" 2>/dev/null || true
    cp -r pos-system/src/services/api* "$VERSION_PATH/" 2>/dev/null || true
    cp server.js "$VERSION_PATH/" 2>/dev/null || true
    cp package.json "$VERSION_PATH/" 2>/dev/null || true
    cp vercel.json "$VERSION_PATH/" 2>/dev/null || true
    cp railway.json "$VERSION_PATH/" 2>/dev/null || true
    cp netlify.toml "$VERSION_PATH/" 2>/dev/null || true
    
    # 備份資料文件
    cp data.json "$VERSION_PATH/" 2>/dev/null || true
    cp data.local.json "$VERSION_PATH/" 2>/dev/null || true
    
    # 備份環境文件
    cp env.local "$VERSION_PATH/" 2>/dev/null || true
    cp env.production "$VERSION_PATH/" 2>/dev/null || true
    
    # 創建版本信息文件
    cat > "$VERSION_PATH/version_info.json" << EOF
{
  "version": "$VERSION",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "created_by": "$(whoami)",
  "description": "版本 $VERSION 快照",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')"
}
EOF
    
    # 備份雲端資料
    echo "☁️ 備份雲端資料..."
    ./scripts/backup-cloud-data.sh
    
    # 複製最新備份到版本目錄
    LATEST_BACKUP=$(ls -t cloud_data_backups/complete_backup_*.json 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        cp "$LATEST_BACKUP" "$VERSION_PATH/cloud_data_backup.json"
        echo "✅ 雲端資料已備份到版本目錄"
    fi
    
    echo -e "${GREEN}✅ 版本 $VERSION 創建成功！${NC}"
    echo "📁 版本路徑: $VERSION_PATH"
    
    # 更新當前版本
    set_current_version "$VERSION"
}

# 切換版本
switch_version() {
    if [ -z "$VERSION" ]; then
        echo -e "${RED}❌ 請指定要切換的版本號${NC}"
        exit 1
    fi
    
    VERSION_PATH="$VERSION_DIR/$VERSION"
    
    if [ ! -d "$VERSION_PATH" ]; then
        echo -e "${RED}❌ 版本 $VERSION 不存在${NC}"
        echo "可用版本:"
        list_versions
        exit 1
    fi
    
    echo -e "${BLUE}🔄 切換到版本 $VERSION...${NC}"
    
    # 備份當前狀態
    echo "💾 備份當前狀態..."
    CURRENT_VERSION=$(get_current_version)
    if [ "$CURRENT_VERSION" != "unknown" ] && [ "$CURRENT_VERSION" != "$VERSION" ]; then
        create_version "backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # 恢復版本文件
    echo "📦 恢復版本文件..."
    
    # 恢復配置文件
    cp "$VERSION_PATH"/config* client/src/ 2>/dev/null || true
    cp "$VERSION_PATH"/api* pos-system/src/services/ 2>/dev/null || true
    cp "$VERSION_PATH"/server.js . 2>/dev/null || true
    cp "$VERSION_PATH"/package.json . 2>/dev/null || true
    cp "$VERSION_PATH"/vercel.json . 2>/dev/null || true
    cp "$VERSION_PATH"/railway.json . 2>/dev/null || true
    cp "$VERSION_PATH"/netlify.toml . 2>/dev/null || true
    
    # 恢復資料文件
    cp "$VERSION_PATH"/data.json . 2>/dev/null || true
    cp "$VERSION_PATH"/data.local.json . 2>/dev/null || true
    
    # 恢復環境文件
    cp "$VERSION_PATH"/env.local . 2>/dev/null || true
    cp "$VERSION_PATH"/env.production . 2>/dev/null || true
    
    # 恢復雲端資料
    if [ -f "$VERSION_PATH/cloud_data_backup.json" ]; then
        echo "☁️ 恢復雲端資料..."
        # 這裡可以添加恢復雲端資料的邏輯
        echo "ℹ️  雲端資料恢復需要手動處理"
    fi
    
    # 更新當前版本
    set_current_version "$VERSION"
    
    echo -e "${GREEN}✅ 已切換到版本 $VERSION${NC}"
    echo "💡 提示: 請重新啟動相關服務以應用更改"
}

# 列出所有版本
list_versions() {
    if [ ! -d "$VERSION_DIR" ]; then
        echo -e "${YELLOW}⚠️  版本目錄不存在${NC}"
        return
    fi
    
    echo -e "${BLUE}📋 可用版本列表:${NC}"
    echo ""
    
    CURRENT_VERSION=$(get_current_version)
    
    for version_dir in "$VERSION_DIR"/*; do
        if [ -d "$version_dir" ]; then
            version_name=$(basename "$version_dir")
            version_info="$version_dir/version_info.json"
            
            if [ -f "$version_info" ]; then
                created_at=$(jq -r '.created_at' "$version_info" 2>/dev/null || echo "unknown")
                description=$(jq -r '.description' "$version_info" 2>/dev/null || echo "no description")
            else
                created_at="unknown"
                description="no description"
            fi
            
            if [ "$version_name" = "$CURRENT_VERSION" ]; then
                echo -e "  ${GREEN}→ $version_name${NC} (當前版本)"
            else
                echo -e "    $version_name"
            fi
            echo "      📅 創建時間: $created_at"
            echo "      📝 描述: $description"
            echo ""
        fi
    done
}

# 回滾到指定版本
rollback_version() {
    if [ -z "$VERSION" ]; then
        echo -e "${RED}❌ 請指定要回滾的版本號${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  確定要回滾到版本 $VERSION 嗎? 這將覆蓋當前所有更改! (y/N)${NC}"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ 取消回滾"
        exit 1
    fi
    
    # 使用 switch_version 函數
    switch_version
}

# 顯示當前版本
show_current_version() {
    CURRENT_VERSION=$(get_current_version)
    echo -e "${BLUE}📌 當前版本: ${GREEN}$CURRENT_VERSION${NC}"
    
    if [ "$CURRENT_VERSION" != "unknown" ]; then
        VERSION_PATH="$VERSION_DIR/$CURRENT_VERSION/version_info.json"
        if [ -f "$VERSION_PATH" ]; then
            echo "📅 創建時間: $(jq -r '.created_at' "$VERSION_PATH")"
            echo "👤 創建者: $(jq -r '.created_by' "$VERSION_PATH")"
            echo "📝 描述: $(jq -r '.description' "$VERSION_PATH")"
        fi
    fi
}

# 備份當前狀態
backup_current() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_VERSION="backup_$TIMESTAMP"
    create_version "$BACKUP_VERSION"
    echo -e "${GREEN}✅ 當前狀態已備份為版本: $BACKUP_VERSION${NC}"
}

# 主邏輯
case $ACTION in
    "create")
        create_version
        ;;
    "switch")
        switch_version
        ;;
    "list")
        list_versions
        ;;
    "rollback")
        rollback_version
        ;;
    "current")
        show_current_version
        ;;
    "backup")
        backup_current
        ;;
    "help"|*)
        show_help
        ;;
esac
