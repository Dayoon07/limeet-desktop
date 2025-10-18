# Limeet Desktop App - Electron 버전

기존 웹 기반 화상 회의 앱을 Electron 데스크톱 애플리케이션으로 변환한 버전입니다.

## 🎯 추가된 기능

### 1. **데스크톱 네이티브 기능**
- ✅ 트레이 아이콘 (최소화 시 백그라운드 실행)
- ✅ 전역 단축키 지원
- ✅ 데스크톱 알림
- ✅ 자동 시작 옵션
- ✅ 화면 공유 소스 선택 UI

### 2. **단축키**
- `Ctrl + Shift + M` : 마이크 음소거 토글
- `Ctrl + Shift + V` : 비디오 ON/OFF
- `Ctrl + Shift + S` : 화면 공유 토글
- `Ctrl + Shift + L` : 회의 나가기

### 3. **트레이 기능**
- 최소화 시 트레이에서 실행
- 빠른 메뉴 접근
- 백그라운드 알림

---

## 📦 설치 방법

### 1단계: 의존성 설치
```bash
npm install
```

### 2단계: Electron 개발 의존성 설치
```bash
npm install electron electron-builder --save-dev
```

---

## 🚀 실행 방법

### 개발 모드 실행
```bash
npm run electron
```

또는 개발 전용 모드:
```bash
npm run electron-dev
```

---

## 📦 빌드 방법 (실행 파일 생성)

### Windows용 빌드
```bash
npm run build-win
```
- 생성 위치: `dist/Limeet Setup 1.0.0.exe`
- 설치형 실행 파일

### macOS용 빌드
```bash
npm run build-mac
```
- 생성 위치: `dist/Limeet-1.0.0.dmg`
- DMG 설치 파일

### Linux용 빌드
```bash
npm run build-linux
```
- 생성 위치: `dist/Limeet-1.0.0.AppImage`
- AppImage 실행 파일

### 모든 플랫폼 빌드
```bash
npm run build-all
```

---

## 📁 파일 구조

```
limeet-desktop/
├── electron-main.js          # Electron 메인 프로세스
├── electron-preload.js       # 보안 브릿지
├── package.json              # Electron 설정 포함
├── public/
│   ├── js/
│   │   ├── electron-renderer.js  # Electron 렌더러 기능
│   │   ├── socket-script.js
│   │   └── ...
│   ├── css/
│   ├── img/
│   │   └── icon.ico          # 트레이 아이콘
│   └── index.html
└── dist/                     # 빌드된 실행 파일 (생성됨)
```

---

## 🔧 HTML 수정 사항

`public/index.html` 파일의 `<body>` 태그 끝에 다음 스크립트를 추가하세요:

```html
<!-- 기존 스크립트들 -->
<script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
<script type="module" src="https://limeet-app.onrender.com/js/socket-script.js"></script>
<script type="module" src="https://limeet-app.onrender.com/js/loaded.js"></script>

<!-- Electron 전용 스크립트 추가 -->
<script src="/js/electron-renderer.js"></script>
</body>
```

---

## 🎨 아이콘 준비

빌드를 위해 다음 아이콘 파일이 필요합니다:

### Windows
- `public/img/icon.ico` (256x256 이상)

### macOS
- `public/img/icon.icns` (512x512 이상)
- [온라인 변환 도구](https://cloudconvert.com/png-to-icns) 사용

### Linux
- `public/img/icon.png` (512x512 PNG)

---

## 🔐 보안 설정

이 Electron 앱은 다음 보안 설정을 사용합니다:

- ✅ `nodeIntegration: false` - Node.js 직접 접근 차단
- ✅ `contextIsolation: true` - 컨텍스트 격리
- ✅ `preload.js` - 안전한 API 노출

---

## 🐛 문제 해결

### 문제: 앱이 실행되지 않음
**해결**: 
```bash
npm install electron --save-dev
rm -rf node_modules
npm install
```

### 문제: 빌드 실패
**해결**:
```bash
npm install electron-builder --save-dev
npm run build-win
```

### 문제: 화면 공유가 작동하지 않음
**해결**: Electron의 `desktopCapturer` API가 자동으로 처리합니다. 권한을 확인하세요.

---

## 📊 성능 비교

| 항목 | 웹 버전 | Electron 버전 |
|------|---------|---------------|
| 시작 속도 | ⚡ 빠름 | 🐢 중간 |
| 메모리 사용 | 50-100MB | 150-250MB |
| 기능 | 기본 | 확장 (단축키, 알림) |
| 오프라인 | ❌ 불가 | ✅ 가능 (로컬 서버) |
| 설치 | 불필요 | 필요 |

---

## 🚀 배포 방법

### 1. GitHub Releases
빌드된 파일을 GitHub Release에 업로드

### 2. 자동 업데이트 (선택사항)
`electron-updater` 사용:
```bash
npm install electron-updater
```

### 3. 코드 서명 (선택사항)
Windows/macOS 보안 경고 제거를 위해 코드 서명 인증서 필요

---