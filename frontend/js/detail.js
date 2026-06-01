import { timeAgo, formatTraditionalDate,getSeasonName } from "./utils/time.js";
const detailImage = document.getElementById("detailImage");
const detailImageWrap = document.getElementById("detailImageWrap");
const detailTitle = document.getElementById("detailTitle");
const detailStyle = document.getElementById("detailStyle");
const detailDescription = document.getElementById("detailDescription");
const detailTraditionalDate = document.getElementById("detailTraditionalDate");
const imagePreviewOverlay = document.getElementById("imagePreviewOverlay");
const previewImage = document.getElementById("previewImage");
const imagePreviewStage = document.getElementById("imagePreviewStage");
const closePreview = document.getElementById("closePreview");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const resetViewBtn = document.getElementById("resetViewBtn");
const rotateLeftBtn = document.getElementById("rotateLeftBtn");
const rotateRightBtn = document.getElementById("rotateRightBtn");
const detailLoading = document.getElementById("detailLoading");
const detailContent = document.getElementById("detailContent");
const detailError = document.getElementById("detailError");
const detailRetryBtn = document.getElementById("detailRetryBtn");

const params = new URLSearchParams(window.location.search);
const BASE_URL = window.APP_CONFIG?.BASE_URL || "http://localhost:8080/api";

const workId = params.get("id");
const imageUrl = params.get("imageUrl") || "";
const title = params.get("title") || "未命名作品";
const styleType = params.get("styleType") || "未知书体";
const content = params.get("content") || "暂无描述";
const createdAt = params.get("createdAt") || new Date().toISOString();
const hasFallbackData = Boolean(
  params.get("imageUrl") ||
  params.get("title") ||
  params.get("styleType") ||
  params.get("content") ||
  params.get("createdAt")
);

let previewScale = 1;
let previewRotation = 0;
let previewPanX = 0;
let previewPanY = 0;
let isDragging = false;
let isPinching = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOriginX = 0;
let dragOriginY = 0;
let dragVelocityX = 0;
let dragVelocityY = 0;
let lastDragPointX = 0;
let lastDragPointY = 0;
let lastDragTimestamp = 0;
let inertiaAnimationId = null;
let bounceAnimationId = null;
let pinchStartDistance = 0;
let pinchStartScale = 1;
let pinchCenterX = 0;
let pinchCenterY = 0;

async function loadWorkDetail() {
  if (!workId) {
    fallbackRender();
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/work/${encodeURIComponent(workId)}`);
    const result = await res.json();

    if (!res.ok || !result.data) {
      if (hasFallbackData) {
        fallbackRender();
      } else {
        showError("作品详情加载失败，请重试。");
      }
      return;
    }

    const work = result.data;

    detailImage.src = work.ImageURL;
    detailImage.style.display = work.ImageURL ? "block" : "none";
    detailImageWrap.style.display = work.ImageURL ? "block" : "none";

    detailTitle.textContent = work.Title || "未命名作品";
    detailStyle.textContent = work.StyleType || "未知书体";
    detailDescription.textContent = work.Content || "暂无描述";

    const displayCreatedAt = work.CreatedAt || createdAt;
    renderDetailMeta(displayCreatedAt);
    showDetailContent();
  } catch (err) {
    console.error(err);
    if (hasFallbackData) {
      fallbackRender();
    } else {
      showError("作品详情加载失败，请重试。");
    }
  }
}

function fallbackRender() {
  if (imageUrl) {
    detailImage.src = imageUrl;
    detailImage.style.display = "block";
    detailImageWrap.style.display = "block";
  } else {
    detailImageWrap.remove();
  }

  detailTitle.textContent = title;
  detailStyle.textContent = styleType;
  detailDescription.textContent = content;
  renderDetailMeta(createdAt);
  showDetailContent();
}

function showDetailContent() {
  if (detailLoading) {
    detailLoading.classList.add("hidden");
  }
  if (detailError) {
    detailError.classList.add("hidden");
  }
  if (detailImageWrap) {
    detailImageWrap.classList.remove("hidden");
  }
  if (detailContent) {
    detailContent.classList.remove("hidden");
  }
}

function showError(message) {
  if (detailLoading) {
    detailLoading.classList.add("hidden");
  }
  if (detailContent) {
    detailContent.classList.add("hidden");
  }
  if (detailImageWrap) {
    detailImageWrap.classList.add("hidden");
  }
  if (detailError) {
    detailError.classList.remove("hidden");
    detailError.querySelector("p").textContent = message;
  }
}

function renderDetailMeta(dateValue) {
  const traditionalDate = formatTraditionalDate(dateValue);
  const season = getSeasonName(dateValue);
  const ago = timeAgo(dateValue);

  detailTraditionalDate.innerHTML = `
  <span class="traditional-date">
    ${traditionalDate}
  </span>

  <span class="traditional-season">
    书于${season}
  </span>

  <span class="traditional-ago">
    距今${ago}
  </span>
`;
}

if (detailRetryBtn) {
  detailRetryBtn.addEventListener("click", () => {
    if (detailError) {
      detailError.classList.add("hidden");
    }
    if (detailLoading) {
      detailLoading.classList.remove("hidden");
    }
    loadWorkDetail();
  });
}

loadWorkDetail();

function setPreviewTransition(enabled) {
  previewImage.style.transition = enabled ? "transform 0.2s ease" : "none";
}

function updatePreviewTransform() {
  setPreviewTransition(!isDragging && !isPinching);
  previewImage.style.transform = `translate(${previewPanX}px, ${previewPanY}px) scale(${previewScale}) rotate(${previewRotation}deg)`;
}

function clampPreviewPan() {
  if (!imagePreviewStage || !previewImage) return;

  const stageRect = imagePreviewStage.getBoundingClientRect();
  const imageRect = previewImage.getBoundingClientRect();

  const maxPanX = Math.max(0, (imageRect.width - stageRect.width) / 2);
  const maxPanY = Math.max(0, (imageRect.height - stageRect.height) / 2);

  previewPanX = Math.min(maxPanX, Math.max(-maxPanX, previewPanX));
  previewPanY = Math.min(maxPanY, Math.max(-maxPanY, previewPanY));

  if (maxPanX === 0) previewPanX = 0;
  if (maxPanY === 0) previewPanY = 0;

  updatePreviewTransform();
}

function stopInertia() {
  if (inertiaAnimationId) {
    cancelAnimationFrame(inertiaAnimationId);
    inertiaAnimationId = null;
  }
}

function stopBounce() {
  if (bounceAnimationId) {
    cancelAnimationFrame(bounceAnimationId);
    bounceAnimationId = null;
  }
}

function springBackToBounds() {
  stopBounce();

  const step = () => {
    const stageRect = imagePreviewStage.getBoundingClientRect();
    const imageRect = previewImage.getBoundingClientRect();

    const maxPanX = Math.max(0, (imageRect.width - stageRect.width) / 2);
    const maxPanY = Math.max(0, (imageRect.height - stageRect.height) / 2);

    const targetX = Math.min(maxPanX, Math.max(-maxPanX, previewPanX));
    const targetY = Math.min(maxPanY, Math.max(-maxPanY, previewPanY));

    previewPanX += (targetX - previewPanX) * 0.16;
    previewPanY += (targetY - previewPanY) * 0.16;

    updatePreviewTransform();

    if (Math.abs(targetX - previewPanX) < 0.5 && Math.abs(targetY - previewPanY) < 0.5) {
      previewPanX = targetX;
      previewPanY = targetY;
      updatePreviewTransform();
      stopBounce();
      return;
    }

    bounceAnimationId = requestAnimationFrame(step);
  };

  bounceAnimationId = requestAnimationFrame(step);
}

function startInertia() {
  stopInertia();
  stopBounce();

  const friction = 0.92;

  const step = () => {
    dragVelocityX *= friction;
    dragVelocityY *= friction;

    if (Math.abs(dragVelocityX) < 0.2 && Math.abs(dragVelocityY) < 0.2) {
      dragVelocityX = 0;
      dragVelocityY = 0;
      stopInertia();
      springBackToBounds();
      return;
    }

    previewPanX += dragVelocityX;
    previewPanY += dragVelocityY;
    updatePreviewTransform();

    inertiaAnimationId = requestAnimationFrame(step);
  };

  inertiaAnimationId = requestAnimationFrame(step);
}

function resetPreviewView() {
  stopInertia();
  stopBounce();
  previewScale = 1;
  previewRotation = 0;
  previewPanX = 0;
  previewPanY = 0;
  dragVelocityX = 0;
  dragVelocityY = 0;
  lastDragPointX = 0;
  lastDragPointY = 0;
  lastDragTimestamp = 0;
  pinchStartDistance = 0;
  pinchStartScale = 1;
  pinchCenterX = 0;
  pinchCenterY = 0;
  isDragging = false;
  updatePreviewTransform();
}

if (detailImageWrap) {

  detailImageWrap.addEventListener("click", () => {
    previewImage.src = detailImage.src;
    previewImage.style.display = "block";
    resetPreviewView();
    imagePreviewOverlay.classList.remove("hidden");
    imagePreviewOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    requestAnimationFrame(() => {
      closePreview.focus();
    });
  });
}

function closePreviewOverlay() {
  stopInertia();
  stopBounce();
  closePreview.blur();
  previewImage.style.display = "none";
  resetPreviewView();

  imagePreviewOverlay.classList.add("hidden");
  imagePreviewOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  detailImageWrap.focus();
}

closePreview.addEventListener("click", closePreviewOverlay);

zoomInBtn.addEventListener("click", () => {
  previewScale = Math.min(3, previewScale + 0.25);
  updatePreviewTransform();
  clampPreviewPan();
});

zoomOutBtn.addEventListener("click", () => {
  previewScale = Math.max(0.5, previewScale - 0.25);
  updatePreviewTransform();
  clampPreviewPan();
});

resetViewBtn.addEventListener("click", () => {
  resetPreviewView();
});

rotateLeftBtn.addEventListener("click", () => {
  previewRotation -= 90;
  updatePreviewTransform();
});

rotateRightBtn.addEventListener("click", () => {
  previewRotation += 90;
  updatePreviewTransform();
});

previewImage.addEventListener("wheel", (event) => {
  event.preventDefault();

  stopInertia();
  stopBounce();

  if (event.deltaY < 0) {
    previewScale = Math.min(3, previewScale + 0.1);
  } else {
    previewScale = Math.max(0.5, previewScale - 0.1);
  }

  updatePreviewTransform();
  clampPreviewPan();
}, { passive: false });

previewImage.addEventListener("dblclick", () => {
  resetPreviewView();
});

previewImage.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch") {
    return;
  }

  stopInertia();
  stopBounce();
  isDragging = true;
  isPinching = false;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragOriginX = previewPanX;
  dragOriginY = previewPanY;
  lastDragPointX = event.clientX;
  lastDragPointY = event.clientY;
  lastDragTimestamp = performance.now();
  dragVelocityX = 0;
  dragVelocityY = 0;

  previewImage.setPointerCapture(event.pointerId);
  previewImage.style.cursor = "grabbing";
});

previewImage.addEventListener("pointermove", (event) => {
  if (!isDragging || event.pointerType === "touch") {
    return;
  }

  const now = performance.now();
  const deltaTime = Math.max(now - lastDragTimestamp, 16);

  previewPanX = dragOriginX + (event.clientX - dragStartX);
  previewPanY = dragOriginY + (event.clientY - dragStartY);
  dragVelocityX = (event.clientX - lastDragPointX) / deltaTime;
  dragVelocityY = (event.clientY - lastDragPointY) / deltaTime;
  lastDragPointX = event.clientX;
  lastDragPointY = event.clientY;
  lastDragTimestamp = now;

  updatePreviewTransform();
  clampPreviewPan();
});

previewImage.addEventListener("pointerup", (event) => {
  isDragging = false;
  previewImage.releasePointerCapture(event.pointerId);
  previewImage.style.cursor = "grab";

  clampPreviewPan();

  if (Math.hypot(dragVelocityX, dragVelocityY) > 0.08) {
    startInertia();
  }
});

previewImage.addEventListener("pointerleave", () => {
  if (!isDragging) {
    previewImage.style.cursor = "grab";
  }
});

previewImage.addEventListener("touchstart", (event) => {
  stopInertia();
  stopBounce();

  if (event.touches.length === 1) {
    const touch = event.touches[0];
    isDragging = true;
    isPinching = false;
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    dragOriginX = previewPanX;
    dragOriginY = previewPanY;
    lastDragPointX = touch.clientX;
    lastDragPointY = touch.clientY;
    lastDragTimestamp = performance.now();
    dragVelocityX = 0;
    dragVelocityY = 0;
    pinchStartDistance = 0;
    pinchStartScale = previewScale;
    pinchCenterX = 0;
    pinchCenterY = 0;
  } else if (event.touches.length === 2) {
    isDragging = false;
    isPinching = true;

    const [touchA, touchB] = event.touches;
    pinchStartDistance = Math.hypot(
      touchB.clientX - touchA.clientX,
      touchB.clientY - touchA.clientY
    );
    pinchStartScale = previewScale;
    pinchCenterX = (touchA.clientX + touchB.clientX) / 2;
    pinchCenterY = (touchA.clientY + touchB.clientY) / 2;
    event.preventDefault();
  }
}, { passive: false });

previewImage.addEventListener("touchmove", (event) => {
  if (event.touches.length === 1 && isDragging) {
    const touch = event.touches[0];
    const now = performance.now();
    const deltaTime = Math.max(now - lastDragTimestamp, 16);

    previewPanX = dragOriginX + (touch.clientX - dragStartX);
    previewPanY = dragOriginY + (touch.clientY - dragStartY);
    dragVelocityX = (touch.clientX - lastDragPointX) / deltaTime;
    dragVelocityY = (touch.clientY - lastDragPointY) / deltaTime;
    lastDragPointX = touch.clientX;
    lastDragPointY = touch.clientY;
    lastDragTimestamp = now;

    updatePreviewTransform();
    clampPreviewPan();
    event.preventDefault();
  } else if (event.touches.length === 2) {
    const [touchA, touchB] = event.touches;
    const currentDistance = Math.hypot(
      touchB.clientX - touchA.clientX,
      touchB.clientY - touchA.clientY
    );

    const scaleRatio = currentDistance / pinchStartDistance;
    const newScale = Math.min(3, Math.max(0.5, pinchStartScale * scaleRatio));
    const beforeRect = previewImage.getBoundingClientRect();
    const centerX = (touchA.clientX + touchB.clientX) / 2;
    const centerY = (touchA.clientY + touchB.clientY) / 2;

    const offsetX = centerX - beforeRect.left;
    const offsetY = centerY - beforeRect.top;
    const deltaScale = newScale / previewScale;

    previewScale = newScale;
    previewPanX = previewPanX - (offsetX - beforeRect.width / 2) * (deltaScale - 1);
    previewPanY = previewPanY - (offsetY - beforeRect.height / 2) * (deltaScale - 1);

    updatePreviewTransform();
    clampPreviewPan();
    event.preventDefault();
  }
}, { passive: false });

previewImage.addEventListener("touchend", (event) => {
  if (event.touches.length === 0) {
    isDragging = false;
    isPinching = false;

    clampPreviewPan();

    if (Math.hypot(dragVelocityX, dragVelocityY) > 0.08) {
      startInertia();
    }

    pinchStartDistance = 0;
    pinchStartScale = previewScale;
    pinchCenterX = 0;
    pinchCenterY = 0;
  }
});

imagePreviewOverlay.addEventListener("click", (event) => {
  if (event.target === imagePreviewOverlay) {
    closePreviewOverlay();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !imagePreviewOverlay.classList.contains("hidden")) {
    closePreviewOverlay();
  }
});
