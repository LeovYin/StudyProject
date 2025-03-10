from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash, make_response
from werkzeug.exceptions import BadRequest, Unauthorized

from service.basement_service import *
from apscheduler.schedulers.background import BackgroundScheduler
import datetime
import pytz

app = Flask(__name__)
app.secret_key = 'YSYGJY'

# 设置定时任务
scheduler = BackgroundScheduler()
# 使用cron触发器，设置每天凌晨12点执行任务
scheduler.add_job(empty_task, 'cron', hour=0, minute=0, second=0, timezone=pytz.timezone('Asia/Shanghai'))
scheduler.start()


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
    is_checkin = is_checkin_today(username)
    success, tasks = get_tasks(username)
    if not success:
        tasks = []
    # 获取当前积分
    success, user = get_user_by_username(username)
    current_points = user['points']
    today_points = count_today_points(username)

    success, wishes = find_wish_by_username(username)
    if not success:
        wishes = []
    return render_template('dashboard.html', username=username, tasks=tasks, current_points=current_points,
                           today_points=today_points, wishes=wishes, is_checkin=is_checkin)


@app.route('/add-task', methods=['POST'])
def add_task():
    print("===== 请求到达 =====")  # 调试标记
    try:
        # 验证会话
        if 'username' not in session:
            print("用户未登录")  # 调试标记
            return jsonify({'status': 'error', 'message': '未登录'}), 401

        # 获取表单数据
        data = request.form
        print("原始表单数据:", data)  # 调试标记

        task_name = data.get('task-name', '').strip()
        task_points_str = data.get('task-points', '').strip()

        # 验证数据
        if not task_name:
            raise BadRequest('任务名称不能为空')
        if not task_points_str.isdigit():
            raise BadRequest('积分必须为数字')

        # 业务逻辑
        task_points = int(task_points_str)
        username = session['username']
        create_task(username, task_name, task_points)

        return jsonify({'status': 'success', 'message': '任务添加成功'})

    except BadRequest as e:
        print("参数错误:", e.description)  # 调试标记
        return jsonify({'status': 'error', 'message': e.description}), 400
    except Exception as e:
        print("服务器错误:", str(e))  # 调试标记
        return jsonify({'status': 'error', 'message': '服务器内部错误'}), 500


@app.route('/update-task-status', methods=['POST'])
def update_task_check():
    data = request.get_json()
    task_id = data.get('taskId')
    is_checked = data.get('isChecked')
    username = session['username']
    # 打印出task ID和是否选中
    print(f'Task ID: {task_id}, Is Checked: {is_checked}')

    # 这里可以添加更新任务状态的逻辑
    print(is_checked)
    seccess, result = update_task_status(username, task_id, is_checked)
    print(seccess, result)
    # 返回响应
    return jsonify({'status': 'success', 'message': 'Task status updated'})


@app.route('/checkin', methods=['POST'])
def checkin():
    username = session['username']
    success, user = get_user_by_username(username)
    streak = user['streak_day']
    if streak <= 10:
        checkin_point = 1
    elif streak <= 20:
        checkin_point = 1.5
    elif streak <= 30:
        checkin_point = 2
    else:
        checkin_point = 3
    is_checkin, result = checkin_service(username, checkin_point)

    return jsonify(status='success', result=result)


@app.route('/delete-task', methods=['POST'])
def delete_task():
    data = request.get_json()
    taskid = data.get('taskid')
    username = session['username']
    if taskid is not None:
        print(f"Task ID: {taskid}")
        # 这里可以添加删除任务的逻辑
        soft_delete_task(username, taskid)
        return jsonify(success=True)
    else:
        print("Task ID is None")

        return jsonify(success=False)


# ==================== 心愿单功能路由 ====================
@app.route('/add-wish', methods=['POST'])
def add_wish():
    data = request.json
    title = data.get('name')
    points = data.get('points')
    username = session['username']

    success = create_wish(username, points, title)
    if success:
        return jsonify(status='success', message='心愿添加成功')
    return jsonify(status='fail', message='心愿添加失败')


@app.route('/edit-wish', methods=['POST'])
def edit_wish():
    data = request.json
    print("edit wish")
    print(data)
    username = session['username']
    wish_id = data.get('id')
    title = data.get('name')
    points = data.get('points')
    success, result = edit_wish_service(username, wish_id, points, title)
    if not success:
        return jsonify(status='fail', message=result)
    return jsonify(status='success', message='心愿编辑成功')


@app.route('/delete-wish', methods=['POST'])
def delete_wish():
    data = request.json
    print("delete wish")
    print(data)
    wish_id = data.get('id')
    username = session['username']
    success, result = soft_delete_wishes(username, wish_id)
    if success:
        return jsonify(status='success', message=result)
    else:
        return jsonify(success='fail', message=result)


@app.route('/redeem-wish', methods=['POST'])
def redeem_wish():
    data = request.json
    print("redeem wish")
    print(data)
    username = session['username']
    points = data.get('points')
    wish_id = data.get('id')

    # 确保积分是一个整数
    if not isinstance(points, int):
        return jsonify(status='fail', message='积分格式不正确')

    success, result = redeem_wish_service(username, points, wish_id)
    if not success:
        return jsonify(status='fail', message=result)
    return jsonify(status='success', message=result)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
