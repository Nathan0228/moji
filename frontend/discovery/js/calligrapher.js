const params =
  new URLSearchParams(
    location.search
  );

const id =
  Number(
    params.get("id")
  );

async function loadMaster() {

  const res =
    await fetch(
      "../data/calligraphers.json"
    );

  const list =
    await res.json();

  const master =
    list.find(
      item => item.id === id
    );

  if (!master) return;

  document.title =
    master.name +
    " - 墨迹";

  const avatarEl = document.getElementById("masterAvatar");
  avatarEl.src = normalizeAssetPath(master.avatar) || "../images/default-avatar.png";
  avatarEl.onerror = function() {
    this.onerror = null;
    this.src = "../images/default-avatar.png";
  };

  document.getElementById(
    "masterName"
  ).textContent =
    master.name;

  document.getElementById(
    "masterDynasty"
  ).textContent =
    master.dynasty;

  document.getElementById(
    "masterIntro"
  ).textContent =
    master.introduction;

  document.getElementById(
    "masterQuote"
  ).textContent =
    master.quote;

  document.getElementById(
    "masterComment"
  ).textContent =
    master.comment;

  // 特点

  document.getElementById(
    "masterFeatures"
  ).innerHTML =
    master.features
      .map(
        item =>
        `<span>${item}</span>`
      )
      .join("");

  // 时间线

  document.getElementById(
    "masterTimeline"
  ).innerHTML =
    master.timeline
      .map(
        item =>
        `
        <div class="timeline-item">

          <div class="year">
            ${item.year}
          </div>

          <div class="event">
            ${item.event}
          </div>

        </div>
        `
      )
      .join("");

  // 作品

  const worksEl = document.getElementById("masterWorks");
  worksEl.innerHTML = master.works.map(item => {
    const img = normalizeAssetPath(item.image) || "../images/default-cover.png";
    return `
      <div class="work-item">
        <img src="${img}" alt="${item.name}" onerror="this.onerror=null;this.src='../images/default-cover.png'">
        <p>${item.name}</p>
      </div>
    `;
  }).join("");

function normalizeAssetPath(path) {
  if (!path) return "";
  if (path.startsWith("./")) return path.replace(/^\.\//, "../");
  return path;
}
}

loadMaster();