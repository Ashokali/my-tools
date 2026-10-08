// --- index.html ---
if (document.body.classList.contains('page-index')) {
  (function() {

    document.addEventListener('DOMContentLoaded', () => {
      const searchInput = document.getElementById('searchInput');
      const toolCards = document.querySelectorAll('.tools-section .col-12');

      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        toolCards.forEach(card => {
          const textContent = card.innerText.toLowerCase();
          if (textContent.includes(searchTerm)) {
            card.style.display = 'block';
            // slight animation reset for smooth feeling
            card.style.animation = 'none';
            card.offsetHeight; // trigger reflow
            card.style.animation = 'fadeUp 0.4s ease forwards';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  
    
  })();
}


// --- qr-generator.html ---
if (document.body.classList.contains('page-qr-generator')) {
  (function() {

let currentTab = 'url';
let logoDataURL = null;
let lastCanvas = null;

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + tab).style.display = 'block';
  document.querySelectorAll('.tab')[['url','text','wifi','vcard'].indexOf(tab)].classList.add('active');
  currentTab = tab;
}

function getContent() {
  switch(currentTab) {
    case 'url':
      return document.getElementById('input-url').value.trim() || 'https://claude.ai';
    case 'text':
      return document.getElementById('input-text').value.trim() || 'Hello World';
    case 'wifi': {
      const ssid = document.getElementById('wifi-ssid').value;
      const pass = document.getElementById('wifi-pass').value;
      const sec = document.getElementById('wifi-sec').value;
      return `WIFI:T:${sec};S:${ssid};P:${pass};;`;
    }
    case 'vcard': {
      const name = document.getElementById('vc-name').value;
      const phone = document.getElementById('vc-phone').value;
      const email = document.getElementById('vc-email').value;
      const url = document.getElementById('vc-url').value;
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nURL:${url}\nEND:VCARD`;
    }
  }
}

const presets = {
  classic: { dark: '#000000', light: '#ffffff' },
  neon:    { dark: '#7c6aff', light: '#0a0a0f' },
  forest:  { dark: '#1a3a2a', light: '#d4edda' },
  ocean:   { dark: '#0077b6', light: '#caf0f8' },
  fire:    { dark: '#e63946', light: '#fff3e0' },
  mono:    { dark: '#555555', light: '#f5f5f5' },
  gold:    { dark: '#c9a74a', light: '#1a1200' },
  candy:   { dark: '#ff6a9e', light: '#f0fff8' },
};

function applyPreset(name, el) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const p = presets[name];
  document.getElementById('colorDark').value = p.dark;
  document.getElementById('colorLight').value = p.light;
}

function handleLogo(input) {
  if (!input.files[0]) return;
  const file = input.files[0];
  document.getElementById('logoName').textContent = file.name;
  const reader = new FileReader();
  reader.onload = e => { logoDataURL = e.target.result; };
  reader.readAsDataURL(file);
}

function clearLogo() {
  logoDataURL = null;
  document.getElementById('logoFile').value = '';
  document.getElementById('logoName').textContent = 'No file selected';
}

function generate() {
  const content = getContent();
  const size = parseInt(document.getElementById('sizeRange').value);
  const dark = document.getElementById('colorDark').value;
  const light = document.getElementById('colorLight').value;
  const ecLevel = document.getElementById('errLevel').value;

  const qrDiv = document.getElementById('qrcode');
  qrDiv.innerHTML = '';

  const display = document.getElementById('qrDisplay');
  display.style.maxWidth = Math.min(size, 320) + 'px';

  new QRCode(qrDiv, {
    text: content,
    width: size,
    height: size,
    colorDark: dark,
    colorLight: light,
    correctLevel: QRCode.CorrectLevel[ecLevel]
  });

  // After QR renders, get the canvas/img
  setTimeout(() => {
    let canvas = qrDiv.querySelector('canvas');
    const img = qrDiv.querySelector('img');

    if (!canvas && img) {
      // Convert img to canvas
      canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const tempImg = new Image();
      tempImg.onload = () => {
        ctx.drawImage(tempImg, 0, 0);
        if (logoDataURL) overlayLogo(canvas, size, dark, light);
        lastCanvas = canvas;
      };
      tempImg.src = img.src;
    } else if (canvas) {
      if (logoDataURL) overlayLogo(canvas, size, dark, light);
      lastCanvas = canvas;
    }

    display.classList.add('has-qr');
    document.getElementById('qrPlaceholder').style.display = 'none';

    // Enable download
    document.getElementById('dlPng').disabled = false;
    document.getElementById('dlSvg').disabled = false;

    // Stats
    document.getElementById('statsBar').style.display = 'flex';
    document.getElementById('statChars').textContent = content.length;
    document.getElementById('statSize').textContent = size + 'px';
    document.getElementById('statEC').textContent = ecLevel;
    document.getElementById('statType').textContent = currentTab.toUpperCase();
    document.getElementById('sizeDisplay').textContent = size;
  }, 100);
}

function overlayLogo(canvas, size, dark, light) {
  const ctx = canvas.getContext('2d');
  const logoSize = size * 0.22;
  const logoX = (size - logoSize) / 2;
  const logoY = (size - logoSize) / 2;

  const logoImg = new Image();
  logoImg.onload = () => {
    // White circle bg
    ctx.save();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.arc(size/2, size/2, logoSize * 0.65, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    lastCanvas = canvas;
  };
  logoImg.src = logoDataURL;
}

function downloadPNG() {
  const canvas = document.querySelector('#qrcode canvas') || lastCanvas;
  if (!canvas) return;
  const a = document.createElement('a');
  a.download = 'qr-code.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function downloadSVG() {
  const content = getContent();
  const size = parseInt(document.getElementById('sizeRange').value);
  const dark = document.getElementById('colorDark').value;
  const light = document.getElementById('colorLight').value;

  // Build a basic SVG using the canvas pixel data
  const canvas = document.querySelector('#qrcode canvas') || lastCanvas;
  if (!canvas) return;

  const svgSize = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const cellSize = canvas.width / Math.sqrt(canvas.width); // approx

  // Use PNG in SVG for simplicity
  const pngData = canvas.toDataURL('image/png');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
  <image href="${pngData}" width="${svgSize}" height="${svgSize}"/>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const a = document.createElement('a');
  a.download = 'qr-code.svg';
  a.href = URL.createObjectURL(blob);
  a.click();
}

// Sync range display
document.getElementById('sizeRange').addEventListener('input', function() {
  document.getElementById('sizeDisplay').textContent = this.value;
  document.getElementById('sizeVal').textContent = this.value;
});

// Auto-generate on load
window.onload = () => generate();

    window.handleLogo = handleLogo;
  window.switchTab = switchTab;
  window.downloadPNG = downloadPNG;
  window.clearLogo = clearLogo;
  window.applyPreset = applyPreset;
  window.getContent = getContent;
  window.overlayLogo = overlayLogo;
  window.downloadSVG = downloadSVG;
  window.generate = generate;
  })();
}


// --- webp-converter.html ---
if (document.body.classList.contains('page-webp-converter')) {
  (function() {

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const queueEl = document.getElementById('queue');
const convertBtn = document.getElementById('convertBtn');
const dlAllBtn = document.getElementById('dlAllBtn');
const quality = document.getElementById('quality');
const qualityVal = document.getElementById('qualityVal');
const qualityLabel = document.getElementById('qualityLabel');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let files = [];
let results = [];

quality.oninput = () => {
  qualityVal.textContent = quality.value;
  qualityLabel.textContent = quality.value;
};

// Drag & Drop
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  addFiles([...e.dataTransfer.files]);
});
dropZone.addEventListener('click', e => {
  if (!e.target.closest('span')) fileInput.click();
});
fileInput.addEventListener('change', () => addFiles([...fileInput.files]));

function addFiles(newFiles) {
  const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
  imageFiles.forEach(f => {
    if (files.find(x => x.name === f.name && x.size === f.size)) return;
    files.push(f);
    renderQueueItem(f, files.length - 1);
  });
  updateButtons();
}

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  return (b/1024/1024).toFixed(2) + ' MB';
}

function renderQueueItem(file, idx) {
  const item = document.createElement('div');
  item.className = 'queue-item';
  item.id = `item-${idx}`;

  const thumb = document.createElement('div');
  thumb.className = 'file-thumb';
  thumb.id = `thumb-${idx}`;

  const url = URL.createObjectURL(file);
  const img = document.createElement('img');
  img.src = url;
  img.onload = () => /* URL.revokeObjectURL(url); deferred */
  thumb.appendChild(img);

  const ext = (file.name.split('.').pop() || '').toUpperCase();

  item.innerHTML = `
    <div class="file-info">
      <div class="file-name">${file.name}</div>
      <div class="file-meta">${ext} · ${formatBytes(file.size)}</div>
      <div class="progress-bar-wrap"><div class="progress-bar" id="progress-${idx}"></div></div>
    </div>
    <span class="file-status status-pending" id="status-${idx}">Pending</span>
    <span id="action-${idx}"></span>
    <button class="btn-remove" onclick="removeFile(${idx})" title="Remove">✕</button>
  `;

  item.prepend(thumb);
  queueEl.appendChild(item);
}

function removeFile(idx) {
  files[idx] = null;
  results[idx] = null;
  const el = document.getElementById(`item-${idx}`);
  if (el) el.remove();
  updateButtons();
}

function updateButtons() {
  const hasFiles = files.some(f => f !== null);
  convertBtn.disabled = !hasFiles;
  const allDone = results.some(r => r);
  dlAllBtn.style.display = allDone ? 'flex' : 'none';
}

function clearAll() {
  files = [];
  results = [];
  queueEl.innerHTML = '';
  dlAllBtn.style.display = 'none';
  convertBtn.disabled = true;
  document.getElementById('summary').classList.remove('show');
}

async function convertFile(file, idx) {
  return new Promise((resolve) => {
    const item = document.getElementById(`item-${idx}`);
    const status = document.getElementById(`status-${idx}`);
    const progress = document.getElementById(`progress-${idx}`);

    item.classList.add('converting');
    status.className = 'file-status status-converting';
    status.textContent = 'Converting';

    const animate = setInterval(() => {
      const cur = parseInt(progress.style.width || '0');
      if (cur < 85) progress.style.width = (cur + 5) + '%';
    }, 60);

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      /* URL.revokeObjectURL(url); deferred */
      let w = img.width, h = img.height;
      const maxW = parseInt(document.getElementById('maxWidth').value) || 0;
      const maxH = parseInt(document.getElementById('maxHeight').value) || 0;

      if (maxW && w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
      if (maxH && h > maxH) { w = Math.round(w * maxH / h); h = maxH; }

      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      const fmt = document.getElementById('outputFormat').value;
      const mimeMap = { webp: 'image/webp', jpeg: 'image/jpeg', png: 'image/png' };
      const extMap = { webp: 'webp', jpeg: 'jpg', png: 'png' };
      const mime = mimeMap[fmt];
      const ext = extMap[fmt];
      const q = parseInt(quality.value) / 100;

      canvas.toBlob(blob => {
        clearInterval(animate);
        progress.style.width = '100%';

        setTimeout(() => {
          item.classList.remove('converting');
          if (blob) {
            item.classList.add('done');
            status.className = 'file-status status-done';
            status.textContent = '✓ Done';

            const baseName = file.name.replace(/\.[^.]+$/, '');
            const outName = `${baseName}.${ext}`;
            const blobUrl = URL.createObjectURL(blob);
            results[idx] = { blob, name: outName, originalSize: file.size, newSize: blob.size };

            const actionEl = document.getElementById(`action-${idx}`);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = outName;
            a.className = 'btn-download';
            a.textContent = '↓';
            a.title = `Download ${outName}`;
            actionEl.appendChild(a);

            const metaEl = item.querySelector('.file-meta');
            const saved = ((1 - blob.size / file.size) * 100).toFixed(1);
            const sign = saved >= 0 ? '-' : '+';
            metaEl.textContent += ` → ${formatBytes(blob.size)} (${sign}${Math.abs(saved)}%)`;
          } else {
            item.classList.add('error');
            status.className = 'file-status status-error';
            status.textContent = '✗ Error';
          }
          resolve();
        }, 200);
      }, mime, q);
    };
    img.onerror = () => {
      clearInterval(animate);
      item.classList.add('error');
      status.className = 'file-status status-error';
      status.textContent = '✗ Error';
      resolve();
    };
    img.src = url;
  });
}

async function convertAll() {
  convertBtn.disabled = true;
  document.getElementById('summary').classList.remove('show');

  for (let i = 0; i < files.length; i++) {
    if (files[i] && !results[i]) {
      await convertFile(files[i], i);
    }
  }

  const done = results.filter(Boolean);
  if (done.length) {
    dlAllBtn.style.display = 'flex';
    const totalOriginal = done.reduce((s, r) => s + r.originalSize, 0);
    const totalNew = done.reduce((s, r) => s + r.newSize, 0);
    const avgSaved = ((1 - totalNew / totalOriginal) * 100).toFixed(1);
    document.getElementById('statFiles').textContent = done.length;
    document.getElementById('statSaved').textContent = `${avgSaved >= 0 ? avgSaved : 0}%`;
    document.getElementById('summary').classList.add('show');
  }

  updateButtons();
}

async function downloadAll() {
  const done = results.filter(Boolean);
  if (done.length === 0) return;

  if (done.length === 1) {
    const r = done[0];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(r.blob);
    a.download = r.name;
    a.click();
    return;
  }

  // If JSZip available, zip; otherwise sequential downloads
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  script.onload = async () => {
    const zip = new JSZip();
    done.forEach(r => zip.file(r.name, r.blob));
    const content = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = 'converted-images.zip';
    a.click();
  };
  script.onerror = () => {
    done.forEach((r, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(r.blob);
        a.download = r.name;
        a.click();
      }, i * 300);
    });
  };
  document.head.appendChild(script);
}

    window.formatBytes = formatBytes;
  window.clearAll = clearAll;
  window.updateButtons = updateButtons;
  window.convertFile = convertFile;
  window.downloadAll = downloadAll;
  window.renderQueueItem = renderQueueItem;
  window.convertAll = convertAll;
  window.addFiles = addFiles;
  window.removeFile = removeFile;
  })();
}


// --- bg-remover-v2.html ---
if (document.body.classList.contains('page-bg-remover-v2')) {
  (function() {

/* ── ELEMENTS ── */
const dropZone      = document.getElementById('drop-zone');
const fileInput     = document.getElementById('file-input');
const removeBtn     = document.getElementById('remove-btn');
const resetBtn      = document.getElementById('reset-btn');
const statusBar     = document.getElementById('status-bar');
const statusText    = document.getElementById('status-text');
const spinner       = document.getElementById('status-spinner');
const queueSection  = document.getElementById('queue-section');
const queueEl       = document.getElementById('image-queue');
const queueStats    = document.getElementById('queue-stats');
const progressWrap  = document.getElementById('progress-wrap');
const progressFill  = document.getElementById('progress-fill');
const progressLabel = document.getElementById('progress-label');
const apiKeyInp     = document.getElementById('api-key');
const saveKeyBtn    = document.getElementById('save-key-btn');
const keySaveMsg    = document.getElementById('key-save-msg');
const dlAllWrap     = document.getElementById('download-all-wrap');
const dlAllBtn      = document.getElementById('download-all-btn');
const addMoreBtn    = document.getElementById('add-more-btn');
const blurAmountEl  = document.getElementById('blur-amount');
const blurValEl     = document.getElementById('blur-val');

/* ── STATE ── */
let queue = []; // { id, file, status:'pending'|'processing'|'done'|'error', resultBlob, resultUrl, errMsg }
let concurrency = 1;
let bgType = 'transparent';
let fillColor = '#ffffff';
let blurAmount = 12;
let outputFormat = 'png';
let isProcessing = false;

/* ── API KEY ── */
const savedKey = localStorage.getItem('poof_api_key');
if (savedKey) { apiKeyInp.value = savedKey; showKeyMsg('✅ Saved key loaded', 'var(--success)'); }

saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInp.value.trim();
  if (!key) {
    localStorage.removeItem('poof_api_key');
    saveKeyBtn.classList.remove('saved');
    showKeyMsg('🗑️ Key cleared', 'var(--muted)');
    return;
  }
  localStorage.setItem('poof_api_key', key);
  saveKeyBtn.textContent = '✅ Saved';
  saveKeyBtn.classList.add('saved');
  showKeyMsg('✅ Key saved to this browser', 'var(--success)');
  setTimeout(() => { saveKeyBtn.textContent = '💾 Save'; saveKeyBtn.classList.remove('saved'); }, 2000);
});

function showKeyMsg(text, color) {
  keySaveMsg.textContent = text;
  keySaveMsg.style.color = color;
  keySaveMsg.style.display = '';
  clearTimeout(keySaveMsg._t);
  keySaveMsg._t = setTimeout(() => keySaveMsg.style.display = 'none', 3000);
}

/* ── BG TYPE CHIPS ── */
document.querySelectorAll('.bg-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.bg-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    bgType = chip.dataset.bg;
    document.getElementById('color-group').style.display = bgType === 'color' ? '' : 'none';
    document.getElementById('blur-group').style.display = bgType === 'blur' ? '' : 'none';
  });
});

/* ── COLOR SWATCHES ── */
document.querySelectorAll('.color-swatch[data-color]').forEach(sw => {
  sw.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    sw.classList.add('active');
    fillColor = sw.dataset.color;
  });
});
const customColorInp = document.getElementById('custom-color');
const customSwatch = document.getElementById('custom-swatch');
customSwatch.addEventListener('click', () => customColorInp.click());
customColorInp.addEventListener('input', () => {
  fillColor = customColorInp.value;
  document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
  customSwatch.classList.add('active');
});

/* ── BLUR SLIDER ── */
blurAmountEl.addEventListener('input', () => {
  blurAmount = parseInt(blurAmountEl.value);
  blurValEl.textContent = blurAmount + 'px';
});

/* ── CONCURRENCY TOGGLE ── */
document.querySelectorAll('#concurrency-toggle button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#concurrency-toggle button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    concurrency = parseInt(btn.dataset.val);
  });
});

/* ── DROP ZONE ── */
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  addFiles(Array.from(e.dataTransfer.files));
});
fileInput.addEventListener('change', () => {
  addFiles(Array.from(fileInput.files));
  fileInput.value = '';
});

addMoreBtn.addEventListener('click', () => fileInput.click());

/* ── ADD FILES ── */
function addFiles(files) {
  const remaining = 4 - queue.length;
  if (remaining <= 0) { showStatus('Max 4 images allowed. Clear some to add more.', 'error'); return; }

  let skipped = 0;
  const valid = files.slice(0, remaining).filter(f => {
    if (!f.type.startsWith('image/')) { showStatus(`Skipped "${f.name}" — not an image.`, 'error'); skipped++; return false; }
    if (f.size > 20 * 1024 * 1024) { showStatus(`Skipped "${f.name}" — exceeds 20 MB.`, 'error'); skipped++; return false; }
    return true;
  });

  if (files.length > remaining) {
    showStatus(`Only ${remaining} slot(s) left — first ${remaining} image(s) added.`, 'info');
  }

  valid.forEach(file => {
    const id = Date.now() + Math.random();
    const item = { id, file, status: 'pending', resultBlob: null, resultUrl: null, errMsg: null };
    queue.push(item);
    renderQueueItem(item);
  });

  if (queue.length > 0) {
    queueSection.classList.add('visible');
    removeBtn.disabled = false;
    resetBtn.style.display = '';
  }
  updateQueueStats();
  if (valid.length && files.length <= remaining) showStatus(`${valid.length} image(s) added — ready to process.`, 'info');
}

/* ── RENDER QUEUE ITEM ── */
function renderQueueItem(item) {
  const div = document.createElement('div');
  div.className = 'queue-item';
  div.id = `qi-${item.id}`;

  const previewUrl = URL.createObjectURL(item.file);

  div.innerHTML = `
    <div class="thumb-wrap">
      <img src="${previewUrl}" alt="${item.file.name}" />
      <div class="item-result-overlay" id="overlay-${item.id}">
        <img src="" alt="Result" id="result-img-${item.id}" />
      </div>
      <span class="item-badge pending" id="badge-${item.id}">Pending</span>
      <button class="item-remove" id="rm-${item.id}" title="Remove">✕</button>
      <button class="result-toggle" id="toggle-${item.id}" style="display:none">👁 Original</button>
      <button class="item-fullscreen" id="fs-${item.id}" title="View fullscreen">⛶</button>
    </div>
    <div class="item-info">
      <div class="item-name">${item.file.name}</div>
      <div class="item-size">${formatSize(item.file.size)}</div>
    </div>
    <div class="item-actions">
      <a class="item-dl" id="dl-${item.id}" download="${item.file.name.replace(/\.[^.]+$/, '')}-nobg.${outputFormat}">⬇ Download</a>
    </div>
  `;
  queueEl.appendChild(div);

  // Remove button
  document.getElementById(`rm-${item.id}`).addEventListener('click', e => {
    e.stopPropagation();
    removeFromQueue(item.id);
  });

  // Toggle before/after
  let showingResult = true;
  document.getElementById(`toggle-${item.id}`).addEventListener('click', () => {
    const overlay = document.getElementById(`overlay-${item.id}`);
    const toggleBtn = document.getElementById(`toggle-${item.id}`);
    showingResult = !showingResult;
    overlay.classList.toggle('visible', showingResult);
    toggleBtn.textContent = showingResult ? '👁 Original' : '👁 Result';
  });

  // Fullscreen button
  document.getElementById(`fs-${item.id}`).addEventListener('click', e => {
    e.stopPropagation();
    openLightbox(item);
  });
}

function removeFromQueue(id) {
  queue = queue.filter(i => i.id !== id);
  const el = document.getElementById(`qi-${id}`);
  if (el) el.remove();
  if (queue.length === 0) {
    queueSection.classList.remove('visible');
    removeBtn.disabled = true;
    resetBtn.style.display = 'none';
    dlAllWrap.classList.remove('visible');
    statusBar.className = 'status-bar';
  }
  updateQueueStats();
}

function updateQueueStats() {
  const done  = queue.filter(i => i.status === 'done').length;
  const error = queue.filter(i => i.status === 'error').length;
  const total = queue.length;
  queueStats.textContent = `${total}/4 images · ${done} processed${error ? ` · ${error} failed` : ''}`;
  // Hide "Add More" when at capacity
  addMoreBtn.style.display = total >= 4 ? 'none' : '';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/* ── UPDATE ITEM UI ── */
function setItemStatus(item, status, msg = '') {
  item.status = status;
  const badge = document.getElementById(`badge-${item.id}`);
  if (!badge) return;
  badge.className = `item-badge ${status}`;
  const labels = { pending: 'Pending', processing: 'Processing…', done: '✓ Done', error: '✗ Error' };
  badge.textContent = labels[status] || status;
  updateQueueStats();
}

function setItemResult(item, blob) {
  item.resultBlob = blob;
  item.resultUrl = URL.createObjectURL(blob);

  const overlay = document.getElementById(`overlay-${item.id}`);
  const resultImg = document.getElementById(`result-img-${item.id}`);
  const dlBtn = document.getElementById(`dl-${item.id}`);
  const toggleBtn = document.getElementById(`toggle-${item.id}`);
  const fsBtn = document.getElementById(`fs-${item.id}`);

  resultImg.src = item.resultUrl;
  overlay.classList.add('visible');
  dlBtn.href = item.resultUrl;
  dlBtn.classList.add('visible');
  toggleBtn.style.display = '';
  fsBtn.classList.add('visible');
}

/* ── LIGHTBOX ── */
const lightbox       = document.getElementById('lightbox');
const lightboxImg    = document.getElementById('lightbox-img');
const lightboxDl     = document.getElementById('lightbox-dl');
const lightboxName   = document.getElementById('lightbox-filename');
const lightboxClose  = document.getElementById('lightbox-close');
const lightboxClose2 = document.getElementById('lightbox-close2');

function openLightbox(item) {
  if (!item.resultUrl) return;
  lightboxImg.src = item.resultUrl;
  lightboxDl.href = item.resultUrl;
  lightboxDl.download = item.file.name.replace(/\.[^.]+$/, '') + '-nobg.' + (document.getElementById('output-format').value || 'png');
  lightboxName.textContent = item.file.name;
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxClose2.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

/* ── PROCESS ALL ── */
removeBtn.addEventListener('click', async () => {
  const apiKey = apiKeyInp.value.trim();
  if (!apiKey) return showStatus('Please enter your poof.bg API key first.', 'error');

  const pending = queue.filter(i => i.status === 'pending' || i.status === 'error');
  if (pending.length === 0) return showStatus('No images to process.', 'info');

  isProcessing = true;
  removeBtn.disabled = true;
  dlAllWrap.classList.remove('visible');

  let completed = 0;
  const total = pending.length;
  progressWrap.classList.add('visible');
  setProgress(0, total);
  showStatus(`Processing ${total} image(s)…`, 'info', true);

  // Process with concurrency limit
  async function processOne(item) {
    setItemStatus(item, 'processing');
    try {
      const resultBlob = await removeBackground(item.file, apiKey);
      // Post-process background
      const finalBlob = await applyBackground(resultBlob, item.file, bgType, fillColor, blurAmount);
      setItemStatus(item, 'done');
      setItemResult(item, finalBlob);
    } catch (err) {
      item.errMsg = err.message;
      setItemStatus(item, 'error');
    }
    completed++;
    setProgress(completed, total);
  }

  // Chunked concurrency runner
  const chunks = chunkArray(pending, concurrency);
  for (const chunk of chunks) {
    await Promise.all(chunk.map(item => processOne(item)));
  }

  isProcessing = false;
  removeBtn.disabled = false;
  const doneCount  = queue.filter(i => i.status === 'done').length;
  const errorCount = queue.filter(i => i.status === 'error').length;
  const msg = errorCount
    ? `Done! ${doneCount} succeeded, ${errorCount} failed.`
    : `All ${doneCount} image(s) processed successfully!`;
  showStatus(msg, errorCount ? 'error' : 'success');

  if (doneCount > 0) dlAllWrap.classList.add('visible');
  progressWrap.classList.remove('visible');
  updateQueueStats();
});

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

function setProgress(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressFill.style.width = pct + '%';
  progressLabel.textContent = `${done} / ${total}`;
}

/* ── REMOVE BACKGROUND (API CALL) ── */
async function removeBackground(file, apiKey) {
  const formData = new FormData();
  formData.append('image_file', file);
  formData.append('format', 'png');
  formData.append('size', document.getElementById('output-size').value);
  formData.append('channels', 'rgba');

  let response;
  try {
    response = await fetch('https://api.poof.bg/v1/remove', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: formData
    });
  } catch (networkErr) {
    throw new Error('Network error: Could not reach api.poof.bg. Details: ' + networkErr.message);
  }

  if (!response.ok) {
    let errMsg = `API error ${response.status}`;
    try {
      const rawText = await response.text();
      try {
        const errData = JSON.parse(rawText);
        if (errData.error && typeof errData.error === 'object') errMsg = errData.error.message || errData.error.code || JSON.stringify(errData.error);
        else if (typeof errData.error === 'string') errMsg = errData.error;
        else if (errData.message) errMsg = errData.message;
        else errMsg = rawText.slice(0, 200);
      } catch (_) { errMsg = rawText.slice(0, 200) || errMsg; }
    } catch (_) {}
    if (response.status === 401 || response.status === 403) errMsg = 'Invalid or unauthorized API key.';
    if (response.status === 402) errMsg = 'No credits remaining. Top up at dash.poof.bg.';
    if (response.status === 429) errMsg = 'Rate limit reached. Please wait and retry.';
    throw new Error(errMsg);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const errData = await response.json();
    throw new Error(errData.message || errData.error || 'Unexpected JSON from API.');
  }

  return await response.blob();
}

/* ── APPLY BACKGROUND OPTION ── */
async function applyBackground(removedBlob, originalFile, bgType, color, blurPx) {
  if (bgType === 'transparent') return removedBlob;

  return new Promise((resolve, reject) => {
    const fgImg = new Image();
    fgImg.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = fgImg.naturalWidth;
      canvas.height = fgImg.naturalHeight;
      const ctx = canvas.getContext('2d');

      if (bgType === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgType === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgType === 'color') {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (bgType === 'blur') {
        // Draw blurred original as bg, then paste fg on top
        const origImg = new Image();
        origImg.onload = () => {
          ctx.filter = `blur(${blurPx}px)`;
          ctx.drawImage(origImg, -blurPx * 2, -blurPx * 2, canvas.width + blurPx * 4, canvas.height + blurPx * 4);
          ctx.filter = 'none';
          ctx.drawImage(fgImg, 0, 0);
          const fmt = document.getElementById('output-format').value;
          canvas.toBlob(blob => resolve(blob), fmt === 'webp' ? 'image/webp' : 'image/png');
        };
        origImg.onerror = reject;
        origImg.src = URL.createObjectURL(originalFile);
        return; // early return since async continues in origImg.onload
      }

      ctx.drawImage(fgImg, 0, 0);
      const fmt = document.getElementById('output-format').value;
      canvas.toBlob(blob => resolve(blob), fmt === 'webp' ? 'image/webp' : 'image/png');
    };
    fgImg.onerror = reject;
    fgImg.src = URL.createObjectURL(removedBlob);
  });
}

/* ── DOWNLOAD ALL AS ZIP ── */
dlAllBtn.addEventListener('click', async () => {
  const done = queue.filter(i => i.status === 'done' && i.resultBlob);
  if (!done.length) return;
  dlAllBtn.textContent = '⏳ Zipping…';
  dlAllBtn.disabled = true;

  const fmt = document.getElementById('output-format').value;
  try {
    const zip = new JSZip();
    for (const item of done) {
      const safeName = item.file.name.replace(/\.[^.]+$/, '') + `-nobg.${fmt}`;
      zip.file(safeName, item.resultBlob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url; a.download = 'poof-removed-backgrounds.zip'; a.click();
  } catch (err) {
    showStatus('ZIP error: ' + err.message, 'error');
  }
  dlAllBtn.textContent = '⬇️ Download All as ZIP';
  dlAllBtn.disabled = false;
});

/* ── RESET ── */
resetBtn.addEventListener('click', () => {
  queue = [];
  queueEl.innerHTML = '';
  queueSection.classList.remove('visible');
  dlAllWrap.classList.remove('visible');
  progressWrap.classList.remove('visible');
  removeBtn.disabled = true;
  resetBtn.style.display = 'none';
  statusBar.className = 'status-bar';
  fileInput.value = '';
});

/* ── STATUS ── */
function showStatus(msg, type = 'info', loading = false) {
  statusText.textContent = msg;
  spinner.style.display = loading ? '' : 'none';
  statusBar.className = `status-bar show ${type}`;
}

    window.chunkArray = chunkArray;
  window.removeBackground = removeBackground;
  window.showStatus = showStatus;
  window.processOne = processOne;
  window.setItemStatus = setItemStatus;
  window.renderQueueItem = renderQueueItem;
  window.showKeyMsg = showKeyMsg;
  window.formatSize = formatSize;
  window.closeLightbox = closeLightbox;
  window.setProgress = setProgress;
  window.updateQueueStats = updateQueueStats;
  window.applyBackground = applyBackground;
  window.addFiles = addFiles;
  window.openLightbox = openLightbox;
  window.removeFromQueue = removeFromQueue;
  window.setItemResult = setItemResult;
  })();
}


// --- favicon-generator.html ---
if (document.body.classList.contains('page-favicon-generator')) {
  (function() {

        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('file-input');
        const emptyState = document.getElementById('empty-state');
        const previewImg = document.getElementById('preview-img');
        const fileNameEl = document.getElementById('file-name');
        const fileInfoEl = document.getElementById('file-info');
        const generateBtn = document.getElementById('generate-btn');
        const instructionsPanel = document.getElementById('instructions-panel');
        const errorMsg = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');

        let originalImage = null;

        // Drag and Drop Events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.add('drag-active'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, () => dropzone.classList.remove('drag-active'), false);
        });

        dropzone.addEventListener('drop', (e) => {
            let dt = e.dataTransfer;
            let files = dt.files;
            handleFiles(files);
        });

        fileInput.addEventListener('change', function() {
            handleFiles(this.files);
        });

        function handleFiles(files) {
            errorMsg.classList.add('hidden');
            if (files.length === 0) return;
            
            const file = files[0];
            if (!file.type.match('image.*')) {
                showError("Please upload an image file (PNG, JPG, SVG).");
                return;
            }

            fileNameEl.textContent = file.name;
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    previewImg.src = img.src;
                    previewImg.classList.remove('hidden');
                    fileInfoEl.textContent = `${img.width} x ${img.height} px`;
                    
                    // Fade out empty state
                    emptyState.style.opacity = '0';
                    setTimeout(() => emptyState.classList.add('hidden'), 300);
                    
                    if (img.width !== img.height) {
                        showError("Warning: Image is not square. Icons might look stretched. A square image is recommended.");
                    }
                }
                img.onerror = function() {
                    showError("Failed to read image data.");
                }
                img.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }

        function showError(msg) {
            errorText.textContent = msg;
            errorMsg.classList.remove('hidden');
        }

        // Generate and Zip process
        generateBtn.addEventListener('click', async () => {
            if (!originalImage) {
                // Shake animation for empty state if trying to generate without image
                emptyState.style.transform = 'scale(1.05)';
                setTimeout(() => emptyState.style.transform = 'scale(1)', 200);
                return;
            }

            // UI feedback
            const originalBtnText = generateBtn.innerHTML;
            generateBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generating Magic...';
            generateBtn.disabled = true;
            generateBtn.classList.add('opacity-80', 'cursor-not-allowed');

            try {
                const zip = new JSZip();
                
                // Helper to resize and add to zip
                const addSize = (size, filename) => {
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    
                    // Smoothing
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.clearRect(0, 0, size, size);
                    ctx.drawImage(originalImage, 0, 0, size, size);
                    
                    const base64Data = canvas.toDataURL('image/png').split(',')[1];
                    zip.file(filename, base64Data, {base64: true});
                };

                // Standard sizes
                addSize(16, "favicon-16x16.png");
                addSize(32, "favicon-32x32.png");
                addSize(32, "favicon.ico"); // Works perfectly as basic fallback
                addSize(180, "apple-touch-icon.png");
                addSize(192, "android-chrome-192x192.png");
                addSize(512, "android-chrome-512x512.png");

                // Generate webmanifest JSON
                const manifest = {
                    "name": "My Awesome App",
                    "short_name": "App",
                    "icons": [
                        {
                            "src": "/android-chrome-192x192.png",
                            "sizes": "192x192",
                            "type": "image/png"
                        },
                        {
                            "src": "/android-chrome-512x512.png",
                            "sizes": "512x512",
                            "type": "image/png"
                        }
                    ],
                    "theme_color": "#080c12",
                    "background_color": "#080c12",
                    "display": "standalone"
                };
                zip.file("site.webmanifest", JSON.stringify(manifest, null, 4));

                // Generate and Trigger Download
                const content = await zip.generateAsync({type:"blob"});
                saveAs(content, "favicon_package.zip");

                // Show instructions
                instructionsPanel.classList.remove('hidden');
                // Small animation
                instructionsPanel.style.opacity = '0';
                instructionsPanel.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    instructionsPanel.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                    instructionsPanel.style.opacity = '1';
                    instructionsPanel.style.transform = 'translateY(0)';
                }, 50);

                setTimeout(() => {
                    instructionsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);

            } catch (err) {
                console.error(err);
                showError("An error occurred while generating favicons.");
            } finally {
                generateBtn.innerHTML = originalBtnText;
                generateBtn.disabled = false;
                generateBtn.classList.remove('opacity-80', 'cursor-not-allowed');
            }
        });

        function copyCode() {
            const code = document.getElementById('html-code').innerText;
            const btn = document.getElementById('copy-btn');
            
            navigator.clipboard.writeText(code).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                btn.classList.remove('bg-slate-900', 'hover:bg-slate-800', 'text-slate-300');
                btn.classList.add('bg-green-500/20', 'border-green-500/50', 'text-green-400');
                
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.add('bg-slate-900', 'hover:bg-slate-800', 'text-slate-300');
                    btn.classList.remove('bg-green-500/20', 'border-green-500/50', 'text-green-400');
                }, 2000);
            });
        }
    
    window.handleFiles = handleFiles;
  window.copyCode = copyCode;
  window.showError = showError;
  window.preventDefaults = preventDefaults;
  })();
}


// --- thumbnail-downloader.html ---
if (document.body.classList.contains('page-thumbnail-downloader')) {
  (function() {

        const input = document.getElementById('url-input');
        const fetchBtn = document.getElementById('fetch-btn');
        const errorMsg = document.getElementById('error-msg');
        const loadingState = document.getElementById('loading-state');
        const resultSection = document.getElementById('result-section');
        const previewImg = document.getElementById('preview-img');
        const resultTitle = document.getElementById('result-title');
        const downloadOptions = document.getElementById('download-options');
        const platformIcon = document.getElementById('platform-icon');
        const dynamicGlow = document.getElementById('dynamic-glow');
        const navBadge = document.getElementById('nav-badge');
        
        let currentResolutions = {};

        // Dynamic Icon & Glow based on input
        input.addEventListener('input', () => {
            const url = input.value.trim();
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                platformIcon.innerHTML = `<i class="fa-brands fa-youtube text-red-500"></i>`;
                dynamicGlow.style.background = 'radial-gradient(ellipse, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.1) 40%, rgba(0,0,0,0) 70%)';
                navBadge.style.color = '#fca5a5';
                navBadge.style.borderColor = 'rgba(239,68,68,0.3)';
                navBadge.style.backgroundColor = 'rgba(239,68,68,0.1)';
            } else {
                platformIcon.innerHTML = `<i class="fa-solid fa-link"></i>`;
                dynamicGlow.style.background = 'radial-gradient(ellipse, rgba(239, 68, 68, 0.15) 0%, rgba(219, 39, 119, 0.1) 40%, rgba(0,0,0,0) 70%)';
            }
        });

        fetchBtn.addEventListener('click', processUrl);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') processUrl(); });

        async function processUrl() {
            const url = input.value.trim();
            if (!url) return;

            // Reset UI
            errorMsg.classList.add('hidden');
            resultSection.classList.add('hidden');
            loadingState.classList.remove('hidden');
            currentResolutions = {};
            downloadOptions.innerHTML = '';

            try {
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    const videoId = extractYouTubeId(url);
                    if (!videoId) throw new Error("Invalid YouTube URL");
                    handleYouTube(videoId);
                } else {
                    throw new Error("Only YouTube URLs are supported.");
                }
            } catch (err) {
                console.error(err);
                showError(err.message || "Failed to process URL.");
                loadingState.classList.add('hidden');
            }
        }

        function extractYouTubeId(url) {
            const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
            const match = url.match(regExp);
            return (match && match[1]) ? match[1] : null;
        }

        function handleYouTube(id) {
            // YouTube thumbnail URLs
            currentResolutions = {
                'HD (1280x720)': `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
                'SD (640x480)': `https://img.youtube.com/vi/${id}/sddefault.jpg`,
                'HQ (480x360)': `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
                'MQ (320x180)': `https://img.youtube.com/vi/${id}/mqdefault.jpg`
            };

            // Set Preview to highest quality available
            const hdUrl = currentResolutions['HD (1280x720)'];
            previewImg.src = hdUrl;
            
            // To check if MaxRes exists, we try loading it
            // If it fails, fallback to HQ
            previewImg.onerror = function() {
                if(previewImg.src === hdUrl) {
                    previewImg.src = currentResolutions['HQ (480x360)'];
                }
            };

            resultTitle.innerHTML = `<i class="fa-brands fa-youtube text-red-500 mr-2"></i> YouTube Thumbnail`;
            renderDownloadButtons('yt_thumbnail');
            
            loadingState.classList.add('hidden');
            resultSection.classList.remove('hidden');
        }

        function renderDownloadButtons(prefix) {
            Object.keys(currentResolutions).forEach(quality => {
                const url = currentResolutions[quality];
                const btn = document.createElement('button');
                
                // Style differences for HD vs others
                if (quality.includes('HD') || quality.includes('Original')) {
                    btn.className = "w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white font-medium py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-between group";
                    btn.innerHTML = `
                        <div class="flex items-center gap-2"><i class="fa-solid fa-gem text-blue-400"></i> ${quality}</div>
                        <i class="fa-solid fa-download text-slate-400 group-hover:text-white transition-colors"></i>
                    `;
                } else {
                    btn.className = "w-full bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-between group";
                    btn.innerHTML = `
                        <div class="flex items-center gap-2 text-sm">${quality}</div>
                        <i class="fa-solid fa-download text-slate-500 group-hover:text-slate-300 transition-colors text-sm"></i>
                    `;
                }

                btn.onclick = () => downloadImage(quality, prefix);
                downloadOptions.appendChild(btn);
            });
        }

        async function downloadImage(qualityKey, prefix = 'thumbnail') {
            let url = currentResolutions[qualityKey];
            if (!url) url = previewImg.src; // fallback for "View Full Size" button
            
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                saveAs(blob, `${prefix}_${Date.now()}.jpg`);
            } catch (err) {
                console.error(err);
                // Fallback: open in new tab
                window.open(url, '_blank');
            }
        }

        function showError(msg) {
            errorMsg.querySelector('span').textContent = msg;
            errorMsg.classList.remove('hidden');
        }
    
    window.downloadImage = downloadImage;
  window.handleYouTube = handleYouTube;
  window.extractYouTubeId = extractYouTubeId;
  window.processUrl = processUrl;
  window.renderDownloadButtons = renderDownloadButtons;
  window.showError = showError;
  })();
}
