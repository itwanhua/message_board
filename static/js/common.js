"use strict";

$(function() {
    var uname_flag = false;
    var passwd1_flag = false;
    var passwd2_flag = false;
    var email_flag = false;
    var phone_flag = false;
    var code_flag = false;
    $("#uname").blur(function() {
        var uname = $(this).val();

        // 用户名格式校验
        if (uname.trim() === "") {
            $("#uname_tips").css("color", "red")
            $("#uname_tips").text("用户名不能为空!")
            return;
        }

        if (/[\u4E00-\u9FFF]/.test(uname)) {
            $("#uname_tips").css("color", "red")
            $("#uname_tips").text("用户名不能含中文!")
            return;
        }

        if (uname.length < 4 || uname.length > 20) {
            $("#uname_tips").css("color", "red")
            $("#uname_tips").text("用户名长度为4~20！")
            return;
        }

        if (! /^[a-zA-Z0-9_]+$/.test(uname)) {
            $("#uname_tips").css("color", "red")
            $("#uname_tips").text("用户名为数字字母下划线")
            return;
        }

        // 通过Ajax技术连接服务器后端校验用户名是否已被注册
        $.ajax({
            url: "/check_uname",
            data: {
                uname: uname
            },
            success: function(data){
                if (data["err"] === 0){
                    // 用户名没有被注册
                    $("#uname_tips").css("color", "green");
                    $("#uname_tips").text("√");
                    uname_flag = true;
                } else if (data["err"] === 1) {
                    // 用户名已经被注册
                    $("#uname_tips").css("color", "red");
                    $("#uname_tips").text("用户名已经被注册！");
                }
            }
        });
    });

    // 密码校验
    $("#passwd1").blur(function() {
        var passwd1 = $(this).val();

        // 密码格式校验
        if (passwd1.trim() === "") {
            $("#passwd1_tips").css("color", "red");
            $("#passwd1_tips").text("密码不能为空!");
            return;
        }

        if (passwd1.length < 6 || passwd1.length > 15) {
            $("#passwd1_tips").css("color", "red");
            $("#passwd1_tips").text("密码长度为6~15！");
            return;
        }

        if (! /^[a-zA-Z0-9_?!/*-+.]+$/.test(passwd1)) {
            $("#passwd1_tips").css("color", "red");
            $("#passwd1_tips").text("密码中含无效字符！");
            return;
        }
        $("#passwd1_tips").text("");
        passwd1_flag = true;
    });

    //密码确认校验
    $("#passwd2").blur(function() {
        var passwd1 = $("#passwd1").val();
        var passwd2 = $(this).val();
        if (!(passwd2 === passwd1)) {
            $("#passwd2_tips").css("color", "red");
            $("#passwd2_tips").text("两次密码不一致！");
            return;
        }
        $("#passwd2_tips").text("");
        passwd2_flag = true;
    });

    // 邮箱校验
    $("#email").blur(function() {
        var email = $(this).val();
        if (email.trim() === "") {
            $("#email_tips").css("color", "red");
            $("#email_tips").text("邮箱不能为空！");
            return;
        }
        if (! /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(email)) {
            $("#email_tips").css("color", "red");
            $("#email_tips").text("邮箱格式有误！");
            return;
        }
        $("#email_tips").text("");
        email_flag = true;
    });


    $("#send_sms_code").click(function() {
        // 给服务器发送一个消息
        var phone = $("#phone").val();

        if (! /1\d{10}/.test(phone)) {
            $("#phone_tips").css("color", "red");
            $("#phone_tips").text("手机号有误！");
            // alert("手机号格式错误！");
            $("#phone").focus();
            return;
        }
        $("#phone_tips").text("");
        phone_flag = true;

        // 通过ajax将手机号发送给服务器后端程序
        $.ajax({
            type: "POST",
            url: "/phone",
            data: {
                phone: $("#phone").val()
            },
            dataType: "json",
            success: function(data) {
                if (data["err"] === 0) {
                    // 成功
                    $("#verify_code").removeAttr("disabled");
                    $("#verify_code").focus();

                    var s = 60;
                    $("#send_sms_code").prop("disabled", true);
                    $("#send_sms_code").html(s + "S");
                    
                    var timer = window.setInterval(function() {
                        --s;
                        if (s === 0) {
                            window.clearInterval(timer);
                            $("#send_sms_code").html("重新发送");
                            $("#send_sms_code").prop("disabled", false);
                            return;
                        }

                        $("#send_sms_code").html(s + "S");
                    }, 1000);
                }
                else {
                    // 失败
                    alert("发送验证码失败！" + data["desc"]);
                }
            },
            error: function() {
                alert("发送请求失败，请检查网络连接！");
            }
        });

    });

    //验证码格式校验
    $("#verify_code").blur(function() {
        var verify_code = $(this).val();
        if (! /\d{6}/.test(verify_code)) {
            $("#code_tips").css("color", "red");
            $("#code_tips").text("验证码为6位数字！");
            return;
        }
        $("#code_tips").text("");
        code_flag = true;
    });

    $("#submit").click(function() {
        if (!(uname_flag && passwd1_flag && passwd2_flag && email_flag && phone_flag && code_flag)){
            alert("请输入完整信息！")
            return false;
        }
        return true;
    });

});