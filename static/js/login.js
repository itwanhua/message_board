"use strict";

$(function() {
    var uname_flag = false;
    var passwd1_flag = false;
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
        $("#uname_tips").text("")
        uname_flag = true;
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

    $("#submit").click(function() {
        if (!(uname_flag && passwd1_flag)){
            alert("请输入完整信息！")
            return false;
        }
        return true;
    });

});