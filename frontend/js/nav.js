const bottomNavHost = document.getElementById("bottomNavHost");

if (bottomNavHost) {
  const navMarkup = `
    <nav class="bottom-nav">
      <div class="nav-item" data-href="./index.html">
        <span>首页</span>
      </div>

      <div class="nav-item" data-href="./timeline.html">
        <span>时间轴</span>
      </div>

      <div class="nav-item upload-center" data-href="./upload.html">
        ＋
      </div>

      <div class="nav-item" data-href="./discovery.html">
        <span>发现</span>
      </div>

      <div class="nav-item" data-href="./profile.html">
        <span>我的</span>
      </div>
    </nav>
  `;

  bottomNavHost.innerHTML = navMarkup;

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".bottom-nav .nav-item").forEach((item) => {
    const href = item.dataset.href || "";
    const page = href.replace("./", "");

    if (page === currentPage) {
      item.classList.add("active");
    }

    item.addEventListener("click", () => {
      window.location.href = href;
    });
  });
}
