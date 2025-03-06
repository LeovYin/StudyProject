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

def delete_task(username,id):

