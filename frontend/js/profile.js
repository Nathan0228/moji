const BASE_URL =
  window.APP_CONFIG?.BASE_URL ||
  "http://localhost:8080/api";

const token =
  localStorage.getItem("token");

if (!token) {
  window.location.href =
    "./login.html";
}

// =======================
// DOM
// =======================

const avatarEl =
  document.getElementById("avatar");

const usernameEl =
  document.getElementById("username");

const createdAtEl =
  document.getElementById("createdAt");

const workCountEl =
  document.getElementById("workCount");

const avatarInput =
  document.getElementById("avatarInput");

const changeAvatarBtn =
  document.getElementById("changeAvatarBtn");

const logoutBtn =
  document.getElementById("logoutBtn");

// 保存用户作品
let userWorks = [];

// =======================
// 用户信息
// =======================

async function loadUserInfo() {

  try {

    const res = await fetch(
      `${BASE_URL}/user/info`,
      {
        headers: {
          Authorization:
            "Bearer " + token
        }
      }
    );

    if (!res.ok) return;

    const result =
      await res.json();

    const user =
      result.data || {};

    usernameEl.textContent =
      user.username || "用户";

    avatarEl.src =
      user.avatar ||
      "./images/default_avatar.webp";

    createdAtEl.textContent =
      `加入墨迹于 ${formatDate(
        user.created_at
      )}`;

  } catch (err) {

    console.error(err);

  }

}

// =======================
// 用户作品
// =======================

async function loadUserWorks() {

  try {

    const res = await fetch(
      `${BASE_URL}/work/my`,
      {
        headers: {
          Authorization:
            "Bearer " + token
        }
      }
    );

    if (!res.ok) return;

    const result =
      await res.json();

    userWorks =
      result.data || [];

    workCountEl.textContent =
      `${userWorks.length}篇作品`;

    buildCalendar(userWorks);

  } catch (err) {

    console.error(err);

  }

}

// =======================
// 上传头像
// =======================

changeAvatarBtn?.addEventListener(
  "click",
  () => {

    avatarInput.click();

  }
);

avatarInput?.addEventListener(
  "change",
  async (e) => {

    const file =
      e.target.files[0];

    if (!file) return;

    const formData =
      new FormData();

    formData.append(
      "avatar",
      file
    );

    try {

      const res =
        await fetch(
          `${BASE_URL}/user/avatar`,
          {
            method: "POST",
            headers: {
              Authorization:
                "Bearer " + token
            },
            body: formData
          }
        );

      const result =
        await res.json();

      if (res.ok) {

        avatarEl.src =
          result.url;

      } else {

        alert(
          result.message
        );

      }

    } catch (err) {

      console.error(err);

    }

  }
);

// =======================
// 退出登录
// =======================

logoutBtn?.addEventListener(
  "click",
  () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    location.href =
      "./login.html";

  }
);

// =======================
// 日期格式化
// =======================

function formatDate(dateStr) {

  if (!dateStr)
    return "---";

  const d =
    new Date(dateStr);

  return `${d.getFullYear()}-${
    String(
      d.getMonth() + 1
    ).padStart(2, "0")
  }-${
    String(
      d.getDate()
    ).padStart(2, "0")
  }`;

}

// =======================
// 热力图
// =======================

function buildCalendar(works) {

  const calendar =
    document.getElementById(
      "contribCalendar"
    );

  const monthLabels =
    document.getElementById(
      "monthLabels"
    );

  if (!calendar) return;

  calendar.innerHTML = "";
  monthLabels.innerHTML = "";

  const countMap = {};

  works.forEach(work => {

    const d =
      new Date(
        work.createdAt ||
        work.CreatedAt
      );

    const key =
      d.toISOString()
       .slice(0, 10);

    countMap[key] =
      (countMap[key] || 0) + 1;

  });

  const today =
    new Date();

  const start =
    new Date();

  start.setDate(
    today.getDate() - 364
  );

  // 月份标签

  let lastMonth = -1;

  for (
    let week = 0;
    week < 53;
    week++
  ) {

    const current =
      new Date(start);

    current.setDate(
      start.getDate() +
      week * 7
    );

    const month =
      current.getMonth();

    const span =
      document.createElement(
        "span"
      );

    if (month !== lastMonth) {

      span.textContent =
        current.toLocaleString(
          "zh-CN",
          {
            month: "short"
          }
        );

      lastMonth = month;

    }

    monthLabels.appendChild(
      span
    );

  }

  let maxCount = 0;

  Object.values(countMap)
    .forEach(v => {

      if (v > maxCount)
        maxCount = v;

    });

  for (
    let week = 0;
    week < 53;
    week++
  ) {

    for (
      let day = 0;
      day < 7;
      day++
    ) {

      const current =
        new Date(start);

      current.setDate(
        start.getDate() +
        week * 7 +
        day
      );

      if (current > today)
        continue;

      const key =
        current
          .toISOString()
          .slice(0,10);

      const count =
        countMap[key] || 0;

      const cell =
        document.createElement(
          "div"
        );

      cell.className =
        "calendar-day";

      let level = 0;

      if (count === 1) {

        level = 1;

      } else if (
        count <= 3 &&
        count > 1
      ) {

        level = 2;

      } else if (
        count <= 5 &&
        count > 3
      ) {

        level = 3;

      } else if (
        count > 5
      ) {

        level = 4;

      }

      cell.classList.add(
        `level-${level}`
      );

      cell.dataset.date =
        key;

      cell.title =
        `${key}
上传 ${count} 篇作品`;

      cell.addEventListener(
        "click",
        () => {
          openDayWorks(key);
        }
      );

      calendar.appendChild(
        cell
      );

    }

  }

}

// =======================
// 查看某天作品
// =======================

function openDayWorks(date) {

  const modal =
    document.getElementById(
      "dayWorksModal"
    );

  const title =
    document.getElementById(
      "modalDate"
    );

  const list =
    document.getElementById(
      "dayWorksList"
    );

  if (
    !modal ||
    !title ||
    !list
  ) return;

  title.textContent =
    date;

  const works =
    userWorks.filter(work => {

      const d =
        new Date(
          work.createdAt ||
          work.CreatedAt
        );

      return (
        d.toISOString()
         .slice(0,10)
        === date
      );

    });

  if (
    works.length === 0
  ) {

    list.innerHTML =
      "<p>当天没有作品</p>";

    } else {

    list.innerHTML = works.map(work => {
      // normalize fields coming from API
      const id = work.ID || work.id;
      const imageUrl = work.ImageURL || work.imageUrl || "";
      const title = work.Title || work.title || "未命名作品";
      const style = work.StyleType || work.style || "";
      const content = work.Content || work.content || "";


      const createdAt = work.CreatedAt || work.createdAt || new Date().toISOString();

      // build detail query params (encode values)
      const params = new URLSearchParams({
        id: id
      }).toString();

      return `
      <div class="day-work-item" data-id="${id}" data-params="${params}">
        <img src="${imageUrl}" alt="">
        <div class="day-work-info">
          <h4>${title}</h4>
          <p>${style}</p>
        </div>
      </div>
      `;
    }).join("");

    // attach click handlers to navigate with full params
    Array.from(list.querySelectorAll('.day-work-item')).forEach(item => {
      const params = item.getAttribute('data-params');
      item.addEventListener('click', () => {
        // navigate to detail with full params
        window.location.href = `detail.html?${params}`;
      });
    });

  }

  modal.classList.remove(
    "hidden"
  );

}

// =======================
// 关闭弹窗
// =======================

document
.getElementById(
  "closeModal"
)
?.addEventListener(
  "click",
  () => {

    document
      .getElementById(
        "dayWorksModal"
      )
      ?.classList.add(
        "hidden"
      );

  }
);

document
.getElementById(
  "dayWorksModal"
)
?.addEventListener(
  "click",
  (e) => {

    if (
      e.target.id ===
      "dayWorksModal"
    ) {

      e.currentTarget
        .classList
        .add("hidden");

    }

  }
);

// =======================
// 初始化
// =======================

loadUserInfo();
loadUserWorks();