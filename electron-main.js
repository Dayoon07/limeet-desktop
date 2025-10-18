const { app, BrowserWindow, Tray, Menu, globalShortcut, Notification, desktopCapturer, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();

let mainWindow;
let tray;
let server;
let io;

// Express 서버 설정
function startServer() {
    const expressApp = express();
    server = http.createServer(expressApp);
    io = socketIo(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    expressApp.use(express.static(path.join(__dirname, 'public')));

    // 방별 사용자 정보 및 메타데이터 저장
    const rooms = {};
    const roomMetadata = {};

    io.on('connection', (socket) => {
        console.log('새 사용자 연결:', socket.id);

        socket.on('join-room', (data) => {
            const { roomId, nickname, roomTitle } = data;
            socket.join(roomId);

            if (!rooms[roomId]) {
                rooms[roomId] = [];
                roomMetadata[roomId] = {
                    title: roomTitle || roomId,
                    roomCode: roomId,
                    createdAt: new Date().toISOString()
                };
                console.log(`새 방 생성: ${roomId}, 제목: ${roomTitle || roomId}`);
            }

            const userInfo = {
                id: socket.id,
                nickname: nickname
            };

            socket.to(roomId).emit('user-connected', {
                userId: socket.id,
                nickname: nickname
            });

            socket.emit('existing-users', rooms[roomId]);
            socket.emit('room-info', roomMetadata[roomId]);

            rooms[roomId].push(userInfo);
            socket.currentRoom = roomId;
            socket.nickname = nickname;

            // Electron 알림 전송
            if (mainWindow) {
                mainWindow.webContents.send('user-joined', {
                    nickname: nickname,
                    roomTitle: roomTitle || roomId
                });
            }

            console.log(`${nickname}(${socket.id})가 방 ${roomId}에 입장. 현재 인원: ${rooms[roomId].length}`);
        });

        socket.on('offer', (data) => {
            io.to(data.target).emit('offer', {
                offer: data.offer,
                from: socket.id,
                nickname: socket.nickname
            });
        });

        socket.on('answer', (data) => {
            io.to(data.target).emit('answer', {
                answer: data.answer,
                from: socket.id
            });
        });

        socket.on('ice-candidate', (data) => {
            io.to(data.target).emit('ice-candidate', {
                candidate: data.candidate,
                from: socket.id
            });
        });

        socket.on('chat-message', (data) => {
            const roomId = socket.currentRoom;
            if (roomId) {
                socket.to(roomId).emit('chat-message', {
                    nickname: data.nickname,
                    message: data.message,
                    timestamp: new Date().toISOString()
                });
                
                // Electron 알림 전송
                if (mainWindow) {
                    mainWindow.webContents.send('chat-received', {
                        nickname: data.nickname,
                        message: data.message
                    });
                }
                
                console.log(`[${roomId}] ${data.nickname}: ${data.message}`);
            }
        });

        socket.on('screen-share-started', (data) => {
            const roomId = socket.currentRoom;
            if (roomId) {
                socket.to(roomId).emit('screen-share-started', {
                    nickname: data.nickname,
                    userId: socket.id
                });
            }
        });

        socket.on('screen-share-stopped', (data) => {
            const roomId = socket.currentRoom;
            if (roomId) {
                socket.to(roomId).emit('screen-share-stopped', {
                    nickname: data.nickname,
                    userId: socket.id
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('사용자 연결 해제:', socket.id);

            for (let roomId in rooms) {
                const userIndex = rooms[roomId].findIndex(user => user.id === socket.id);
                
                if (userIndex !== -1) {
                    const user = rooms[roomId][userIndex];
                    rooms[roomId].splice(userIndex, 1);
                    
                    socket.to(roomId).emit('user-disconnected', {
                        userId: socket.id,
                        nickname: user.nickname
                    });
                    
                    if (rooms[roomId].length === 0) {
                        delete rooms[roomId];
                        delete roomMetadata[roomId];
                        console.log(`방 ${roomId} 삭제됨`);
                    }
                }
            }
        });
    });

    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`서버 시작: http://localhost:${PORT}`);
    });
}

// 메인 윈도우 생성
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        icon: path.join(__dirname, 'public/img/icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'electron-preload.js')
        },
        backgroundColor: '#667eea',
        show: false
    });

    // 윈도우 준비되면 표시
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.loadURL('https://limeet-app.onrender.com');

    // 개발자 도구 (프로덕션에서는 제거)
    // mainWindow.webContents.openDevTools();

    // 윈도우 닫기 이벤트
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            
            // 트레이 알림
            if (Notification.isSupported()) {
                new Notification({
                    title: 'Limeet',
                    body: '백그라운드에서 실행 중입니다.',
                    icon: path.join(__dirname, 'public/img/icon.ico')
                }).show();
            }
        }
        return false;
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// 트레이 아이콘 생성
function createTray() {
    const iconPath = path.join(__dirname, 'public/img/icon.ico');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Limeet 열기',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                } else {
                    createWindow();
                }
            }
        },
        {
            label: '새 회의 시작',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.webContents.send('create-new-meeting');
                }
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Limeet - 화상 회의');
    tray.setContextMenu(contextMenu);

    // 트레이 아이콘 클릭 시 윈도우 표시
    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
            } else {
                mainWindow.show();
            }
        } else {
            createWindow();
        }
    });
}

// 전역 단축키 등록
function registerShortcuts() {
    // Ctrl+Shift+M: 마이크 음소거 토글
    globalShortcut.register('CommandOrControl+Shift+M', () => {
        if (mainWindow) {
            mainWindow.webContents.send('toggle-mic');
        }
    });

    // Ctrl+Shift+V: 비디오 토글
    globalShortcut.register('CommandOrControl+Shift+V', () => {
        if (mainWindow) {
            mainWindow.webContents.send('toggle-video');
        }
    });

    // Ctrl+Shift+S: 화면 공유 토글
    globalShortcut.register('CommandOrControl+Shift+S', () => {
        if (mainWindow) {
            mainWindow.webContents.send('toggle-screen-share');
        }
    });

    // Ctrl+Shift+L: 회의 나가기
    globalShortcut.register('CommandOrControl+Shift+L', () => {
        if (mainWindow) {
            mainWindow.webContents.send('leave-meeting');
        }
    });
}

// 화면 소스 가져오기 (화면 공유용)
ipcMain.handle('get-sources', async () => {
    const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 150, height: 150 }
    });
    return sources;
});

// 알림 표시
ipcMain.on('show-notification', (event, { title, body }) => {
    if (Notification.isSupported()) {
        new Notification({
            title: title,
            body: body,
            icon: path.join(__dirname, 'public/img/icon.ico')
        }).show();
    }
});

// 앱 준비
app.whenReady().then(() => {
    startServer();
    createWindow();
    createTray();
    registerShortcuts();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// 모든 윈도우가 닫히면
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // macOS가 아니면 앱 종료하지 않고 트레이에 유지
        // app.quit();
    }
});

// 앱 종료 전
app.on('before-quit', () => {
    app.isQuitting = true;
});

// 앱 종료 시
app.on('will-quit', () => {
    // 모든 단축키 해제
    globalShortcut.unregisterAll();
    
    // 서버 종료
    if (server) {
        server.close();
    }
});

// macOS에서 Dock 아이콘 클릭
app.on('activate', () => {
    if (mainWindow) {
        mainWindow.show();
    } else {
        createWindow();
    }
});