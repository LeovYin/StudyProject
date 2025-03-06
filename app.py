from flask import Flask, render_template, request, redirect, url_for
from service.login_service import *

app = Flask(__name__)


@app.route('/')
def index():  # put application's code here
    return render_template('login.html', failure=False)


# 检查用户凭证
def check_credentials(username, password):
    user = get_user(username, password)
    return user is not None


# 登录页面
@app.route('/login')
def indexLogin():
    return render_template('login.html', failure=False)


# 处理登录请求
@app.route('/login', methods=['post'])
def login():
    username = request.form['username']
    password = request.form['password']
    if check_credentials(username, password):
        # 登录成功，重定向到首页或其他页面
        return redirect(url_for('indexPart2'))
    else:
        # 登录失败，显示错误消息
        return render_template('login.html', failure=True)


if __name__ == '__main__':
    app.run(debug=True)
