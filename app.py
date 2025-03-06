from flask import Flask, render_template
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


if __name__ == '__main__':
    app.run(debug=True)
