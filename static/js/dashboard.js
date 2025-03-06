// 侧边栏切换功能
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        // 移除所有按钮激活状态
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        // 添加当前按钮激活状态
        this.classList.add('active');
        // 隐藏所有内容区域
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        // 显示对应内容
        const targetId = this.dataset.target;
        document.getElementById(targetId).classList.add('active');
        const currentSection = document.querySelector('.content-section.active');
        const newSection = document.getElementById(targetId);

        currentSection.classList.add('fade-out');
        setTimeout(() => {
            currentSection.classList.remove('active', 'fade-out');
            newSection.classList.add('fade-in');
            newSection.classList.add('active');
        }, 300);

        setTimeout(() => {
            newSection.classList.remove('fade-in');
        }, 600);
    });
});

// 打卡功能
document.getElementById('checkin-btn').addEventListener('click', function () {
    // 这里需要与后端API交互（示例仅前端演示）
    const pointsDisplay = document.getElementById('current-points');
    pointsDisplay.textContent = parseInt(pointsDisplay.textContent) + 5;
    this.disabled = true;
    this.textContent = '✅ 已打卡';
});

// 待办事项功能
const todoList = document.getElementById('todo-list');
document.getElementById('add-task').addEventListener('click', () => {
    const input = document.getElementById('new-task');
    if (input.value.trim()) {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox">
            <span>${input.value}</span>
            <button class="delete-btn">×</button>
        `;
        todoList.appendChild(li);
        input.value = '';
    }
});

// 任务完成/删除
todoList.addEventListener('click', (e) => {
    if (e.target.tagName === 'INPUT') {
        // 完成任务逻辑（可加积分）
    } else if (e.target.classList.contains('delete-btn')) {
        e.target.parentElement.remove();
    }
});