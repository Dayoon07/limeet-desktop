const { contextBridge, ipcRenderer } = require('electron');

// 렌더러 프로세스에 안전하게 API 노출
contextBridge.exposeInMainWorld('electron', {
    // 화면 소스 가져오기
    getSources: () => ipcRenderer.invoke('get-sources'),
    
    // 알림 표시
    showNotification: (title, body) => {
        ipcRenderer.send('show-notification', { title, body });
    },
    
    // 메인 프로세스로부터 이벤트 수신
    on: (channel, callback) => {
        const validChannels = [
            'toggle-mic',
            'toggle-video',
            'toggle-screen-share',
            'leave-meeting',
            'user-joined',
            'chat-received',
            'create-new-meeting'
        ];
        
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        }
    },
    
    // 이벤트 리스너 제거
    removeListener: (channel, callback) => {
        ipcRenderer.removeListener(channel, callback);
    }
});