#/usr/bin/python3
# -*- coding: utf-8 -*-

import os, re, datetime
import urllib
import json
import random
from flask import Flask, render_template, request, jsonify, session, abort, redirect, url_for, Response
import pymysql

phone_code = []

app = Flask(__name__)
app.secret_key = os.urandom(24)

db = pymysql.Connect(host="localhost", user="wh", passwd="wh123", db="goodsdb")


@app.route("/reg", methods=["GET", "POST"])
def reg_handler():
    if request.method == "GET":
        return render_template("reg.html")

    elif request.method == "POST":
        uname = request.form.get("uname")
        upass = request.form.get("passwd1")
        upass2 = request.form.get("passwd2")
        email = request.form.get("email")
        phone = request.form.get("phone")
        verify_code = request.form.get("verify_code")

        if not (uname and uname.strip() and upass and upass2 and phone and verify_code and email):
            abort(500)

        if not re.fullmatch("[a-zA-Z0-9_]{4,20}", uname):
            abort(Response("用户名不合法！"))

        cur = db.cursor()
        cur.execute("select uid from mb_user where uname=%s", (uname,))
        res = cur.rowcount
        if res != 0:
            # 用户名已经被注册
            abort(Response("用户名已经被注册！"))
        cur.close()

        # 密码长度介于6-15
        if not (len(upass) >= 6 and len(upass) <= 15 and upass == upass2):
            abort(Response("密码错误！"))

        if session.get(phone) != verify_code:
            abort(Response("短信验证码错误！"))

        if not re.fullmatch(r"^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$", email):
            abort(Response("邮箱格式有误！"))

        try:
            cur = db.cursor()
            cur.execute("insert into mb_user values (default, %s, md5(%s), %s, %s, sysdate(), sysdate(), '1', '1')", (uname, uname + upass, phone, email, ))
            cur.close()
            db.commit()
        except:
            db.rollback()
            abort(Response("注册失败！"))

        session.pop(phone)
        # 注册成功！跳转登录页面
        return redirect(url_for("login_handler"))


@app.route("/user_center")
def user_center():
    user_info = session.get("user_info")
    if user_info:
        return render_template("user_center.html", uname=user_info.get("uname"))
    else:
        return redirect(url_for("login_handler"))

@app.route("/logout")
def logout_handler():
    res = {"err": 1, "desc": "未登录！"}
    if session.get("user_info"):
        session.pop("user_info")
        res["err"] = 0
        res["desc"] = "注销成功！"
    return jsonify(res)

@app.route("/message_board", methods=["GET", "POST"])
def message_board_handler():
    if request.method == "GET":
        cur = db.cursor()
        cur.execute("select uname, pub_time, content, cid from mb_message, mb_user where mb_user.uid = mb_message.uid")
        res = cur.fetchall()
        cur.close()
        return render_template("message_board.html", messages=res)

    elif request.method == "POST":
        user_info = session.get("user_info")
        if not user_info:
            abort(Response("未登录！"))
        content = request.form.get("content")
        if content:
            content = content.strip()
            if 0 < len(content) <= 200:
                # 将留言保存到数据库
                uid = user_info.get("uid")
                pub_time = datetime.datetime.now()
                from_ip = request.remote_addr

                try:
                    cur = db.cursor()
                    cur.execute("insert into mb_message (uid, content, pub_time, from_ip) values (%s, %s, %s, %s)", (uid, content, pub_time, from_ip, ))
                    cur.close()
                    db.commit()
                    return redirect(url_for("message_board_handler"))
                except Exception as e:
                    db.rollback()
                    print(e)

        abort(Response("留言失败！"))


@app.route("/login", methods=["GET", "POST"])
def login_handler():
    if request.method == "GET":
        return render_template("login.html")
    elif request.method == "POST":
        uname = request.form.get("uname")
        upass = request.form.get("passwd1")

        if not (uname and uname.strip() and upass and upass.strip()):
            abort(Response("登录失败！"))

        if not re.fullmatch("[a-zA-Z0-9_]{4,20}", uname):
            abort(Response("用户名不合法！"))

        # 密码长度介于6-15
        if not (len(upass) >= 6 and len(upass) <= 15):
            abort(Response("密码不合法！"))

        cur = db.cursor()
        cur.execute("select * from mb_user where uname=%s and upass=md5(%s)", (uname, uname + upass))
        res = cur.fetchone()
        cur.close()
        if res:
            # 登录成功！跳转到用户个人中心
            cur_login_time = datetime.datetime.now()
            session["user_info"] = {
                "uid": res[0],
                "uname": res[1],
                "upass": res[2],
                "phone": res[3],
                "email": res[4],
                "reg_time": res[5],
                "last_login_time": res[6],
                "priv": res[7],
                "state": res[8],
                "cur_login_time": cur_login_time
            }

            try:
                cur = db.cursor()
                cur.execute("update mb_user set last_login_time=%s where uid=%s", (cur_login_time, res[0], ))
                cur.close()
                db.commit()
            except Exception as e:
                db.rollback()
                print(e)


            return redirect(url_for("user_center"))
        else:
            # 登录失败！
            return render_template("login.html", login_fail=1)



@app.route("/check_uname")
def check_uname():
    uname = request.args.get("uname")

    if not uname:
        abort(500)

    result = {"err": 1, "desc": "用户名已被注册！"}

    cur = db.cursor()
    cur.execute("select uid from mb_user where uname=%s", (uname,))
    if cur.rowcount == 0:
        # 用户名没有重复
        result["err"] = 0
        result["desc"] = "用户名没有被注册！"
    cur.close()
    return jsonify(result)

@app.route("/phone", methods=["POST"])
def phone_handler():
    result = {"err": 1, "desc": "內部错误！"}
    phone = request.form.get("phone")
    print(phone)
    verify_code = send_sms_code(phone)
    if verify_code:
        # 发送成功！
        session[phone] = verify_code
        result["err"] = 0
        result["desc"] = "发送短信验证码成功！"
        phone_code.append(verify_code)
    return jsonify(result)


def send_sms_code(phone):
    '''
    函数功能：发送短信验证码（6位随机数字）
    函数参数：
    phone 接收短信验证码的手机号
    返回值：发送成功返回验证码，失败返回False
    '''
    verify_code = str(random.randint(100000, 999999))

    try:
        url = "http://v.juhe.cn/sms/send"
        params = {
            "mobile": phone,  # 接受短信的用户手机号码
            "tpl_id": "162901",  # 您申请的短信模板ID，根据实际情况修改
            "tpl_value": "#code#=%s" % verify_code,  # 您设置的模板变量，根据实际情况修改
            "key": "ab75e2e54bf3044898459cb209b195e4",  # 应用APPKEY(应用详细页查询)
        }
        params = urllib.parse.urlencode(params).encode()

        f = urllib.request.urlopen(url, params)
        content = f.read()
        res = json.loads(content)

        if res and res['error_code'] == 0:
            return verify_code
        else:
            return False
    except:
        return False

if __name__ == "__main__":
    app.run(port=80, debug=True)