let studyInterval = null;
let localSeconds = 0;
let heartbeatInterval = null;
const HEARTBEAT_INTERVAL = 60 * 1000; // 60秒一次

// 更新计时器显示
function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    document.getElementById('live-timer').textContent = `${hours}:${mins}:${secs}`;
}

// 启动心跳包
function startHeartbeat() {
    if (!heartbeatInterval) {
        heartbeatInterval = setInterval(async () => {
            if (studyInterval) {
                try {
                    const response = await fetch('/api/study/heartbeat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ duration: localSeconds })
                    });
                    if (!response.ok) {
                        console.error('心跳包发送失败，尝试重新连接...');
                        restartHeartbeat();
                    }
                } catch (error) {
                    console.error('网络错误，尝试重新连接...');
                    restartHeartbeat();
                }
            }
        }, HEARTBEAT_INTERVAL);
    }
}

// 重启心跳包（指数退避策略）
function restartHeartbeat(retryCount = 1) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    if (retryCount <= 5) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        console.log(`将在 ${delay / 1000} 秒后重试`);
        setTimeout(() => {
            startHeartbeat();
            restartHeartbeat(retryCount + 1);
        }, delay);
    } else {
        console.error('超过最大重试次数，停止心跳');
        alert('与服务器连接中断，请手动保存学习记录！');
    }
}

// 开始学习
document.getElementById('start-timer').addEventListener('click', async () => {
    try {
        const res = await fetch('/api/study/start', { method: 'POST' });
        const data = await res.json();
        if (data.status === 'success') {
            document.getElementById('start-timer').disabled = true;
            document.getElementById('pause-timer').disabled = false;
            localSeconds = 0;
            studyInterval = setInterval(() => {
                localSeconds++;
                updateTimerDisplay(localSeconds);
            }, 1000);
            startHeartbeat(); // 启动心跳包
        }
    } catch (err) {
        console.error('启动失败:', err);
    }
});

// 暂停学习
document.getElementById('pause-timer').addEventListener('click', async () => {
    clearInterval(studyInterval);
    document.getElementById('start-timer').disabled = false;
    document.getElementById('pause-timer').disabled = true;
    clearInterval(heartbeatInterval); // 停止心跳包
    heartbeatInterval = null;
    try {
        await fetch('/api/study/pause', { method: 'POST' });
        loadStudyStats(); // 刷新统计数据
    } catch (err) {
        console.error('暂停失败:', err);
    }
});

// 加载学习统计
async function loadStudyStats() {
    try {
        const res = await fetch('/api/study/stats');
        const data = await res.json();
        document.getElementById('today-study').textContent = data.today;
        document.getElementById('total-study').textContent = data.total;
    } catch (err) {
        console.error('加载数据失败:', err);
    }
}

// 初始化加载
loadStudyStats();