const switchMode =
  document.getElementById("switchMode");

const loginBtn =
  document.querySelector(".login-btn");

let isLogin = true;

// API地址 (可通过 frontend/js/config.js 覆盖)
const BASE_URL = window.APP_CONFIG?.BASE_URL || "http://localhost:8080/api";

// 切换登录注册
switchMode.addEventListener("click", () => {

  const title =
    document.querySelector(".login-title h2");

  const btn =
    document.querySelector(".login-btn");

  const confirmPasswordGroup =
    document.getElementById("confirmPasswordGroup");

  if (isLogin) {

    title.innerText = "创建账号";

    btn.innerText = "注册";

    switchMode.innerText = "返回登录";

    // 注册模式：显示确认密码框
    confirmPasswordGroup.style.display = "block";

  } else {

    title.innerText = "欢迎回来";

    btn.innerText = "登录";

    switchMode.innerText = "立即注册";

    // 登录模式：隐藏确认密码框
    confirmPasswordGroup.style.display = "none";

  }

  isLogin = !isLogin;
});

// 点击按钮
loginBtn.addEventListener("click", async () => {

  const username =
    document.getElementById("username").value;

  const password =
    document.getElementById("password").value;

  const confirmPassword =
    document.getElementById("confirmPassword").value;

  // 基础校验
  if (!username || !password) {

    alert("请输入完整信息");
    return;
  }

  if (password.length < 8) {

    alert("密码至少8位");
    return;
  }

  // 注册模式：验证确认密码
  if (!isLogin) {

    if (!confirmPassword) {

      alert("请输入确认密码");
      return;
    }

    if (password !== confirmPassword) {

      alert("两次输入的密码不一致");
      return;
    }
  }

  // 接口地址
  const url = isLogin
    ? `${BASE_URL}/login`
    : `${BASE_URL}/register`;

  try {

    // 请求接口
    const response = await fetch(url, {

      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        username,
        password
      })
    });

    const data =
      await response.json();

    // 登录成功
    if (response.ok) {

      alert(data.message);

      // 登录
      if (isLogin) {

        // 保存 token
        localStorage.setItem(
          "token",
          data.token
        );

        // 保存用户信息
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        // 跳转首页
        window.location.href =
          "./index.html";
      }

      // 注册成功
      else {

        // 自动切回登录
        isLogin = false;

        switchMode.click();
      }

    } else {

      alert(data.message);
    }

  } catch (error) {

    console.error(error);

    alert("服务器连接失败");
  }

});