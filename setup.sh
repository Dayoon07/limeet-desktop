#!/bin/bash

# Limeet Desktop 자동 설치 스크립트
# 사용법: chmod +x setup.sh && ./setup.sh

echo "=================================="
echo "  Limeet Desktop 설치 시작"
echo "=================================="
echo ""

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Node.js 확인
echo -e "${YELLOW}Node.js 버전 확인...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo "https://nodejs.org 에서 Node.js를 설치하세요."
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js 버전: $NODE_VERSION${NC}"
echo ""

# npm 확인
echo -e "${YELLOW}npm 버전 확인...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm이 설치되어 있지 않습니다.${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm 버전: $NPM_VERSION${NC}"
echo ""

# 기존 node_modules 삭제 여부 확인
if [ -d "node_modules" ]; then
    echo -e "${YELLOW}기존 node_modules 폴더가 존재합니다.${NC}"
    read -p "삭제하고 새로 설치하시겠습니까? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}node_modules 삭제 중...${NC}"
        rm -rf node_modules
        rm -f package-lock.json
        echo -e "${GREEN}✅ 삭제 완료${NC}"
    fi
    echo ""
fi

# 의존성 설치
echo -e "${YELLOW}1. 기본 의존성 설치 중...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 기본 의존성 설치 완료${NC}"
else
    echo -e "${RED}❌ 의존성 설치 실패${NC}"
    exit 1
fi
echo ""

# Electron 설치
echo -e "${YELLOW}2. Electron 설치 중...${NC}"
npm install electron@^28.0.0 --save-dev
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Electron 설치 완료${NC}"
else
    echo -e "${RED}❌ Electron 설치 실패${NC}"
    exit 1
fi
echo ""

# Electron Builder 설치
echo -e "${YELLOW}3. Electron Builder 설치 중...${NC}"
npm install electron-builder@^24.9.0 --save-dev
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Electron Builder 설치 완료${NC}"
else
    echo -e "${RED}❌ Electron Builder 설치 실패${NC}"
    exit 1
fi
echo ""

# 파일 확인
echo -e "${YELLOW}4. 필수 파일 확인...${NC}"

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 (없음)${NC}"
        return 1
    fi
}

MISSING_FILES=0

check_file "electron-main.js" || ((MISSING_FILES++))
check_file "electron-preload.js" || ((MISSING_FILES++))
check_file "public/js/electron-renderer.js" || ((MISSING_FILES++))
check_file "public/index.html" || ((MISSING_FILES++))
check_file "public/js/socket-script.js" || ((MISSING_FILES++))
check_file "server.js" || ((MISSING_FILES++))

echo ""

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_FILES 개의 파일이 누락되었습니다.${NC}"
    echo "필요한 파일을 추가한 후 다시 실행하세요."
    exit 1
fi

# 아이콘 파일 확인
echo -e "${YELLOW}5. 아이콘 파일 확인...${NC}"
if [ -f "public/img/icon.ico" ]; then
    echo -e "${GREEN}✅ icon.ico 존재${NC}"
else
    echo -e "${YELLOW}⚠️  icon.ico 파일이 없습니다.${NC}"
    echo "빌드 시 기본 아이콘이 사용됩니다."
fi
echo ""

# package.json 확인
echo -e "${YELLOW}6. package.json 확인...${NC}"
if grep -q '"main": "electron-main.js"' package.json; then
    echo -e "${GREEN}✅ Electron main 설정 확인됨${NC}"
else
    echo -e "${RED}❌ package.json에 Electron 설정이 없습니다.${NC}"
    echo "package.json을 업데이트하세요."
    exit 1
fi
echo ""

# 설치 완료
echo "=================================="
echo -e "${GREEN}✅ 설치가 완료되었습니다!${NC}"
echo "=================================="
echo ""

# 실행 방법 안내
echo -e "${YELLOW}📌 실행 방법:${NC}"
echo ""
echo "  개발 모드 실행:"
echo -e "  ${GREEN}npm run electron${NC}"
echo ""
echo "  Windows 빌드:"
echo -e "  ${GREEN}npm run build-win${NC}"
echo ""
echo "  macOS 빌드:"
echo -e "  ${GREEN}npm run build-mac${NC}"
echo ""
echo "  Linux 빌드:"
echo -e "  ${GREEN}npm run build-linux${NC}"
echo ""

# 자동 실행 여부 확인
read -p "지금 바로 실행하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}🚀 Limeet Desktop 실행 중...${NC}"
    npm run electron
fi