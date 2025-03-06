import pymysql
from datetime import datetime

# 建立数据库连接
conn = pymysql.connect(host='localhost', port=3306, user='root', password="776868312",
                       database='studyproject', charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor)


def insert_task(username, title, point):
    try:
        with conn.cursor() as cursor:
            # 直接插入任务，使用username关联
            insert_sql = """
                INSERT INTO task (
                    username, 
                    title, 
                    points, 
                    created_at,
                    is_completed,
                    completed_at
                ) VALUES (%s, %s, %s, %s, %s, %s)
            """
            # 准备插入数据
            created_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            task_data = (
                username,
                title,
                point,
                created_at,
                0,  # 默认未完成
                None  # 完成时间为空
            )

            cursor.execute(insert_sql, task_data)
            inserted_id = cursor.lastrowid  # 获取插入ID

            # 提交事务
            conn.commit()

            return True, inserted_id

    except pymysql.Error as e:
        conn.rollback()  # 回滚事务
        error_msg = f"数据库操作失败：{str(e)}"
        print(error_msg)
        return False, error_msg
    except Exception as e:
        conn.rollback()
        error_msg = f"系统错误：{str(e)}"
        print(error_msg)
        return False, error_msg


def delete_task(username, task_id):
    try:
        with conn.cursor() as cursor:
            # 第一步：验证任务是否属于该用户且未被删除
            check_sql = """
                SELECT id FROM task 
                WHERE id = %s AND username = %s AND is_delete = 0
            """
            cursor.execute(check_sql, (task_id, username))
            task = cursor.fetchone()

            if not task:
                return False, "任务不存在、不属于该用户或已被删除"

            # 第二步：标记为删除
            update_sql = """
                UPDATE task 
                SET is_delete = 1, deleted_at = %s
                WHERE id = %s AND username = %s
            """
            deleted_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # 记录删除时间
            cursor.execute(update_sql, (deleted_at, task_id, username))

            # 提交事务
            conn.commit()

            return True, "任务软删除成功"

    except pymysql.Error as e:
        conn.rollback()  # 回滚事务
        error_msg = f"数据库操作失败：{str(e)}"
        print(error_msg)
        return False, error_msg
    except Exception as e:
        conn.rollback()
        error_msg = f"系统错误：{str(e)}"
        print(error_msg)
        return False, error_msg

def delete_all_tasks(username):

    try:
        with conn.cursor() as cursor:
            # 标记所有任务为删除
            update_sql = """
                UPDATE task 
                SET is_delete = 1, deleted_at = %s
                WHERE username = %s AND is_delete = 0
            """
            deleted_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # 记录删除时间
            cursor.execute(update_sql, (deleted_at, username))

            # 提交事务
            conn.commit()

            return True, "所有任务软删除成功"

    except pymysql.Error as e:
        conn.rollback()  # 回滚事务
        error_msg = f"数据库操作失败：{str(e)}"
        print(error_msg)
        return False, error_msg
    except Exception as e:
        conn.rollback()
        error_msg = f"系统错误：{str(e)}"
        print(error_msg)
        return False, error_msg


def soft_delete_task_by_id(task_id):
    try:
        with conn.cursor() as cursor:
            # 第一步：检查任务是否存在且未被删除
            check_sql = "SELECT id FROM task WHERE id = %s AND is_delete = 0"
            cursor.execute(check_sql, (task_id,))
            task = cursor.fetchone()

            if not task:
                return False, "任务不存在或已被删除"

            # 第二步：标记为删除
            update_sql = """
                UPDATE task 
                SET is_delete = 1, deleted_at = %s
                WHERE id = %s
            """
            deleted_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")  # 记录删除时间
            cursor.execute(update_sql, (deleted_at, task_id))

            # 提交事务
            conn.commit()

            return True, "任务软删除成功"

    except pymysql.Error as e:
        conn.rollback()  # 回滚事务
        error_msg = f"数据库操作失败：{str(e)}"
        print(error_msg)
        return False, error_msg
    except Exception as e:
        conn.rollback()
        error_msg = f"系统错误：{str(e)}"
        print(error_msg)
        return False, error_msg


