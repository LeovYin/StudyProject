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
    try:
        with conn.cursor() as cursor:
            yield cursor
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


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
    """更新任务状态"""
    with get_cursor() as cursor:
        # 验证任务所有权
        cursor.execute("""
            SELECT id, points 
            FROM task 
            WHERE id = %s AND username = %s AND is_delete = 0
        """, (task_id, username))
        task = cursor.fetchone()
        if not task:
            return False, "任务不存在或无权操作"

        # 更新任务状态
        cursor.execute("""
            UPDATE task SET 
                is_completed = %s,
                completed_at = CASE WHEN %s THEN NOW() ELSE NULL END
            WHERE id = %s
        """, (completed, completed, task_id))

        # 更新用户积分
        points_change = task['points'] if completed else -task['points']
        cursor.execute("""
            UPDATE user 
            SET points = points + %s 
            WHERE username = %s
        """, (points_change, username))

        return True, "任务状态更新成功"


@handle_db_errors
def soft_delete_task(username: str, task_id: int) -> Tuple[bool, str]:
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
                deleted_at = CASE WHEN %s THEN NOW() ELSE NULL END
            WHERE id = %s
        """, (1, 1, task_id))

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
        params = [username]

        if not include_deleted:
            sql += " AND is_delete = 0"

        sql += " ORDER BY created_at DESC"

        cursor.execute(sql, params)
        tasks = [_format_dates(task, ['created_at', 'completed_at'])
                 for task in cursor.fetchall()]
        return True, tasks


# ==================== 打卡服务 ====================
@handle_db_errors
def checkin(username: str, point: int) -> Tuple[bool, Union[int, str]]:
    """每日打卡"""
    with get_cursor() as cursor:
        # 检查今日是否已打卡
        today = datetime.now().strftime("%Y-%m-%d")
        cursor.execute("""
            SELECT id FROM checkin 
            WHERE username = %s AND date = %s
        """, (username, today))
        if cursor.fetchone():
            return False, "今日已打卡"

        # 添加打卡记录
        cursor.execute("""
            INSERT INTO checkin (username, checkin_date,points)
            VALUES (%s, %s, %d)
        """, (username, today, point))

        # 更新用户积分
        cursor.execute("""
            UPDATE user 
            SET points = points + %d
            WHERE username = %s
        """, (point, username,))

        return True, 5
