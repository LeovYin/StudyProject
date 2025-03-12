// 确保文件正确加载
console.log('脚本已加载');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM已加载'); // 确保DOM就绪

    const form = document.getElementById('todo-form');
    if (!form) {
        console.error('找不到表单元素！'); // 检查元素是否存在
        return;
    }

    form.addEventListener('submit', handleSubmit); // 绑定事件
});

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
document.addEventListener('DOMContentLoaded', function() {
    const checkinBtn = document.getElementById('checkin-btn');
    const streakDayInfo = document.getElementById('streak-day-info');
    const streakDay = parseInt(streakDayInfo.getAttribute('data-streak-day'), 10); // 将字符串转换为整数
    const currentPointsElement = document.getElementById('current-points'); // 当前积分显示的元素

    let currentPoints = parseInt(currentPointsElement.textContent.trim(), 10);
    checkinBtn.addEventListener('click', function() {
        // 发送 AJAX 请求到 Flask 后端
        fetch('/checkin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) // 发送空对象作为请求体
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert(data.result); // 使用 alert 显示 result
                    // 检查后端返回的数据中的success字段
                        // 假设后端返回的data中包含了新的积分值
                            currentPoints += data.checkin_point;
                            console.log(currentPoints)
                        updatePointsDisplay(); // 更新积分显示

                }
            })
            .catch(error => console.error('Error:', error));
        this.textContent = '✅ 已打卡';
        checkinBtn.disabled = true; // 禁用按钮
        streakDayInfo.textContent = `已经连续打卡${streakDay + 1}天`; // 使用模板字符串直接插入新的数值



        // 积分显示更新函数
        function updatePointsDisplay() {
            currentPointsElement.textContent = currentPoints;
        }
    });
});

// 表单提交监听
function handleSubmit(e) {
    e.preventDefault();
    console.log('表单提交触发'); // 调试标记

    const form = e.target;
    const formData = new FormData(form);

    // 发送请求
    fetch('/add-task', {
        method: 'POST',
        body: formData,
        credentials: 'include' // 携带cookie
    })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP错误 ${response.status}`);
            return response.json();
        })
        .then(result => {
            if (result.status === 'success') {
                // 动态添加任务项
                addTodoItem(formData.get('task-name'), formData.get('task-points'));
                form.reset();
            } else {
                showError(result.message);
            }
        })
        .catch(error => {
            showError(error.message);
        });
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

// 错误提示
function showError(message) {
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.textContent = message;

    document.body.appendChild(errorEl);
    setTimeout(() => errorEl.remove(), 2000);
}

// 为每个删除按钮添加点击事件监听器
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.delete-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            // 获取对应复选框的data-task-id属性
            var taskId = this.parentElement.querySelector('.task-checkbox').getAttribute('data-task-id');
            // 发送AJAX请求到后端
            fetch('/delete-task', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskid: taskId })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.parentElement.remove();
                        console.log('Task ID printed on the server');
                    } else {
                        console.log('Error printing Task ID on the server');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        });
    });
});

// 新增完成任务积分逻辑
document.addEventListener('DOMContentLoaded', function () {
    // 获取所有带有'class="task-checkbox"'的元素
    var checkboxes = document.querySelectorAll('.task-checkbox');
    const currentPointsElement = document.getElementById('current-points'); // 当前积分显示的元素

    let currentPoints = parseInt(currentPointsElement.textContent.trim(), 10);

    // 为每个复选框添加事件监听器
    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            var taskId = this.getAttribute('data-task-id'); // 获取data-task-id属性
            var isChecked = this.checked; // 获取复选框的选中状态
            const taskPoint = parseInt(this.getAttribute('data-task-point'));

            console.log(taskPoint)
            // 使用fetch发送请求
            fetch('/update-task-status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ taskId: taskId, isChecked: isChecked, taskPoint:taskPoint })
            })
                .then(response => {
                    // 确保响应是成功的
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json(); // 解析JSON响应
                })
                .then(data => {
                    console.log(data)

                    // 检查后端返回的数据中的success字段
                    if (data.status === 'success') {
                        console.log('Task status updated');
                        // 假设后端返回的data中包含了新的积分值
                        if(data.isChecked){
                            currentPoints += taskPoint;
                        }else {
                            currentPoints -= taskPoint;

                        }
                        updatePointsDisplay(); // 更新积分显示
                    } else {
                        console.log('Task status update failed');
                    }
                })
                .catch(error => {
                    console.error('There has been a problem with your fetch operation:', error);
                });
        });
    });

    // 积分显示更新函数
    function updatePointsDisplay() {
        currentPointsElement.textContent = currentPoints;
    }
});

