import pymysql

# 建立数据库连接
conn = pymysql.connect(host='localhost', port=3306, user='root', password="776868312",
                       database='studyproject', charset="utf8mb4", cursorclass=pymysql.cursors.DictCursor)


def get_user(username, password):
    sql = "SELECT * FROM user WHERE username = %s AND password = %s"
    try:
        conn.ping(reconnect=True)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute(sql, (username, password))
        result = cursor.fetchone()
        return result
    except pymysql.MySQLError as e:
        return type(e), e
    finally:
        cursor.close()


def get_user_by_username(username):
    sql = "SELECT * FROM user WHERE username = %s"
    try:
        conn.ping(reconnect=True)
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute(sql, (username,))
        result = cursor.fetchone()
        return result
    except pymysql.MySQLError as e:
        return type(e), e
    finally:
        cursor.close()


