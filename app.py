from flask import Flask, render_template, request, redirect, url_for, session
from service.login_service import *

app = Flask(__name__)
app.secret_key = 'YSYGJY'


@app.route('/')
def index():  # put application's code here
    return redirect('/login')


# 检查用户凭证
def check_credentials(username, password):
    user = get_user(username, password)
    return user is not None


# 处理登录请求
@app.route('/login', methods=['post', 'get'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        print(username, password)
        print(check_credentials(username, password))
        # 简单验证（正式环境不要用明文密码！）
        if check_credentials(username, password):
            session['logged_in'] = True
            session['username'] = username
            return redirect('/dashboard')
        else:
            return render_template('login.html', error=True)
    else:
        # 登录失败，显示错误消息
        return render_template('login.html', error=False)



if __name__ == '__main__':
    app.run(debug=True)
