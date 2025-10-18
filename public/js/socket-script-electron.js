// public/js/socket-script-electron.js
// 기존 socket-script.js의 화면 공유 부분을 Electron용으로 개선

"use strict";

// Electron 환경에서 화면 공유 시작 (개선된 버전)
async function startScreenShareElectron() {
    if (!window.electron) {
        // Electron이 아닌 경우 기존 방식 사용
        return startScreenShareWeb();
    }

    try {
        // Electron의 desktopCapturer로 화면 소스 가져오기
        const sources = await window.electron.getSources();
        
        if (!sources || sources.length === 0) {
            alert('공유 가능한 화면이나 창을 찾을 수 없습니다.');
            return;
        }

        // 화면 선택 UI 표시
        const selectedSource = await showScreenPickerDialog(sources);
        
        if (!selectedSource) {
            console.log('화면 공유가 취소되었습니다.');
            return;
        }

        // 선택한 화면으로 스트림 생성
        screenStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: selectedSource.id,
                    minWidth: 1280,
                    maxWidth: 1920,
                    minHeight: 720,
                    maxHeight: 1080
                }
            }
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.contentHint = 'detail';
        }

        addVideoElement('local-screen', screenStream, nickname + '의 화면 (나)', true);

        // 기존 연결들에 화면 공유 트랙 교체
        for (let userId in peerConnections) {
            const pc = peerConnections[userId];
            const senders = pc.getSenders();
            
            const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
            if (videoSender) {
                await videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
                
                // 화면 공유용 높은 비트레이트
                const parameters = videoSender.getParameters();
                if (parameters.encodings && parameters.encodings[0]) {
                    parameters.encodings[0].maxBitrate = 2500000; // 2.5Mbps
                    videoSender.setParameters(parameters);
                }
            }
        }

        // 화면 공유 종료 감지
        screenStream.getVideoTracks()[0].onended = () => {
            stopScreenShare();
        };

        isScreenSharing = true;
        screenShareBtn.classList.add('screen-sharing');
        
        screenShareBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m14.5 12.5-5-5"/>
                <path d="m9.5 12.5 5-5"/>
                <rect width="20" height="14" x="2" y="3" rx="2"/>
                <path d="M12 17v4"/>
                <path d="M8 21h8"/>
            </svg>
        `;

        socket.emit('screen-share-started', { nickname });
        
        // Electron 알림
        if (window.electron) {
            window.electron.showNotification(
                '화면 공유 시작',
                `"${selectedSource.name}" 공유 중`
            );
        }

        console.log('🖥️ 화면 공유 시작:', selectedSource.name);

    } catch (err) {
        console.error('화면 공유 오류:', err);
        if (err.name === 'NotAllowedError') {
            alert('화면 공유 권한이 거부되었습니다.');
        } else {
            alert('화면 공유를 시작할 수 없습니다: ' + err.message);
        }
    }
}

// 웹 브라우저에서 화면 공유 (기존 방식)
async function startScreenShareWeb() {
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: 'always',
                displaySurface: 'monitor',
                frameRate: { ideal: 15, max: 20 },
                width: { max: 1920 },
                height: { max: 1080 }
            },
            audio: false
        });

        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.contentHint = 'detail';
        }

        addVideoElement('local-screen', screenStream, nickname + '의 화면 (나)', true);

        for (let userId in peerConnections) {
            const pc = peerConnections[userId];
            const senders = pc.getSenders();
            
            const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
            if (videoSender) {
                await videoSender.replaceTrack(screenStream.getVideoTracks()[0]);
            }
        }

        screenStream.getVideoTracks()[0].onended = () => {
            stopScreenShare();
        };

        isScreenSharing = true;
        screenShareBtn.classList.add('screen-sharing');

        socket.emit('screen-share-started', { nickname });
        console.log('🖥️ 화면 공유 시작 (웹)');

    } catch (err) {
        console.error('화면 공유 오류:', err);
        if (err.name === 'NotAllowedError') {
            alert('화면 공유 권한이 거부되었습니다.');
        }
    }
}

// 화면 선택 다이얼로그 표시 (간단한 버전)
async function showScreenPickerDialog(sources) {
    return new Promise((resolve) => {
        // 화면과 창 분리
        const screens = sources.filter(s => s.id.startsWith('screen'));
        const windows = sources.filter(s => s.id.startsWith('window'));

        // 간단한 선택 다이얼로그 생성
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 30px;
            max-width: 900px;
            max-height: 80vh;
            overflow-y: auto;
            width: 100%;
        `;

        content.innerHTML = `
            <h2 style="margin-bottom: 20px; color: #333;">공유할 화면 선택</h2>
            
            <div style="margin-bottom: 20px;">
                <h3 style="color: #667eea; margin-bottom: 10px;">전체 화면</h3>
                <div id="screensList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                    ${screens.map((source, index) => `
                        <div class="source-option" data-id="${source.id}" style="
                            cursor: pointer;
                            padding: 10px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            text-align: center;
                            transition: all 0.3s;
                        ">
                            <img src="${source.thumbnail.toDataURL()}" style="width: 100%; border-radius: 5px; margin-bottom: 8px;">
                            <div style="font-size: 14px; color: #333;">${source.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="margin-bottom: 20px;">
                <h3 style="color: #667eea; margin-bottom: 10px;">창</h3>
                <div id="windowsList" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; max-height: 300px; overflow-y: auto;">
                    ${windows.map((source, index) => `
                        <div class="source-option" data-id="${source.id}" style="
                            cursor: pointer;
                            padding: 10px;
                            border: 2px solid #e0e0e0;
                            border-radius: 8px;
                            text-align: center;
                            transition: all 0.3s;
                        ">
                            <img src="${source.thumbnail.toDataURL()}" style="width: 100%; border-radius: 5px; margin-bottom: 8px;">
                            <div style="font-size: 12px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${source.name}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button id="cancelPicker" style="
                    padding: 12px 30px;
                    background: #e0e0e0;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                ">취소</button>
            </div>
        `;

        dialog.appendChild(content);
        document.body.appendChild(dialog);

        // 소스 선택 이벤트
        content.querySelectorAll('.source-option').forEach(option => {
            option.addEventListener('mouseenter', function() {
                this.style.borderColor = '#667eea';
                this.style.transform = 'scale(1.05)';
            });
            
            option.addEventListener('mouseleave', function() {
                this.style.borderColor = '#e0e0e0';
                this.style.transform = 'scale(1)';
            });

            option.addEventListener('click', function() {
                const sourceId = this.dataset.id;
                const source = sources.find(s => s.id === sourceId);
                document.body.removeChild(dialog);
                resolve(source);
            });
        });

        // 취소 버튼
        content.querySelector('#cancelPicker').addEventListener('click', () => {
            document.body.removeChild(dialog);
            resolve(null);
        });

        // 배경 클릭 시 닫기
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
                resolve(null);
            }
        });
    });
}

// 전역으로 내보내기
window.startScreenShareElectron = startScreenShareElectron;
window.startScreenShareWeb = startScreenShareWeb;

console.log('Electron 화면 공유 모듈 로드됨');