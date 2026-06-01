const worksContainer =
  document.getElementById(
    "worksContainer"
  );

const uploadBtn =
  document.querySelector(".upload-btn");

// API地址 (可由 frontend/js/config.js 在构建/部署时注入覆盖)
const BASE_URL = window.APP_CONFIG?.BASE_URL || "http://localhost:8080/api";

function navigateTo(target) {

  if (!target) return;

  window.location.href = target;
}

function createPlaceholderImage() {

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#f5efe7"/>
      <rect x="40" y="40" width="720" height="520" rx="24" fill="#fbf8f4" stroke="#e4ddd0" stroke-dasharray="8 8"/>
      <circle cx="260" cy="250" r="52" fill="#d8c8bc"/>
      <rect x="340" y="188" width="300" height="28" rx="14" fill="#d8c8bc"/>
      <rect x="340" y="236" width="230" height="18" rx="9" fill="#e4d8cf"/>
      <rect x="82" y="430" width="636" height="18" rx="9" fill="#e4d8cf"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.trim())}`;
}

function renderLoadingState() {

  worksContainer.innerHTML = `
    <div class="works-loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">作品正在加载中</p>
    </div>
  `;
}

function renderEmptyState() {

  worksContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">✦</div>
      <h3 class="empty-state-title">还没有作品</h3>
      <p class="empty-state-text">
        这里还空空如也，快上传第一件书法作品吧。
      </p>
      <a class="empty-state-cta" href="./upload.html">
        立即上传
      </a>
    </div>
  `;
}

function navigateToDetail(work) {

  const params = new URLSearchParams({
    id: work.ID
  });

  window.location.href = `./detail.html?${params.toString()}`;
}

// Header user UI
const homeLoginBtn = document.getElementById("homeLoginBtn");
const headerUser = document.getElementById("headerUser");
const headerAvatar = document.getElementById("headerAvatar");
const headerUsername = document.getElementById("headerUsername");

function updateHeaderAuthUI() {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  if (!token || !user) {
    // not logged in: hide upload, show login button
    if (uploadBtn) uploadBtn.style.display = "none";
    if (homeLoginBtn) homeLoginBtn.style.display = "inline-block";
  } else {
    // logged in: show upload, hide login button
    if (uploadBtn) uploadBtn.style.display = "inline-block";
    if (homeLoginBtn) homeLoginBtn.style.display = "none";
  }

  // keep headerUser hidden on homepage regardless of auth state
  if (headerUser) headerUser.style.display = "none";

  // attach click handlers
  if (homeLoginBtn) {
    homeLoginBtn.onclick = () => navigateTo("./login.html");
  }

  if (uploadBtn) {
    uploadBtn.onclick = () => {
      const tokenNow = localStorage.getItem("token");
      if (!tokenNow) {
        navigateTo("./login.html");
      } else {
        navigateTo(uploadBtn.dataset.href);
      }
    };
  }
}

updateHeaderAuthUI();

// 获取作品列表
async function loadWorks() {

  renderLoadingState();

  try {

    const response =
      await fetch(
        `${BASE_URL}/work`
      );

    if (!response.ok) {

      throw new Error(
        `作品列表请求失败: ${response.status}`
      );
    }

    const result =
      await response.json();

    const works = Array.isArray(result.data)
      ? result.data
      : [];

    if (works.length === 0) {
      renderEmptyState();
      return;
    }

    worksContainer.innerHTML = "";

    const lazyObserver = new IntersectionObserver((entries, observer) => {

      entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const image = entry.target;

        const originalSrc = image.dataset.src;

        if (originalSrc) {
          image.src = originalSrc;
          image.removeAttribute("data-src");
        }

        observer.unobserve(image);
      });
    }, {
      rootMargin: "200px 0px"
    });

    works.forEach(work => {

      const card =
        document.createElement("div");

      card.className = "work-card";

      card.dataset.id = work.ID;

      const image = document.createElement("img");
      image.dataset.src = work.ImageURL;
      image.src = createPlaceholderImage();
      image.alt = work.Title || "作品图片";
      image.loading = "lazy";

      const info = document.createElement("div");
      info.className = "work-info";

      info.innerHTML = `
        <h3>${work.Title || "未命名作品"}</h3>
        <p>${work.StyleType || "未知书体"}</p>
      `;

      card.appendChild(image);
      card.appendChild(info);

      card.addEventListener("click", () => {
        navigateToDetail(work);
      });

      lazyObserver.observe(image);
      worksContainer.appendChild(card);
    });

  } catch (error) {

    console.error(error);

    worksContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠</div>
        <h3 class="empty-state-title">作品加载失败</h3>
        <p class="empty-state-text">
          连接出错了，稍后再试试看。
        </p>
      </div>
    `;
  }
}

// 页面加载
loadWorks();