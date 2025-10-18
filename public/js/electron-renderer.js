// public/js/electron-renderer.js
// 이 파일을 public/js/ 폴더에 추가하고 index.html에서 로드하세요

"use strict";

// Electron 환경 감지
const isElectron = typeof window.electron !== 'undefined';

if (isElectron) {
    console.log('Electron 환경에서 실행 중');

    // 전역 단축키 리스너
    window.electron.on('toggle-mic', () => {
        const micBtn = document.getElementById('micBtn');
        if (micBtn) micBtn.click();
        showShortcutNotification('마이크', micBtn.classList.contains('active'));
    });

    window.electron.on('toggle-video', () => {
        const cameraBtn = document.getElementById('cameraBtn');
        if (cameraBtn) cameraBtn.click();
        showShortcutNotification('카메라', cameraBtn.classList.contains('active'));
    });

    window.electron.on('toggle-screen-share', () => {
        const screenBtn = document.getElementById('screenShareBtn');
        if (screenBtn) screenBtn.click();
    });

    window.electron.on('leave-meeting', () => {
        const leaveBtn = document.getElementById('leaveBtn');
        if (leaveBtn) {
            if (confirm('회의에서 나가시겠습니까?')) {
                leaveBtn.click();
            }
        }
    });

    // 사용자 입장 알림
    window.electron.on('user-joined', (data) => {
        if (data.nickname) {
            window.electron.showNotification(
                '새 참가자',
                `${data.nickname}님이 입장했습니다.`
            );
        }
    });

    // 채팅 메시지 알림 (창이 포커스되지 않았을 때)
    window.electron.on('chat-received', (data) => {
        if (!document.hasFocus()) {
            window.electron.showNotification(
                `${data.nickname}`,
                data.message
            );
        }
    });

    // 새 회의 시작
    window.electron.on('create-new-meeting', () => {
        const createTab = document.querySelector('[data-tab="create"]');
        if (createTab) createTab.click();
    });

    // 단축키 안내 표시
    function showShortcutNotification(action, isActive) {
        const status = isActive ? 'ON' : 'OFF';
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = `${action}: ${status}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    // 애니메이션 CSS 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // 화면 공유 시 Electron의 데스크톱 캡처 사용
    window.getElectronScreenSources = async function() {
        try {
            const sources = await window.electron.getSources();
            return sources;
        } catch (err) {
            console.error('화면 소스 가져오기 실패:', err);
            return null;
        }
    };

    // 단축키 안내 표시 (앱 시작 시)
    window.addEventListener('load', () => {
        setTimeout(() => {
            const shortcuts = [
                'Ctrl+Shift+M: 마이크 음소거',
                'Ctrl+Shift+V: 비디오 끄기',
                'Ctrl+Shift+S: 화면 공유',
                'Ctrl+Shift+L: 회의 나가기'
            ];

            console.log('%c📌 단축키 안내', 'color: #667eea; font-size: 16px; font-weight: bold;');
            shortcuts.forEach(shortcut => {
                console.log('%c' + shortcut, 'color: #888; font-size: 12px;');
            });
        }, 2000);
    });

    // 창 닫기 전 확인 (회의 중일 때)
    window.addEventListener('beforeunload', (e) => {
        const mainContent = document.getElementById('mainContent');
        if (mainContent && mainContent.classList.contains('active')) {
            e.preventDefault();
            e.returnValue = '';
            return '회의가 진행 중입니다. 정말 나가시겠습니까?';
        }
    });

    // Electron 버전 표시
    console.log('%cLimeet Desktop App', 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%cElectron 환경에서 실행 중입니다.', 'color: #888; font-size: 12px;');

} else {
    console.log('웹 브라우저 환경에서 실행 중');
}

// 내보내기 (다른 스크립트에서 사용 가능)
window.electronHelper = {
    isElectron: isElectron,
    showNotification: (title, body) => {
        if (isElectron) {
            window.electron.showNotification(title, body);
        }
    }
};