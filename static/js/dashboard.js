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

    this.textContent = '✅ 已打卡';
});


// 新增完成任务积分逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有带有'class="task-checkbox"'的元素
    var checkboxes = document.querySelectorAll('.task-checkbox');

    // 为每个复选框添加事件监听器
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            var taskId = this.getAttribute('data-task-id'); // 获取data-task-id属性
            var isChecked = this.checked; // 获取复选框的选中状态

            // 创建一个AJAX请求
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/update-task-status', true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    console.log('Task status updated');
                }
            };
            // 发送请求到后端，包含task ID和选中状态
            xhr.send(JSON.stringify({ taskId: taskId, isChecked: isChecked }));
        });
    });
});