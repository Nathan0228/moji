const params =
  new URLSearchParams(
    location.search
  );

const id =
  Number(
    params.get("id")
  );

async function loadCopybook() {

  const res =
    await fetch(
      "../data/copybooks.json"
    );

  const list =
    await res.json();

  const item =
    list.find(
      i => i.id === id
    );

  if (!item) return;

  document.title =
    item.name +
    " - 墨迹";

  document.getElementById(
    "copybookCover"
  ).src =
    normalizeCopybookAssetPath(item.cover);

  document.getElementById(
    "copybookPreview"
  ).src =
    normalizeCopybookAssetPath(item.preview || item.cover);

function normalizeCopybookAssetPath(path) {
  if (!path) return "";
  if (path.startsWith("./")) {
    return path.replace(/^\.\//, "../");
  }
  return path;
}

  document.getElementById(
    "copybookName"
  ).textContent =
    item.name;

  document.getElementById(
    "copybookAuthor"
  ).textContent =
    item.author;

  document.getElementById(
    "copybookIntro"
  ).textContent =
    item.introduction;

  document.getElementById(
    "copybookAdvice"
  ).textContent =
    item.advice;

  const features =
    document.getElementById(
      "copybookFeatures"
    );

  features.innerHTML =
    item.features
      .map(
        f =>
        `<span>${f}</span>`
      )
      .join("");

  const chars =
    document.getElementById(
      "copybookChars"
    );

  chars.innerHTML =
    item.chars
      .map(
        c =>
        `<div class="char-item">${c}</div>`
      )
      .join("");
}

loadCopybook();

// ================
// 图片放大预览交互（放大/缩小/拖拽）
// ================
;(function() {
  const previewImg = document.getElementById('copybookPreview');
  const overlay = document.getElementById('copybookPreviewOverlay');
  const previewStage = document.getElementById('copybookPreviewStage');
  const previewImage = document.getElementById('copybookPreviewImage');
  const closeBtn = document.getElementById('copybookPreviewClose');

  if (!previewImg || !overlay || !previewImage) return;

  let scale = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  function updateTransform() {
    previewImage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
  }

  previewImg.style.cursor = 'zoom-in';
  previewImg.addEventListener('click', () => {
    const src = previewImg.getAttribute('src');
    if (!src) return;
    previewImage.src = src;
    scale = 1; panX = 0; panY = 0; updateTransform();
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  });

  closeBtn?.addEventListener('click', () => {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  });

  // 点击空白处关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  });

  // pointer 拖拽
  previewImage.addEventListener('pointerdown', (e) => {
    isPanning = true;
    previewImage.setPointerCapture(e.pointerId);
    startX = e.clientX - panX;
    startY = e.clientY - panY;
  });

  previewImage.addEventListener('pointermove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    updateTransform();
  });

  previewImage.addEventListener('pointerup', (e) => {
    isPanning = false;
    try { previewImage.releasePointerCapture(e.pointerId); } catch (err) {}
  });

  // 鼠标滚轮缩放
  overlay.addEventListener('wheel', (e) => {
    if (!overlay.classList.contains('hidden')) {
      e.preventDefault();
      const delta = -e.deltaY;
      const factor = delta > 0 ? 1.08 : 0.92;
      const prevScale = scale;
      scale = Math.max(0.5, Math.min(4, scale * factor));

      // 以鼠标位置为缩放中心
      const rect = previewImage.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      // 调整 pan 使得缩放围绕指针
      panX -= (cx / prevScale) * (scale - prevScale);
      panY -= (cy / prevScale) * (scale - prevScale);

      updateTransform();
    }
  }, { passive: false });

  // 双击重置
  previewImage.addEventListener('dblclick', () => {
    scale = 1; panX = 0; panY = 0; updateTransform();
  });

})();