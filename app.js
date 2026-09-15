const app = document.querySelector(".app");
const backButton = document.querySelector("#backButton");
const startButton = document.querySelector("#startButton");
const camera = document.querySelector("#camera");
const boothScreen = document.querySelector(".screen");
const cameraWrap = document.querySelector(".camera-wrap");
const captureFrame = document.querySelector("#captureFrame");
const cameraFallback = document.querySelector("#cameraFallback");
const captureCanvas = document.querySelector("#captureCanvas");
const flash = document.querySelector("#flash");
const countdown = document.querySelector("#countdown");
const frameOptions = document.querySelector("#frameOptions");
const filterOptions = document.querySelector("#filterOptions");
const frameMode = document.querySelector("#frameMode");
const filterMode = document.querySelector("#filterMode");
const frameChooser = document.querySelector("#frameChooser");
const filterChooser = document.querySelector("#filterChooser");
const framePrev = document.querySelector("#framePrev");
const frameNext = document.querySelector("#frameNext");
const filterPrev = document.querySelector("#filterPrev");
const filterNext = document.querySelector("#filterNext");
const shutterButton = document.querySelector("#shutterButton");
const shutterLabel = document.querySelector("#shutterLabel");
const hint = document.querySelector("#hint");
const rawReview = document.querySelector("#rawReview");
const rawGrid = document.querySelector("#rawGrid");
const finishedReview = document.querySelector("#finishedReview");
const screenFinishedPhoto = document.querySelector("#screenFinishedPhoto");
const controlPanel = document.querySelector("#controlPanel");
const finishButton = document.querySelector("#finishButton");
const pickupButton = document.querySelector("#pickupButton");
const finishedCanvas = document.querySelector("#finishedCanvas");
const finalOverlay = document.querySelector("#finalOverlay");
const finalPhoto = document.querySelector("#finalPhoto");
const downloadButton = document.querySelector("#downloadButton");
const phoneButton = document.querySelector("#phoneButton");
const savedNote = document.querySelector("#savedNote");
const albumButton = document.querySelector("#albumButton");
const albumCount = document.querySelector("#albumCount");
const albumDialog = document.querySelector("#albumDialog");
const albumGrid = document.querySelector("#albumGrid");

const frames = [
  { id: "circle3", label: "Circle", shots: 3, tone: "#74151b", accent: "#fff7ec" },
  { id: "classic4", label: "Classic", shots: 4, tone: "#111111", accent: "#f6f1e9" },
  { id: "korea4", label: "K-Soft", shots: 4, tone: "#f7eee5", accent: "#5f4b40" },
  { id: "cute4", label: "Candy", shots: 4, tone: "#f6bad0", accent: "#7d2947" },
  { id: "id6", label: "ID Grid", shots: 6, tone: "#f8f8f4", accent: "#1e1e1e" },
  { id: "film3", label: "Film", shots: 3, tone: "#25201b", accent: "#f5d76e" },
];

const filters = [
  { id: "mono", label: "Mono", css: "filtered-mono", tone: "linear-gradient(135deg, #111, #d8d8d8)" },
  { id: "warm", label: "Warm", css: "filtered-warm", tone: "linear-gradient(135deg, #f9ddaf, #9d4b30)" },
  { id: "cute", label: "Candy", css: "filtered-cute", tone: "linear-gradient(135deg, #ffd8e8, #95d8ff)" },
  { id: "korea", label: "Soft", css: "filtered-korea", tone: "linear-gradient(135deg, #fff8ea, #d9c2ac)" },
  { id: "red", label: "Red", css: "filtered-red", tone: "linear-gradient(135deg, #cf151a, #531014)" },
  { id: "film", label: "Film", css: "filtered-film", tone: "linear-gradient(135deg, #211c16, #d5b15b)" },
  { id: "sepia", label: "Sepia", css: "filtered-sepia", tone: "linear-gradient(135deg, #2a160b, #d3a66e)" },
  { id: "noir", label: "Noir", css: "filtered-noir", tone: "linear-gradient(135deg, #050505, #f4f0e9)" },
  { id: "fade", label: "Fade", css: "filtered-fade", tone: "linear-gradient(135deg, #efe3c8, #82a1a7)" },
  { id: "leak", label: "Leak", css: "filtered-leak", tone: "linear-gradient(135deg, #18110c, #f15a37 45%, #f9cc79)" },
];

let selectedFrame = frames[0];
let selectedFilter = filters[0];
let shots = [];
let finishedDataUrl = "";
let album = [];
let stream = null;
let busy = false;

function setScene(scene) {
  app.dataset.scene = scene;
  if (scene !== "outlet" && scene !== "final") {
    finishedCanvas.style.animation = "none";
    void finishedCanvas.offsetWidth;
    finishedCanvas.style.animation = "";
  }
}

function getCaptureRatio() {
  const layout = getFrameLayout(selectedFrame.id);
  const slot = layout.slots[0];
  return slot.w / slot.h;
}

function updateCaptureRatio() {
  const ratio = getCaptureRatio();
  const ratioValue = ratio.toFixed(4);
  boothScreen.style.setProperty("--capture-ratio", ratioValue);
  captureFrame.style.setProperty("--capture-ratio", ratioValue);
  window.requestAnimationFrame(updateCaptureFrameSize);
}

function updateCaptureFrameSize() {
  const ratio = getCaptureRatio();
  const wrapStyle = getComputedStyle(cameraWrap);
  const maxWidth = cameraWrap.clientWidth - parseFloat(wrapStyle.paddingLeft) - parseFloat(wrapStyle.paddingRight);
  const maxHeight = cameraWrap.clientHeight - parseFloat(wrapStyle.paddingTop) - parseFloat(wrapStyle.paddingBottom);
  if (maxWidth <= 0 || maxHeight <= 0) return;

  let width = maxWidth;
  let height = width / ratio;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  captureFrame.style.width = `${Math.round(width)}px`;
  captureFrame.style.height = `${Math.round(height)}px`;
}

function renderOptions() {
  frameOptions.innerHTML = "";
  frames.forEach((frame) => {
    const button = document.createElement("button");
    button.className = `option frame-option ${frame.id === selectedFrame.id ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `<img src="${createFramePreview(frame)}" alt="" /><span>${frame.label}</span><small>${frame.shots} shots</small>`;
    button.addEventListener("click", () => {
      selectedFrame = frame;
      shots = [];
      updateCaptureRatio();
      updateCameraState();
      renderOptions();
    });
    frameOptions.append(button);
  });

  filterOptions.innerHTML = "";
  filters.forEach((filter) => {
    const button = document.createElement("button");
    button.className = `option filter-option ${filter.id === selectedFilter.id ? "active" : ""}`;
    button.type = "button";
    button.innerHTML = `<i style="background: ${filter.tone}"></i><span>${filter.label}</span>`;
    button.addEventListener("click", () => {
      selectedFilter = filter;
      updateFilterClass();
      renderOptions();
    });
    filterOptions.append(button);
  });
}

function createFramePreview(frame) {
  const layout = getFrameLayout(frame.id);
  const canvas = document.createElement("canvas");
  const width = 120;
  const height = 176;
  const ctx = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  const scale = Math.min(width / layout.width, height / layout.height);
  const previewWidth = layout.width * scale;
  const previewHeight = layout.height * scale;
  const offsetX = (width - previewWidth) / 2;
  const offsetY = (height - previewHeight) / 2;

  ctx.fillStyle = "#efe8dc";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);
  ctx.fillStyle = frame.tone;
  ctx.fillRect(0, 0, layout.width, layout.height);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#fff";
  for (let y = 18; y < layout.height; y += 54) ctx.fillRect(18, y, layout.width - 36, 2);
  ctx.globalAlpha = 1;
  layout.slots.forEach((slot, index) => {
    ctx.fillStyle = index % 2 ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.62)";
    if (slot.shape === "circle") {
      ctx.beginPath();
      ctx.arc(slot.x + slot.w / 2, slot.y + slot.h / 2, slot.w / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (slot.shape === "pill") {
      roundedRect(ctx, slot.x, slot.y, slot.w, slot.h, 26);
      ctx.fill();
    } else {
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    }
  });
  ctx.fillStyle = frame.accent;
  ctx.textAlign = "center";
  ctx.font = "800 68px Helvetica, Arial, sans-serif";
  ctx.fillText("PHOTO", layout.width / 2, layout.height - 78);
  ctx.restore();
  return canvas.toDataURL("image/png");
}

function setOptionMode(mode) {
  const showFrames = mode === "frames";
  frameMode.classList.toggle("active", showFrames);
  filterMode.classList.toggle("active", !showFrames);
  frameChooser.classList.toggle("active", showFrames);
  filterChooser.classList.toggle("active", !showFrames);
}

function scrollRail(rail, direction) {
  rail.scrollBy({ left: direction * Math.max(180, rail.clientWidth * 0.72), behavior: "smooth" });
}

function updateFilterClass() {
  camera.className = selectedFilter.css;
}

function updateCameraState() {
  rawReview.hidden = true;
  finishedReview.hidden = true;
  controlPanel.hidden = false;
  shutterButton.disabled = false;
  updateCaptureRatio();
  const nextShot = Math.min(shots.length + 1, selectedFrame.shots);
  shutterLabel.textContent = `Take ${nextShot} / ${selectedFrame.shots}`;
  hint.textContent = `${selectedFrame.label} needs ${selectedFrame.shots} shots.`;
}

async function openCamera() {
  if (stream) return;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
    camera.srcObject = stream;
    cameraFallback.hidden = true;
  } catch {
    cameraFallback.hidden = false;
    hint.textContent = "Camera blocked. You can still try the booth with a placeholder image.";
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runCountdown() {
  countdown.classList.add("active");
  for (const number of [3, 2, 1]) {
    countdown.textContent = number;
    beep(520 + number * 80, 0.05);
    await wait(720);
  }
  countdown.textContent = "";
  countdown.classList.remove("active");
}

function triggerFlash() {
  flash.classList.remove("active");
  void flash.offsetWidth;
  flash.classList.add("active");
  beep(980, 0.08);
}

function captureShot() {
  const ratio = getCaptureRatio();
  const height = 1200;
  const width = Math.round(height * ratio);
  const ctx = captureCanvas.getContext("2d");
  captureCanvas.width = width;
  captureCanvas.height = height;

  ctx.fillStyle = "#f3eee6";
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  if (camera.videoWidth) {
    drawCover(ctx, camera, 0, 0, width, height);
  } else {
    drawPlaceholder(ctx, width, height);
  }
  ctx.restore();
  applyCanvasFilter(ctx, width, height, selectedFilter.id);
  return captureCanvas.toDataURL("image/jpeg", 0.92);
}

function drawContain(ctx, source, x, y, width, height) {
  const sourceWidth = source.videoWidth || source.width;
  const sourceHeight = source.videoHeight || source.height;
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const dw = sourceWidth * scale;
  const dh = sourceHeight * scale;
  const dx = x + (width - dw) / 2;
  const dy = y + (height - dh) / 2;
  ctx.drawImage(source, dx, dy, dw, dh);
}

function drawCover(ctx, source, x, y, width, height) {
  const sourceWidth = source.videoWidth || source.width;
  const sourceHeight = source.videoHeight || source.height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (sourceWidth - sw) / 2;
  const sy = (sourceHeight - sh) / 2;
  ctx.drawImage(source, sx, sy, sw, sh, x, y, width, height);
}

function drawPlaceholder(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#5b1d20");
  gradient.addColorStop(0.54, "#d4a778");
  gradient.addColorStop(1, "#1a1715");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "800 58px Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("PHOTO", width / 2, height / 2 - 12);
  ctx.font = "400 26px Helvetica, Arial, sans-serif";
  ctx.fillText("camera preview", width / 2, height / 2 + 32);
}

function applyCanvasFilter(ctx, width, height, filterId) {
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    if (filterId === "mono") {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      data[i] = gray * 1.08;
      data[i + 1] = gray * 1.05;
      data[i + 2] = gray * 1.02;
    }
    if (filterId === "warm") {
      data[i] = Math.min(255, r * 1.08 + 12);
      data[i + 1] = Math.min(255, g * 1.02 + 6);
      data[i + 2] = b * 0.9;
    }
    if (filterId === "cute") {
      data[i] = Math.min(255, r * 1.08 + 10);
      data[i + 1] = Math.min(255, g * 1.04);
      data[i + 2] = Math.min(255, b * 1.12 + 8);
    }
    if (filterId === "korea") {
      data[i] = Math.min(255, r * 1.05 + 12);
      data[i + 1] = Math.min(255, g * 1.02 + 10);
      data[i + 2] = Math.min(255, b * 0.96 + 5);
    }
    if (filterId === "red") {
      data[i] = Math.min(255, r * 1.16 + 16);
      data[i + 1] = Math.min(255, g * 0.92);
      data[i + 2] = Math.min(255, b * 0.88);
    }
    if (filterId === "film") {
      data[i] = Math.min(255, r * 1.06);
      data[i + 1] = Math.min(255, g * 1.01);
      data[i + 2] = Math.min(255, b * 0.86);
    }
    if (filterId === "sepia") {
      data[i] = Math.min(255, r * 1.18 + 18);
      data[i + 1] = Math.min(255, g * 0.98 + 8);
      data[i + 2] = Math.min(255, b * 0.72);
    }
    if (filterId === "noir") {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const punch = gray > 128 ? gray * 1.18 + 10 : gray * 0.72;
      data[i] = punch;
      data[i + 1] = punch;
      data[i + 2] = punch;
    }
    if (filterId === "fade") {
      data[i] = Math.min(255, r * 0.9 + 35);
      data[i + 1] = Math.min(255, g * 0.95 + 24);
      data[i + 2] = Math.min(255, b * 1.02 + 18);
    }
    if (filterId === "leak") {
      data[i] = Math.min(255, r * 1.08 + 14);
      data[i + 1] = Math.min(255, g * 0.94 + 4);
      data[i + 2] = Math.min(255, b * 0.88);
    }
  }
  ctx.putImageData(image, 0, 0);
  addFilterFinish(ctx, width, height, filterId);
}

function addFilterFinish(ctx, width, height, filterId) {
  ctx.save();
  if (["film", "sepia", "noir", "fade", "leak"].includes(filterId)) {
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = "#111";
    for (let i = 0; i < 720; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      ctx.fillRect(x, y, Math.random() * 1.8 + 0.5, Math.random() * 1.8 + 0.5);
    }
  }
  if (filterId === "leak") {
    const leak = ctx.createRadialGradient(width * 0.08, height * 0.18, 10, width * 0.08, height * 0.18, width * 0.58);
    leak.addColorStop(0, "rgba(255,115,47,0.52)");
    leak.addColorStop(0.36, "rgba(255,190,98,0.24)");
    leak.addColorStop(1, "rgba(255,190,98,0)");
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = leak;
    ctx.fillRect(0, 0, width, height);
  }
  if (["film", "sepia", "noir", "leak"].includes(filterId)) {
    const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.22, width / 2, height / 2, width * 0.82);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.28)");
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

async function takePhoto() {
  if (busy) return;
  busy = true;
  shutterButton.disabled = true;
  try {
    await runCountdown();
    triggerFlash();
    await wait(120);
    shots.push(captureShot());
    if (shots.length >= selectedFrame.shots) {
      showRawReview();
    } else {
      updateCameraState();
    }
  } catch {
    hint.textContent = "The camera blinked. Try that shot again.";
    shutterButton.disabled = false;
  } finally {
    busy = false;
    if (shots.length < selectedFrame.shots && rawReview.hidden) {
      shutterButton.disabled = false;
    }
  }
}

function showRawReview() {
  rawGrid.innerHTML = "";
  finishedReview.hidden = true;
  shots.forEach((shot) => {
    const img = document.createElement("img");
    img.src = shot;
    img.alt = "Raw captured photo";
    rawGrid.append(img);
  });
  controlPanel.hidden = true;
  rawReview.hidden = false;
  hint.textContent = "Review your raw shots.";
}

function buildFinishedPhoto() {
  const ctx = finishedCanvas.getContext("2d");
  const layout = getFrameLayout(selectedFrame.id);
  finishedCanvas.width = layout.width;
  finishedCanvas.height = layout.height;
  ctx.fillStyle = selectedFrame.tone;
  ctx.fillRect(0, 0, layout.width, layout.height);

  drawFrameTexture(ctx, layout.width, layout.height);
  const images = shots.map((src) => loadImage(src));
  return Promise.all(images).then((loaded) => {
    loaded.forEach((img, index) => {
      const slot = layout.slots[index];
      ctx.save();
      if (slot.shape === "circle") {
        ctx.beginPath();
        ctx.arc(slot.x + slot.w / 2, slot.y + slot.h / 2, slot.w / 2, 0, Math.PI * 2);
        ctx.clip();
      } else if (slot.shape === "pill") {
        roundedRect(ctx, slot.x, slot.y, slot.w, slot.h, 26);
        ctx.clip();
      }
      ctx.fillStyle = "rgba(246,241,233,0.92)";
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
      drawContain(ctx, img, slot.x, slot.y, slot.w, slot.h);
      ctx.restore();
      if (slot.shape === "circle") {
        ctx.strokeStyle = "rgba(255,255,255,0.36)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(slot.x + slot.w / 2, slot.y + slot.h / 2, slot.w / 2 + 4, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 7;
        if (slot.shape === "pill") {
          roundedRect(ctx, slot.x - 4, slot.y - 4, slot.w + 8, slot.h + 8, 30);
          ctx.stroke();
        } else {
          ctx.strokeRect(slot.x - 4, slot.y - 4, slot.w + 8, slot.h + 8);
        }
      }
    });

    drawDecorations(ctx, layout.width, layout.height);
    drawStripLabel(ctx, layout.width, layout.height);
    finishedDataUrl = finishedCanvas.toDataURL("image/png");
    finalPhoto.src = finishedDataUrl;
  });
}

function getFrameLayout(id) {
  if (id === "circle3") {
    return {
      width: 620,
      height: 1720,
      slots: [
        { x: 110, y: 120, w: 400, h: 400, shape: "circle" },
        { x: 110, y: 610, w: 400, h: 400, shape: "circle" },
        { x: 110, y: 1100, w: 400, h: 400, shape: "circle" },
      ],
    };
  }
  if (id === "id6") {
    return {
      width: 720,
      height: 1080,
      slots: [
        { x: 58, y: 70, w: 285, h: 214, shape: "rect" },
        { x: 377, y: 70, w: 285, h: 214, shape: "rect" },
        { x: 58, y: 330, w: 285, h: 214, shape: "rect" },
        { x: 377, y: 330, w: 285, h: 214, shape: "rect" },
        { x: 58, y: 590, w: 285, h: 214, shape: "rect" },
        { x: 377, y: 590, w: 285, h: 214, shape: "rect" },
      ],
    };
  }
  if (id === "film3") {
    return {
      width: 660,
      height: 1640,
      slots: [
        { x: 92, y: 145, w: 476, h: 320, shape: "pill" },
        { x: 92, y: 590, w: 476, h: 320, shape: "pill" },
        { x: 92, y: 1035, w: 476, h: 320, shape: "pill" },
      ],
    };
  }
  return {
    width: 620,
    height: 1780,
    slots: [
      { x: 72, y: 92, w: 476, h: 330, shape: "rect" },
      { x: 72, y: 488, w: 476, h: 330, shape: "rect" },
      { x: 72, y: 884, w: 476, h: 330, shape: "rect" },
      { x: 72, y: 1280, w: 476, h: 330, shape: "rect" },
    ],
  };
}

function drawFrameTexture(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = selectedFrame.id === "korea4" || selectedFrame.id === "id6" ? 0.08 : 0.16;
  for (let y = 0; y < height; y += 34) {
    ctx.fillStyle = y % 68 === 0 ? "#ffffff" : "#000000";
    ctx.fillRect(0, y, width, 1);
  }
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(22, 22, 2, height - 44);
  ctx.fillRect(width - 24, 22, 2, height - 44);
  ctx.restore();
}

function drawDecorations(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = selectedFrame.accent;
  ctx.strokeStyle = selectedFrame.accent;
  if (selectedFrame.id === "cute4") {
    ctx.font = "700 36px Helvetica, Arial, sans-serif";
    ctx.fillText("♡", 74, 70);
    ctx.fillText("✧", width - 86, 100);
    ctx.fillText("SMILE", width / 2, height - 168);
  }
  if (selectedFrame.id === "korea4") {
    ctx.globalAlpha = 0.7;
    ctx.font = "500 30px Helvetica, Arial, sans-serif";
    ctx.fillText("soft day", width / 2, height - 165);
    ctx.strokeRect(36, 38, width - 72, height - 76);
  }
  if (selectedFrame.id === "film3") {
    for (let y = 72; y < height - 60; y += 78) {
      ctx.fillRect(28, y, 34, 28);
      ctx.fillRect(width - 62, y, 34, 28);
    }
  }
  if (selectedFrame.id === "id6") {
    ctx.strokeStyle = "rgba(20,20,20,0.2)";
    ctx.lineWidth = 2;
    ctx.strokeRect(34, 40, width - 68, height - 170);
  }
  ctx.restore();
}

function drawStripLabel(ctx, width, height) {
  ctx.save();
  ctx.fillStyle = selectedFrame.accent;
  ctx.textAlign = "center";
  ctx.font = "800 56px Helvetica, Arial, sans-serif";
  ctx.fillText("PHOTOAUTOMAT", width / 2, height - 118);
  ctx.font = "400 24px Helvetica, Arial, sans-serif";
  ctx.fillText("good photos better days", width / 2, height - 72);
  ctx.restore();
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = document.createElement("canvas");
      fallback.width = 900;
      fallback.height = 675;
      drawPlaceholder(fallback.getContext("2d"), fallback.width, fallback.height);
      resolve(fallback);
    };
    img.src = src;
  });
}

function startProcessingSound() {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.05);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 3.05);
  master.connect(context.destination);

  const roller = context.createOscillator();
  const rollerGain = context.createGain();
  roller.type = "triangle";
  roller.frequency.setValueAtTime(168, now);
  roller.frequency.linearRampToValueAtTime(132, now + 2.6);
  rollerGain.gain.value = 0.16;
  roller.connect(rollerGain);
  rollerGain.connect(master);
  roller.start(now);
  roller.stop(now + 2.8);

  const bufferSize = Math.floor(context.sampleRate * 3);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const burst = Math.sin(i / 18) > 0.25 ? 1 : 0.35;
    channel[i] = (Math.random() * 2 - 1) * burst;
  }
  const paper = context.createBufferSource();
  const paperFilter = context.createBiquadFilter();
  const paperGain = context.createGain();
  paper.buffer = buffer;
  paperFilter.type = "bandpass";
  paperFilter.frequency.setValueAtTime(1900, now);
  paperFilter.Q.value = 0.85;
  paperGain.gain.setValueAtTime(0.0001, now);
  paperGain.gain.linearRampToValueAtTime(0.09, now + 0.35);
  paperGain.gain.linearRampToValueAtTime(0.13, now + 1.75);
  paperGain.gain.exponentialRampToValueAtTime(0.0001, now + 3);
  paper.connect(paperFilter);
  paperFilter.connect(paperGain);
  paperGain.connect(master);
  paper.start(now + 0.12);
  paper.stop(now + 3);

  [0.42, 0.92, 1.48, 2.08].forEach((offset) => clickClack(context, master, now + offset));
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!window.photoBoothAudio) window.photoBoothAudio = new AudioContext();
  return window.photoBoothAudio;
}

function beep(frequency, duration) {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
}

function clickClack(context, destination, time) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(420, time);
  oscillator.frequency.exponentialRampToValueAtTime(170, time + 0.08);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.09, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(time);
  oscillator.stop(time + 0.13);
}

function paperSettleSound() {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  master.connect(context.destination);
  clickClack(context, master, now + 0.01);

  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.22), context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i++) {
    const fade = 1 - i / channel.length;
    channel[i] = (Math.random() * 2 - 1) * fade * 0.45;
  }
  const scrape = context.createBufferSource();
  const filter = context.createBiquadFilter();
  scrape.buffer = buffer;
  filter.type = "highpass";
  filter.frequency.value = 1400;
  scrape.connect(filter);
  filter.connect(master);
  scrape.start(now + 0.04);
}

function resetBooth() {
  shots = [];
  busy = false;
  finalOverlay.hidden = true;
  rawGrid.innerHTML = "";
  rawReview.hidden = true;
  finishedReview.hidden = true;
  controlPanel.hidden = false;
  setOptionMode("frames");
  updateCameraState();
  setScene("wall");
}

function addToAlbum() {
  if (!finishedDataUrl) return;
  album.unshift(finishedDataUrl);
  albumCount.textContent = album.length;
  renderAlbum();
  savedNote.textContent = "Saved to Album.";
}

function renderAlbum() {
  albumGrid.innerHTML = "";
  if (!album.length) {
    const empty = document.createElement("p");
    empty.className = "album-empty";
    empty.textContent = "Your finished strips will appear here.";
    albumGrid.append(empty);
    return;
  }
  album.forEach((photo, index) => {
    const img = document.createElement("img");
    img.src = photo;
    img.alt = `Album photo ${index + 1}`;
    albumGrid.append(img);
  });
}

function downloadFinished() {
  if (!finishedDataUrl) return;
  const link = document.createElement("a");
  link.href = finishedDataUrl;
  link.download = `photoautomat-${Date.now()}.png`;
  link.click();
  savedNote.textContent = "Download started.";
}

async function shareOrDownload() {
  if (!finishedDataUrl) return;
  const response = await fetch(finishedDataUrl);
  const blob = await response.blob();
  const file = new File([blob], "photoautomat.png", { type: "image/png" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: "Photoautomat" });
    savedNote.textContent = "Ready for your phone album.";
  } else {
    downloadFinished();
  }
}

startButton.addEventListener("click", async () => {
  setScene("entering");
  await wait(2100);
  setScene("booth");
  await openCamera();
});

backButton.addEventListener("click", resetBooth);
frameMode.addEventListener("click", () => setOptionMode("frames"));
filterMode.addEventListener("click", () => setOptionMode("filters"));
framePrev.addEventListener("click", () => scrollRail(frameOptions, -1));
frameNext.addEventListener("click", () => scrollRail(frameOptions, 1));
filterPrev.addEventListener("click", () => scrollRail(filterOptions, -1));
filterNext.addEventListener("click", () => scrollRail(filterOptions, 1));
shutterButton.addEventListener("click", takePhoto);

finishButton.addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  finishButton.disabled = true;
  finishButton.textContent = "Preparing...";
  try {
    await buildFinishedPhoto();
    screenFinishedPhoto.src = finishedDataUrl;
    rawReview.hidden = true;
    finishedReview.hidden = false;
    controlPanel.hidden = true;
    setScene("reviewing");
    await wait(1250);
    setScene("printing");
    startProcessingSound();
    await wait(950);
    setScene("outlet");
    window.setTimeout(paperSettleSound, 2100);
  } catch {
    finishButton.textContent = "Try Again";
    rawReview.hidden = false;
  } finally {
    busy = false;
    finishButton.disabled = false;
    finishButton.textContent = "Pick Finished";
  }
});

pickupButton.addEventListener("click", () => {
  setScene("final");
  finalOverlay.hidden = false;
  savedNote.textContent = "";
  window.setTimeout(addToAlbum, 2200);
});

downloadButton.addEventListener("click", downloadFinished);
phoneButton.addEventListener("click", shareOrDownload);
albumButton.addEventListener("click", () => {
  renderAlbum();
  albumDialog.showModal();
});
window.addEventListener("resize", updateCaptureFrameSize);

renderOptions();
renderAlbum();
updateFilterClass();
updateCameraState();
setOptionMode("frames");

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
