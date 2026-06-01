import { timeAgo } from "./utils/time.js";

const BASE_URL = window.APP_CONFIG?.BASE_URL || "http://localhost:8080/api";

const timelineFeed = document.getElementById("timelineFeed");
const timelineCount = document.getElementById("timelineCount");
const timelineDayCount = document.getElementById("timelineDayCount");

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

function navigateToDetail(work) {

  const params = new URLSearchParams({
    id: work.ID
  });

  window.location.href = `./detail.html?${params.toString()}`;
}

function formatDayKey(date) {

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year}年${month}月${day}日`;
}

function formatDayLabel(date) {

  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatWeekday(date) {

  return new Intl.DateTimeFormat("zh-CN", {
    weekday: "short"
  }).format(date);
}

function renderEmptyState(message = "还没有作品记录，先上传一件作品吧。") {

  timelineFeed.innerHTML = `
    <div class="timeline-empty">
      <p>${message}</p>
    </div>
  `;
}

async function loadTimeline() {

  try {

    const token = localStorage.getItem("token");

    if (!token) {
      renderEmptyState("请先登录以查看你的时间轴");
      return;
    }

    const response = await fetch(`${BASE_URL}/work/my`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.message || `时间轴请求失败: ${response.status}`;
      throw new Error(message);
    }

    const result = await response.json();

    const works = Array.isArray(result.data)
      ? result.data
      : [];

    const sortedWorks = [...works].sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

    timelineCount.textContent = sortedWorks.length;

    const groupedWorks = new Map();

    sortedWorks.forEach(work => {

      const addedAt = new Date(work.CreatedAt);
      const dayKey = formatDayKey(addedAt);

      if (!groupedWorks.has(dayKey)) {
        groupedWorks.set(dayKey, []);
      }

      groupedWorks.get(dayKey).push(work);
    });

    timelineDayCount.textContent = groupedWorks.size;

    if (sortedWorks.length === 0) {
      renderEmptyState();
      return;
    }

    timelineFeed.innerHTML = "";

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

    const dayEntries = Array.from(groupedWorks.entries());

    dayEntries.forEach(([dayKey, dayWorks], index) => {

      const daySection = document.createElement("section");
      daySection.className = "timeline-month";

      const details = document.createElement("details");
      details.className = "timeline-month-group";
      details.open = index === 0;

      const summary = document.createElement("summary");
      summary.className = "timeline-month-summary";

      const daySummaryCopy = document.createElement("div");
      daySummaryCopy.className = "month-summary-copy";

      const dayTitle = document.createElement("h4");
      dayTitle.textContent = dayKey;

      const dayDesc = document.createElement("p");
      dayDesc.textContent = `${dayWorks.length} 篇作品记录`;

      daySummaryCopy.appendChild(dayTitle);
      daySummaryCopy.appendChild(dayDesc);

      summary.appendChild(daySummaryCopy);

      const monthContent = document.createElement("div");
      monthContent.className = "month-content";

      dayWorks.forEach(work => {

        const entry = document.createElement("article");
        entry.className = "timeline-entry";

        const addedAt = new Date(work.CreatedAt);

        const dateBlock = document.createElement("div");
        dateBlock.className = "timeline-entry-date";

        const day = document.createElement("div");
        day.className = "day";
        day.textContent = addedAt.getDate();

        const weekday = document.createElement("div");
        weekday.className = "weekday";
        weekday.textContent = formatWeekday(addedAt);

        dateBlock.appendChild(day);
        dateBlock.appendChild(weekday);

        const body = document.createElement("div");
        body.className = "timeline-entry-body";

        const image = document.createElement("img");
        image.className = "timeline-entry-image";
        image.dataset.src = work.ImageURL || "";
        image.src = createPlaceholderImage();
        image.alt = work.Title || "作品图片";
        image.loading = "lazy";

        const copy = document.createElement("div");
        copy.className = "timeline-entry-copy";

        const itemTitle = document.createElement("h5");
        itemTitle.textContent = work.Title || "未命名作品";

        const itemContent = document.createElement("p");
        itemContent.textContent = work.Content || "这是一段书法记录。";

        const meta = document.createElement("div");
        meta.className = "timeline-entry-meta";

        const styleTag = document.createElement("span");
        styleTag.className = "timeline-tag";
        styleTag.textContent = work.StyleType || "未知书体";

        const dayTag = document.createElement("span");
        dayTag.className = "timeline-tag";
        dayTag.textContent = timeAgo(work.CreatedAt);

        meta.appendChild(styleTag);
        meta.appendChild(dayTag);

        copy.appendChild(itemTitle);
        copy.appendChild(itemContent);
        copy.appendChild(meta);

        body.appendChild(image);
        body.appendChild(copy);

        entry.appendChild(dateBlock);
        entry.appendChild(body);

        entry.addEventListener("click", () => navigateToDetail(work));

        lazyObserver.observe(image);
        monthContent.appendChild(entry);
      });

      details.appendChild(summary);
      details.appendChild(monthContent);
      daySection.appendChild(details);
      timelineFeed.appendChild(daySection);
    });

    const observedEntries = document.querySelectorAll(".timeline-entry");

    observedEntries.forEach((entry, index) => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          entry.classList.add("visible");
        }, index * 90);
      });
    });

  } catch (error) {

    console.error(error);

    timelineFeed.innerHTML = `
      <div class="timeline-empty">
        <p>作品加载失败，请稍后再试。</p>
      </div>
    `;
  }
}

loadTimeline();