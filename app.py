from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from service.login_service import *
from service.basement_service import *

app = Flask(__name__)
app.secret_key = 'YSYGJY'


# 在顶部添加登录检查装饰器
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return jsonify({'status': 'error', 'message': '需要登录'}), 401
        return f(*args, **kwargs)

    return decorated_function


@app.route('/')
def index():
    return redirect('/login')


def check_credentials(username, password):
    user = get_user(username, password)
    return user is not None


@app.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if check_credentials(username, password):
            session['logged_in'] = True
            session['username'] = username
            return redirect('/dashboard')
        else:
            return render_template('login.html', error=True)
    return render_template('login.html', error=False)


@app.route('/dashboard')
def dashboard():
    if 'username' not in session:
        return redirect('/login')
    username = session['username']
    success, tasks = get_tasks(username)
    if not success:
        tasks = []
    # 获取当前积分
    success, user = get_user_by_username(username)
    current_points = user['points']
    return render_template('dashboard.html', username=username, tasks=tasks, current_points=current_points)


@app.route('/add-task', methods=['POST'])
def add_task():
    task_name = request.form['task-name']
    task_points_str = request.form['task-points']
    username = session['username']
    print(task_name, task_points_str, username)
    # 检查task_points是否为空且是否为数字
    if task_points_str and task_points_str.isdigit():
        task_points = int(task_points_str)
        print(task_points, task_name, username)
        create_task(username, task_name, task_points)
        return redirect(url_for('dashboard'))
    else:
        # 如果task_points为空或不是数字，可以重定向回表单页面并显示错误消息
        flash('请输入有效的积分值。')
        return redirect(url_for('dashboard'))  # 或者重定向到添加任务的页面


@app.route('/update-task-status', methods=['POST'])
def update_task_status():
    data = request.get_json()
    task_id = data.get('taskId')
    is_checked = data.get('isChecked')

    # 打印出task ID和是否选中
    print(f'Task ID: {task_id}, Is Checked: {is_checked}')

    # 这里可以添加更新任务状态的逻辑

    # 返回响应
    return jsonify({'status': 'success', 'message': 'Task status updated'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
