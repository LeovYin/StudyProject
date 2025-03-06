document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault(); // 阻止表单默认提交行为

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // 这里是模拟的登录验证过程，实际应用中需要与后端通信
    if (password === "correctPassword") {
        // 密码正确，进行登录操作
        alert('登录成功！');
        // 这里可以添加跳转到主页的代码
    } else {
        // 密码错误，显示错误消息
        document.getElementById('error-message').style.display = 'block';
    }
});

// 获取登录按钮
const loginButton = document.getElementById('loginButton');

// 监听点击事件
loginButton.addEventListener('click', (event) => {
    // 添加动画类
    loginButton.classList.add('button-animation');

    // 动画结束后移除类（以便重复触发）
    loginButton.addEventListener('animationend', () => {
        loginButton.classList.remove('button-animation');
    }, { once: true });
});