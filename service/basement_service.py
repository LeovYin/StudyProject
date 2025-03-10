import pymysql
from datetime import datetime
from typing import Tuple, Union, List, Dict, Generator
from contextlib import contextmanager
from functools import wraps
from dbutils.pooled_db import PooledDB

# ==================== 数据库连接池配置 ====================
pool = PooledDB(
    creator=pymysql,
    maxconnections=5,  # 连接池最大连接数
    host='localhost',
    user='root',
    password='776868312',
    database='studyproject',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)


# ==================== 上下文管理器 ====================
@contextmanager
def get_cursor() -> Generator[pymysql.cursors.Cursor, None, None]:
    """自动管理连接和游标的上下文管理器"""
    conn = pool.connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)
    try:
        yield cursor
    except Exception as e:
        conn.rollback()
        cursor.close()
        raise
    else:
        conn.commit()
        cursor.close()


# ==================== 装饰器 ====================
def handle_db_errors(func):
    """统一错误处理装饰器"""

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except pymysql.Error as e:
            print(f"[DB Error] {str(e)}")
            return False, f"数据库操作失败：{str(e)}"
        except ValueError as e:
            return False, str(e)
        except Exception as e:
            print(f"[System Error] {str(e)}")
            return False, f"系统错误：{str(e)}"

    return wrapper


# ==================== 工具函数 ====================
def _format_dates(record: Dict, fields: List[str]) -> Dict:
    """通用时间字段格式化"""
    for field in fields:
        if record.get(field) and isinstance(record[field], datetime):
            record[field] = record[field].strftime("%Y-%m-%d %H:%M:%S")
    return record


def validate_str_field(value: str, field_name: str, max_length: int) -> None:
    """字符串字段验证"""
    if not value or len(value.strip()) == 0:
        raise ValueError(f"{field_name}不能为空")
    if len(value) > max_length:
        raise ValueError(f"{field_name}超过{max_length}字符限制")


# ==================== 用户服务 ====================
@handle_db_errors
def get_user(username, password):
    sql = "SELECT * FROM user WHERE username = %s AND password = %s"
    with get_cursor() as cursor:
        cursor.execute(sql, (username, password))
        result = cursor.fetchone()
        return result, None


@handle_db_errors
def get_user_by_username(username):
    sql = "SELECT * FROM user WHERE username = %s"
    with get_cursor() as cursor:
        cursor.execute(sql, (username,))
        result = cursor.fetchone()
        return result, None


@handle_db_errors
def get_user_by_username(username: str) -> Tuple[bool, Union[Dict, str]]:
    """获取用户信息"""
    with get_cursor() as cursor:
        cursor.execute("""
            SELECT  username, points ,streak_day, all_day
            FROM user
            WHERE username = %s
        """, (username,))
        user = cursor.fetchone()
        return (True, user) if user else (False, "用户不存在")


@handle_db_errors
def update_user_points(username: str, points: int) -> Tuple[bool, str]:
    """更新用户积分"""
    with get_cursor() as cursor:
        cursor.execute("""
            UPDATE user 
            SET points = points + %s 
            WHERE username = %s
        """, (points, username))
        return True, "积分更新成功"


# ==================== 任务服务 ====================
@handle_db_errors
def create_task(username: str, title: str, points: int) -> Tuple[bool, Union[int, str]]:
    """创建新任务"""
    # 参数校验
    validate_str_field(title, "任务标题", 200)
    if not isinstance(points, int) or points < 1:
        raise ValueError("积分必须为正整数")

    with get_cursor() as cursor:
        sql = """
            INSERT INTO task (
                username, title, points, created_at,is_delete,deleted_at,is_completed,completed_at
            ) VALUES (%s, %s, %s, %s,%s ,%s, %s, %s)
        """
        cursor.execute(sql, (
            username,
            title.strip(),
            points,
            datetime.now(),
            0,
            None,
            0,
            None
        ))
        return True, cursor.lastrowid


@handle_db_errors
def update_task_status(username: str, task_id: int, completed: bool) -> Tuple[bool, str]:
    today = datetime.now().strftime("%Y-%m-%d")
    """更新任务状态"""
    with get_cursor() as cursor:
        # 验证任务所有权
        cursor.execute("""
            SELECT id, points,title
            FROM task 
            WHERE id = %s AND username = %s AND is_delete = 0
        """, (task_id, username))
        task = cursor.fetchone()
        if not task:
            return False, "任务不存在或无权操作"
        if completed:
            # 更新任务状态
            cursor.execute("""
                UPDATE task SET 
                    is_completed = %s,
                    completed_at = %s
                WHERE id = %s
            """, (1, datetime.now(), task_id))

            cursor.execute("""
            INSERT INTO record (username, task_title, point, finish_time, finish_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (username, task['title'], task['points'], datetime.now(), today))

        else:
            cursor.execute("""
                UPDATE task SET 
                    is_completed = %s
                WHERE id = %s
            """, (0, task_id))

            cursor.execute("""
                DELETE FROM record 
                WHERE task_title = %s AND finish_date = %s AND username = %s
                """, (task['title'], today, username))

        # 更新用户积分
        points_change = task['points'] if completed else -task['points']
        cursor.execute("""
            UPDATE user 
            SET points = points + %s 
            WHERE username = %s
        """, (points_change, username))

        return True, "任务状态更新成功"


@handle_db_errors
def soft_delete_task(username: str, task_id: str) -> Tuple[bool, str]:
    """更新任务状态"""
    with get_cursor() as cursor:
        # 验证任务所有权
        cursor.execute("""
            SELECT id, points 
            FROM task 
            WHERE id = %s AND username = %s 
        """, (task_id, username))
        task = cursor.fetchone()
        if not task:
            return False, "任务不存在或无权操作"

        # 更新任务状态
        cursor.execute("""
            UPDATE task SET 
                is_delete = %s,
                deleted_at = %s
            WHERE id = %s
        """, (1, datetime.now(), task_id))

        return True, "任务软删除成功"


@handle_db_errors
def get_tasks(username: str, include_deleted: bool = False) -> Tuple[bool, Union[List[Dict], str]]:
    """获取用户任务列表"""
    with get_cursor() as cursor:
        sql = """
                SELECT id, title, points, is_completed,
                       created_at, completed_at
                FROM task
                WHERE username = %s
            """
        params = [username, ]
        if not include_deleted:
            sql += " AND is_delete = 0"

        sql += " ORDER BY created_at DESC"
        cursor.execute(sql, params)
        tasks = [_format_dates(task, ['created_at', 'completed_at'])
                 for task in cursor.fetchall()]
        return True, tasks


@handle_db_errors
def find_today_record(username: str):
    with get_cursor() as cursor:
        today = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("""
            SELECT task_title,point,finish_date 
            FROM record 
            WHERE username = %s AND finish_date = %s
          """, (username, today))
        record = cursor.fetchall()
        return record


def count_today_points(username: str) -> int:
    records = find_today_record(username)
    count = 0
    if records is not None:
        for record in records:
            count += int(record['point'])  # 使用正确的键名
    return count


# ==================== 打卡服务 ====================
@handle_db_errors
def get_checkins(username: str) -> Tuple[bool, Union[List[Dict], str]]:
    with get_cursor() as cursor:
        sql = """
                SELECT id, points,checkin_date
                FROM checkin
                WHERE username = %s
            """
        params = [username]
        cursor.execute(sql, params)
        checkins = cursor.fetchall()
        return True, checkins


@handle_db_errors
def get_differences_checkin_date(username: str) -> bool | int:
    # 获取今天的日期
    today = datetime.now().date()
    with get_cursor() as cursor:
        success, result = get_checkins(username)

        # 确保result不为空且包含至少一个元素
        if result is None:
            return False

        # 获取最后一个签到日期
        last_checkin_date = result[-1]['checkin_date']
        # 计算日期差
        date_difference = (today - last_checkin_date).days

        return date_difference


@handle_db_errors
def is_checkin_today(username: str) -> bool:
    with get_cursor() as cursor:
        # 检查今日是否已打卡
        result = get_differences_checkin_date(username)
        if result == 0:
            return True
        return False


@handle_db_errors
def checkin_service(username: str, point: int) -> Tuple[bool, Union[int, str]]:
    """每日打卡"""
    with get_cursor() as cursor:
        # 检查今日是否已打卡
        today = datetime.now().strftime("%Y-%m-%d")
        result = get_differences_checkin_date(username)
        if result is not False and result == 0:
            return True, "今日已打卡"

        # 添加打卡记录
        cursor.execute("""
            INSERT INTO checkin (username, checkin_date, points, created_at)
            VALUES (%s, %s, %s, %s)
        """, (username, today, point, datetime.now()))

        cursor.execute("""
            INSERT INTO record (username, task_title, point, finish_time, finish_date,kind)
            VALUES (%s, %s, %s, %s, %s)
        """, (username, "每日打卡", point, datetime.now(), today, "获取"))

        # 更新用户积分
        cursor.execute("""
            UPDATE user 
            SET points = points + %s,
                all_day = all_day + 1
            WHERE username = %s
        """, (point, username))
        if result is None | result >= 2:
            cursor.execute("""
            UPDATE user 
            SET streak_day = 1
            WHERE username = %s
        """, (username,))
            return True, "成功打卡第一天"
        else:
            cursor.execute("""
            UPDATE user 
            SET streak_day = streak_day +1
            WHERE username = %s
        """, (username,))
            success, user_result = get_user_by_username(username)
            day = int(user_result['streak_day']) + 1
            return True, "成功打卡第" + str(day) + "天"


# ==================== 心愿单任务 ====================
@handle_db_errors
def create_wish(username: str, required: int, title: str) -> bool:
    with get_cursor() as cursor:
        success, result = get_user_by_username(username)
        if not success:
            return False
        cursor.execute("""
            INSERT INTO wish (username, title, required, is_fulfilled, created_at, fulfilled_at,is_deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (username, title, required, 0, datetime.now(), None, 0))
    return True


@handle_db_errors
def find_wish_by_username(username: str, include_deleted: bool = False) -> Tuple[bool, Union[List[Dict], str]]:
    """获取用户心愿单列表"""
    with get_cursor() as cursor:
        sql = """
                SELECT id, title, required, is_fulfilled,
                       created_at, fulfilled_at, is_deleted
                FROM wish
                WHERE username = %s
            """
        params = [username]

        if not include_deleted:
            sql += " AND is_deleted = 0"  # 注意这里应该是 is_deleted 而不是 is_delete

        sql += " ORDER BY created_at DESC"

        cursor.execute(sql, params)
        wishes = [_format_dates(wish, ['created_at', 'fulfilled_at'])
                  for wish in cursor.fetchall()]
        return True, wishes


@handle_db_errors
def soft_delete_wishes(username: str, task_id: str) -> Tuple[bool, str]:
    """更新任务状态"""
    with get_cursor() as cursor:
        # 验证任务所有权
        cursor.execute("""
            SELECT id, required 
            FROM wish 
            WHERE id = %s AND username = %s 
        """, (task_id, username))
        wish = cursor.fetchone()
        if not wish:
            return False, "任务不存在或无权操作"

        # 更新任务状态
        cursor.execute("""
            UPDATE wish SET 
                is_deleted = %s,
                 deleted_date = %s
            WHERE id = %s
        """, (1, datetime.now(), task_id))

        return True, "任务软删除成功"


@handle_db_errors
def edit_wish_service(username: str, wish_id: str, points: str, title: str) -> Tuple[bool, str]:
    with get_cursor() as cursor:
        # 验证任务所有权
        cursor.execute("""
            SELECT id, required 
            FROM wish 
            WHERE id = %s AND username = %s 
        """, (wish_id, username))
        wish = cursor.fetchone()
        if not wish:
            return False, "任务不存在或无权操作"

        # 更新任务状态
        cursor.execute("""
            UPDATE wish SET 
                title = %s,
                required = %s,
                created_at = %s
            WHERE id = %s
        """, (title, points, datetime.now(), wish_id))
        return True, "编辑任务成功"


@handle_db_errors
def redeem_wish_service(username: str, points: int, wishid: str) -> Tuple[bool, Union[int, str]]:
    with get_cursor() as cursor:
        today = datetime.now().strftime("%Y-%m-%d")
        success, user = get_user_by_username(username)
        if not success:
            return False, "用户获取失败"
        if user['points'] < points:
            return False, "用户积分不足"

        # 开始事务
        cursor.execute("BEGIN")

        try:
            # 更新用户积分
            cursor.execute("""
            UPDATE user 
            SET points = points - %s
            WHERE username = %s
            """, (points, username))

            # 兑换心愿单
            cursor.execute("""
            UPDATE wish 
            SET is_fulfilled = 1
            WHERE id = %s 
            """, (wishid,))

            # 插入记录
            cursor.execute("""
            INSERT INTO record (username, task_title, point, finish_time, finish_date, kind)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, (username, "每日打卡", points, datetime.now(), today, "消耗"))

            # 提交事务
            cursor.execute("COMMIT")
            return True, "心愿兑换成功！"
        except Exception as e:
            # 回滚事务
            cursor.execute("ROLLBACK")
            return False, str(e)


# ==================== 定时任务 ====================
def empty_task() -> Tuple[bool, str]:
    """将所有任务的is_completed属性设置为0"""
    with get_cursor() as cursor:
        # 更新所有任务的is_completed属性为0
        cursor.execute("""
            UPDATE task 
            SET is_completed = 0,
                completed_at = NULL
        """)
        return True, "所有任务状态已重置为未完成"
