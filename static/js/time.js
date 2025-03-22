// 计时器逻辑
let studyInterval = null;
let localSeconds = 0;

// 元素引用
const startBtn = document.getElementById('start-timer');
const pauseBtn = document.getElementById('pause-timer');
const liveTimer = document.getElementById('live-timer');

// 更新显示
function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    liveTimer.textContent = `${hours}:${mins}:${secs}`;
}

// 开始计时
startBtn.addEventListener('click', async () => {
    try {
        const res = await fetch('/api/study/start', { method: 'POST' });
        const data = await res.json();

        if (data.status === 'success') {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            localSeconds = 0;

            studyInterval = setInterval(() => {
                localSeconds++;
                updateTimerDisplay(localSeconds);
            }, 1000);
        }
    } catch (err) {
        console.error('启动失败:', err);
    }
});

// 暂停计时
pauseBtn.addEventListener('click', async () => {
    clearInterval(studyInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;

    try {
        await fetch('/api/study/pause', { method: 'POST' });
        loadStudyStats(); // 刷新统计数据
    } catch (err) {
        console.error('暂停失败:', err);
    }
});

// 加载统计数据
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