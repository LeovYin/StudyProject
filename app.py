from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash, make_response
from werkzeug.exceptions import BadRequest, Unauthorized
from flask_paginate import Pagination, get_page_args
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
    tasks = tasks if success else []

    success, user = get_user_by_username(username)
    current_points = user['points'] if success else 0
    today_points = count_today_points(username)

    streak_day = user['streak_day'] if success else 0
    success, wishes = find_wish_by_username(username)
    wishes = wishes if success else []
    wishes_page, wishes_per_page, wishes_offset = get_page_args(page_parameter='page', per_page_parameter='per_page')
    wishes_per_page = 12
    wishes_total = len(wishes)
    pagination_wishes_list = get_paginated_data(wishes, wishes_page, wishes_per_page)
    wishes_pagination = Pagination(page=wishes_page, per_page=wishes_per_page, total=wishes_total,
                                   css_framework='bootstrap4')

    success, achievements = get_achievements(username)
    achievements = achievements if success else []

    success, results = get_username_records(username)
    records = results if success else []
    records_page, records_per_page, records_offset = get_page_args(page_parameter='page', per_page_parameter='per_page')
    records_per_page = 12
    records_total = len(records)
    pagination_records_list = get_paginated_data(records, records_page, records_per_page)
    records_pagination = Pagination(page=records_page, per_page=records_per_page, total=records_total,
                                    css_framework='bootstrap4')

    return render_template('dashboard.html', username=username, tasks=tasks, current_points=current_points,
                           today_points=today_points, wishes=pagination_wishes_list,
                           wishes_pagination=wishes_pagination, is_checkin=is_checkin, streak_day=streak_day,
                           achievements=achievements,  )


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
    print(data)

    # 这里可以添加更新任务状态的逻辑
    print(is_checked)
    success, result = update_task_status(username, task_id, is_checked)
    print(success, result)
    if not success:
        return jsonify({'status': 'error', 'message': '更新任务状态失败！'})
    if is_checked:
        return jsonify({'status': 'success', 'message': 'Task status updated', 'isChecked': True})
    # 返回响应
    return jsonify({'status': 'success', 'message': 'Task status updated', 'isChecked': False})


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
    print(username, checkin_point)
    is_checkin, result = checkin_service(username, checkin_point)

    return jsonify(status='success', result=result, checkin_point=checkin_point)


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
    wishName = data.get('wishName')
    # 确保积分是一个整数
    if not isinstance(points, int):
        return jsonify(status='fail', message='积分格式不正确')

    success, result = redeem_wish_service(username, points, wish_id, wishName)

    if not success:
        return jsonify(status='fail', message=result)
    return jsonify(status='success', message=result)


# ==================== 记录路由 ====================

@app.route('/search')
def search():
    username = session['username']
    # 分页逻辑，假设每页显示pageSize条数据
    page = request.args.get('page', 1, type=int)
    pageSize = 12
    start = (page - 1) * pageSize
    end = start + pageSize
    success, records = get_username_records(username)
    message = ""
    data = []
    total = 0

    if not success:
        return jsonify({'total': total, 'data': data, 'message': records})

    search_type = request.args.get('type')

    # 均未实现分页数据
    if search_type == "add_points":
        success, records = get_add_points_records(records)
    elif search_type == "deduct_points":
        success, records = get_deduct_points_records(records)
    elif search_type == "weekly_points":
        success, records = get_week_records(records)
    elif search_type == "monthly_points":
        success, records = get_month_records(records)
    elif search_type == "all_records":
        success = True
        records = records
    else:
        return jsonify({'total': total, 'data': [], 'message': "search_type发生错误！"})
    if not success:
        return jsonify({'total': total, 'data': [], 'message': data})
    data = get_paginated_data(records, page, pageSize)
    total = len(records)
    print(data)
    return jsonify({'total': total, 'data': data, 'message': "读取" + search_type + "成功！"})


# ==================== 成就功能路由 ====================
@app.route('/claim-achievement', methods=['POST'])
def claim_achievement():
    username = session['username']
    data = request.json
    print(data)
    points = data.get('points')
    achievementName = data.get('achievementName')
    achievementId = data.get('id')
    conditions = data.get('condition')
    # 获取当前积分
    success, user = get_user_by_username(username)
    current_points = user['points']
    success, result = redeem_achievement_service(username, points, achievementId, achievementName, conditions)
    print(result)
    if not success:
        return jsonify({'status': 'fail', "message": result, 'current_points': current_points}), 200
    # 返回成功响应
    return jsonify({'status': 'success', 'message': result, 'current_points': current_points}), 200


# ==================== 分页功能路由 ====================
# 分页数据获取路由
@app.route('/records_paginate', methods=['GET'])
def paginate():
    page = request.args.get('page', 1, type=int)
    pageSize = 12
    start = (page - 1) * pageSize
    end = start + pageSize
    username = session['username']
    success, result = get_username_records(username)
    if not success:
        result = []
    data = get_paginated_data(result, page, pageSize)
    total = len(result)
    return jsonify({'data': data, 'total': total})

@app.route('/wishes_paginate', methods=['GET'])
def wishes_paginate():
    page = request.args.get('page', 1, type=int)
    pageSize = 12
    start = (page - 1) * pageSize
    end = start + pageSize
    username = session['username']
    success, result = find_wish_by_username(username)
    if not success:
        result = []
    data = get_paginated_data(result, page, pageSize)
    total = len(result)
    return jsonify({'data': data, 'total': total})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
