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
    const taskName = document.getElementById('new-task');
    const taskPoints = document.getElementById('task-points');

    if (taskName.value.trim() && taskPoints.value > 0) {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox">
            <span>${taskName.value}</span>
            <span class="task-points-badge">+${taskPoints.value}分</span>
            <button class="delete-btn">×</button>
        `;
        todoList.appendChild(li);

        // 清空输入
        taskName.value = '';
        taskPoints.value = '';
    }
});
// 新增完成任务积分逻辑
todoList.addEventListener('change', (e) => {
    if (e.target.classList.contains('task-checkbox')) {
        const listItem = e.target.closest('li');
        if (e.target.checked) {
            // 获取积分值
            const points = parseInt(listItem.querySelector('.task-points-badge').textContent.match(/\d+/)[0]);

            // 更新总积分
            const pointsDisplay = document.getElementById('current-points');
            pointsDisplay.textContent = parseInt(pointsDisplay.textContent) + points;

            // 添加完成样式
            listItem.style.opacity = '0.6';
            listItem.querySelector('span:not(.task-points-badge)').style.textDecoration = 'line-through';
        }
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
// 在app.js中添加点击动画
document.getElementById('add-task').addEventListener('click', function () {
    this.classList.add('clicked');
    setTimeout(() => this.classList.remove('clicked'), 200);
});
// app.js 新增逻辑

// 按钮状态控制器
const addButton = document.getElementById('add-task');

// 模拟异步操作（实际需替换为真实API调用）
const mockAPICall = () => new Promise((resolve, reject) => {
    setTimeout(() => {
        Math.random() > 0.1 ? resolve() : reject(); // 10%概率模拟失败
    }, 1500);
});

// 按钮点击处理
addButton.addEventListener('click', async () => {
    const taskName = document.getElementById('new-task').value.trim();
    const taskPoints = document.getElementById('task-points').value;

    // 输入验证
    if (!taskName || !taskPoints) {
        showError('请填写完整信息');
        return;
    }

    try {
        // 进入加载状态
        setButtonState('loading');

        // 模拟API调用（实际需替换为fetch请求）
        await mockAPICall();

        // 添加任务到列表
        addTodoItem(taskName, taskPoints);

        // 显示成功反馈
        setButtonState('success');

        // 清空输入
        clearInputs();
    } catch (error) {
        // 错误处理
        setButtonState('error');
        showError('添加失败，请重试');
    }
});

// 状态控制函数
function setButtonState(state) {
    const states = ['loading', 'success', 'error'];
    addButton.classList.remove(...states);

    if (state) {
        addButton.classList.add(state);
        addButton.disabled = state === 'loading';
    }
}

// 添加任务到列表
function addTodoItem(name, points) {
    const li = document.createElement('li');
    li.innerHTML = `
        <input type="checkbox" class="task-checkbox">
        <span>${name}</span>
        <span class="task-points-badge">+${points}分</span>
        <button class="delete-btn">×</button>
    `;
    document.getElementById('todo-list').appendChild(li);
}

// 清空输入
function clearInputs() {
    document.getElementById('new-task').value = '';
    document.getElementById('task-points').value = '';
}

// 错误提示
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;

    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 2000);
}

// 新增CSS样式
const style = document.createElement('style');
style.textContent = `
    .error-message {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #FF758C;
        color: white;
        padding: 12px 24px;
        border-radius: 30px;
        box-shadow: 0 4px 15px rgba(255,117,140,0.3);
        animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
        from { top: -50px; }
        to { top: 20px; }
    }

    .add-btn.success .btn-icon {
        transform: scale(0) rotate(180deg);
    }

    .add-btn.success::after {
        content: '✓';
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        animation: checkmark 0.5s ease;
    }

    .add-btn.loading .btn-icon {
        animation: spin 1s infinite linear;
    }

    @keyframes checkmark {
        0% { opacity: 0; transform: translateX(-50%) scale(0); }
        90% { transform: translateX(-50%) scale(1.2); }
        100% { opacity: 1; transform: translateX(-50%) scale(1); }
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);