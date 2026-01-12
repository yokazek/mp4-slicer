/**
 * mp4 Slicer
 * クライアントサイドで動画からPNGフレームを抽出
 */

// ============================================
// アプリケーション状態
// ============================================
const state = {
    video: null,
    videoWidth: 0,
    videoHeight: 0,
    duration: 0,

    // クロップ設定（実際のピクセル値）
    crop: { x: 0, y: 0, w: 0, h: 0 },

    // 時間範囲（秒）
    timeRange: { start: 0, end: 0 },

    // 比率設定
    aspectRatio: 'free',
    customRatio: { w: 16, h: 9 },

    // 書き出し間隔（秒）
    interval: 1.0,

    // プレビューフレーム
    previewFrames: [],

    // UI状態
    isDraggingCrop: false,
    cropDragStart: null,
    cropDragMode: null,        // 'move', 'nw', 'ne', 'sw', 'se', 'new'
    cropDragStartRect: null,   // ドラッグ開始時のクロップ領域
    isDraggingHandle: null,

    // テーマ設定
    theme: 'dark',  // 'dark', 'light'
};

// ============================================
// テーマ切り替え
// ============================================
const themeLabels = {
    dark: 'ダーク',
    light: 'ライト'
};

function initTheme() {
    // ローカルストレージから設定を読み込み（デフォルトはダーク）
    const savedTheme = localStorage.getItem('theme') || 'dark';
    // もし古い 'auto' が残っていたら 'dark' に戻す
    state.theme = savedTheme === 'auto' ? 'dark' : savedTheme;
    applyTheme(state.theme);

    // テーマボタンのイベントリスナー
    const btnTheme = document.getElementById('btn-theme');
    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            // ダーク ⇄ ライト の切り替え
            const nextTheme = state.theme === 'dark' ? 'light' : 'dark';

            state.theme = nextTheme;
            localStorage.setItem('theme', nextTheme);
            applyTheme(nextTheme);
        });
    }
}

function applyTheme(theme) {
    // body要素にdata-theme属性を設定
    document.documentElement.setAttribute('data-theme', theme);

    // アイコンの表示切り替え
    const iconLight = document.getElementById('icon-light');
    const iconDark = document.getElementById('icon-dark');
    const themeLabel = document.getElementById('theme-label');

    // 全アイコンを非表示
    [iconLight, iconDark].forEach(icon => {
        if (icon) icon.classList.remove('active');
    });

    // 現在のテーマのアイコンを表示
    if (theme === 'light' && iconLight) iconLight.classList.add('active');
    if (theme === 'dark' && iconDark) iconDark.classList.add('active');

    // ラベルを更新
    if (themeLabel) themeLabel.textContent = themeLabels[theme];
}

// ============================================
// DOM要素
// ============================================
const elements = {
    // ドロップゾーン（動画コンテナ内）
    videoDropZone: document.getElementById('video-drop-zone'),
    fileInput: document.getElementById('file-input'),
    timeControls: document.getElementById('time-controls'),

    // エディター
    editorSection: document.getElementById('editor-section'),
    videoContainer: document.getElementById('video-container'),
    videoPlayer: document.getElementById('video-player'),
    cropOverlay: document.getElementById('crop-overlay'),

    // 時間範囲
    timeStartLabel: document.getElementById('time-start-label'),
    timeCurrentLabel: document.getElementById('time-current-label'),
    timeEndLabel: document.getElementById('time-end-label'),
    rangeTrack: document.getElementById('range-track'),
    rangeSelected: document.getElementById('range-selected'),
    rangeHandleStart: document.getElementById('range-handle-start'),
    rangeHandleEnd: document.getElementById('range-handle-end'),
    btnPlay: document.getElementById('btn-play'),
    playbackSlider: document.getElementById('playback-slider'),

    // クロップ設定
    cropX: document.getElementById('crop-x'),
    cropY: document.getElementById('crop-y'),
    cropW: document.getElementById('crop-w'),
    cropH: document.getElementById('crop-h'),
    aspectRatio: document.getElementById('aspect-ratio'),
    customRatioInputs: document.getElementById('custom-ratio-inputs'),
    customRatioW: document.getElementById('custom-ratio-w'),
    customRatioH: document.getElementById('custom-ratio-h'),
    btnResetCrop: document.getElementById('btn-reset-crop'),

    // 時間入力
    inputStartTime: document.getElementById('input-start-time'),
    inputEndTime: document.getElementById('input-end-time'),
    durationInfo: document.getElementById('duration-info'),

    // 間隔設定
    intervalValue: document.getElementById('interval-value'),
    frameCountInfo: document.getElementById('frame-count-info'),

    // アクション
    btnPreview: document.getElementById('btn-preview'),
    btnExport: document.getElementById('btn-export'),

    // プレビュー
    previewSection: document.getElementById('preview-section'),
    previewCount: document.getElementById('preview-count'),
    previewGallery: document.getElementById('preview-gallery'),
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),

    // モーダル
    imageModal: document.getElementById('image-modal'),
    modalImage: document.getElementById('modal-image'),
    modalInfo: document.getElementById('modal-info'),
    modalClose: document.getElementById('modal-close'),
};

// ============================================
// 初期化
// ============================================
function init() {
    initTheme();
    setupDropZone();
    setupCropOverlay();
    setupTimeRange();
    setupSettings();
    setupActions();
}

// ============================================
// ドラッグ＆ドロップ（動画コンテナ内）
// ============================================
function setupDropZone() {
    const { videoDropZone, fileInput, videoContainer } = elements;
    const btnReloadVideo = document.getElementById('btn-reload-video');

    // ドロップゾーンのクリックでファイル選択
    videoDropZone.addEventListener('click', () => fileInput.click());

    // ドロップゾーンのドラッグオーバー
    videoDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        videoDropZone.classList.add('drag-over');
    });

    // ドロップゾーンのドラッグリーブ
    videoDropZone.addEventListener('dragleave', () => {
        videoDropZone.classList.remove('drag-over');
    });

    // ドロップゾーンのドロップ
    videoDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        videoDropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            loadVideo(file);
        }
    });

    // 動画コンテナ全体へのD&D（動画読み込み後も有効）
    videoContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        // ドロップゾーンが非表示の場合は動画コンテナにスタイルを適用
        if (videoDropZone.classList.contains('hidden')) {
            videoContainer.classList.add('drag-over');
        }
    });

    videoContainer.addEventListener('dragleave', (e) => {
        // 子要素への移動の場合は無視
        if (e.relatedTarget && videoContainer.contains(e.relatedTarget)) return;
        videoContainer.classList.remove('drag-over');
    });

    videoContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        videoContainer.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('video/')) {
            loadVideo(file);
        }
    });

    // 再アップロードボタンのクリック
    btnReloadVideo.addEventListener('click', () => fileInput.click());

    // ファイル入力変更
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) loadVideo(file);
    });
}

// ============================================
// 動画読み込み
// ============================================
function loadVideo(file) {
    const url = URL.createObjectURL(file);
    const video = elements.videoPlayer;

    video.src = url;
    video.load();

    video.onloadedmetadata = () => {
        state.video = video;
        state.videoWidth = video.videoWidth;
        state.videoHeight = video.videoHeight;
        state.duration = video.duration;

        // 初期クロップ（全体）
        state.crop = { x: 0, y: 0, w: state.videoWidth, h: state.videoHeight };

        // 初期時間範囲
        state.timeRange = { start: 0, end: state.duration };

        // UI更新
        updateCropInputs();
        updateTimeLabels();
        updateTimeInputs();
        updateFrameCountInfo();

        // ドロップゾーンを非表示にして時間コントロールを表示
        elements.videoDropZone.classList.add('hidden');
        elements.timeControls.classList.remove('hidden');

        // 再アップロードボタンを表示
        const btnReloadVideo = document.getElementById('btn-reload-video');
        btnReloadVideo.classList.remove('hidden');

        // プレビューをリセット
        state.previewFrames = [];
        elements.previewGallery.innerHTML = '';
        elements.previewSection.classList.add('hidden');
        elements.btnExport.disabled = true;

        // プレビューボタンを有効化
        elements.btnPreview.disabled = false;

        // クロップオーバーレイを初期化
        resizeCropOverlay();
        drawCropOverlay();
    };

    video.ontimeupdate = () => {
        const pct = (video.currentTime / state.duration) * 100;
        elements.playbackSlider.value = pct;
        elements.timeCurrentLabel.textContent = formatTime(video.currentTime);
    };
}

// ============================================
// クロップオーバーレイ
// ============================================
function setupCropOverlay() {
    const canvas = elements.cropOverlay;

    canvas.addEventListener('mousedown', onCropMouseDown);
    canvas.addEventListener('mousemove', onCropMouseMove);
    canvas.addEventListener('mouseup', onCropMouseUp);
    canvas.addEventListener('mouseleave', onCropMouseUp);

    window.addEventListener('resize', () => {
        resizeCropOverlay();
        drawCropOverlay();
    });
}

function resizeCropOverlay() {
    const container = elements.videoContainer;
    const canvas = elements.cropOverlay;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

function getVideoDisplayRect() {
    // 動画の表示領域を計算（object-fit: contain考慮）
    const container = elements.videoContainer;
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    const videoRatio = state.videoWidth / state.videoHeight;
    const containerRatio = containerW / containerH;

    let displayW, displayH, offsetX, offsetY;

    if (videoRatio > containerRatio) {
        displayW = containerW;
        displayH = containerW / videoRatio;
        offsetX = 0;
        offsetY = (containerH - displayH) / 2;
    } else {
        displayH = containerH;
        displayW = containerH * videoRatio;
        offsetX = (containerW - displayW) / 2;
        offsetY = 0;
    }

    return { displayW, displayH, offsetX, offsetY };
}

function videoToCanvas(x, y) {
    const { displayW, displayH, offsetX, offsetY } = getVideoDisplayRect();
    const scaleX = displayW / state.videoWidth;
    const scaleY = displayH / state.videoHeight;
    return {
        x: x * scaleX + offsetX,
        y: y * scaleY + offsetY
    };
}

function canvasToVideo(canvasX, canvasY) {
    const { displayW, displayH, offsetX, offsetY } = getVideoDisplayRect();
    const scaleX = state.videoWidth / displayW;
    const scaleY = state.videoHeight / displayH;
    return {
        x: (canvasX - offsetX) * scaleX,
        y: (canvasY - offsetY) * scaleY
    };
}

function getCropCanvasRect() {
    const cropCanvas = videoToCanvas(state.crop.x, state.crop.y);
    const cropEndCanvas = videoToCanvas(state.crop.x + state.crop.w, state.crop.y + state.crop.h);
    return {
        x: cropCanvas.x,
        y: cropCanvas.y,
        w: cropEndCanvas.x - cropCanvas.x,
        h: cropEndCanvas.y - cropCanvas.y
    };
}

function drawCropOverlay() {
    const canvas = elements.cropOverlay;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!state.video) return;

    // 暗いオーバーレイ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // クロップ領域をクリア（明るく表示）
    const { x: cropX, y: cropY, w: cropW, h: cropH } = getCropCanvasRect();

    ctx.clearRect(cropX, cropY, cropW, cropH);

    // クロップ枠
    ctx.strokeStyle = '#FBBC04';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // コーナーハンドル（大きめに表示）
    const handleSize = 12;
    ctx.fillStyle = '#FBBC04';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    const corners = [
        { x: cropX, y: cropY, cursor: 'nw-resize' },
        { x: cropX + cropW, y: cropY, cursor: 'ne-resize' },
        { x: cropX, y: cropY + cropH, cursor: 'sw-resize' },
        { x: cropX + cropW, y: cropY + cropH, cursor: 'se-resize' },
    ];
    corners.forEach(corner => {
        ctx.fillRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(corner.x - handleSize / 2, corner.y - handleSize / 2, handleSize, handleSize);
    });

    // 3分割ガイド線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    for (let i = 1; i <= 2; i++) {
        const xLine = cropX + (cropW * i / 3);
        const yLine = cropY + (cropH * i / 3);
        ctx.beginPath();
        ctx.moveTo(xLine, cropY);
        ctx.lineTo(xLine, cropY + cropH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cropX, yLine);
        ctx.lineTo(cropX + cropW, yLine);
        ctx.stroke();
    }
}

// マウス位置からドラッグモードを判定
function getCropDragMode(canvasX, canvasY) {
    const { x, y, w, h } = getCropCanvasRect();
    const handleSize = 16; // ヒット判定用（表示より少し大きめ）

    // 四隅のハンドルをチェック
    const corners = [
        { x: x, y: y, mode: 'nw' },
        { x: x + w, y: y, mode: 'ne' },
        { x: x, y: y + h, mode: 'sw' },
        { x: x + w, y: y + h, mode: 'se' },
    ];

    for (const corner of corners) {
        if (Math.abs(canvasX - corner.x) <= handleSize && Math.abs(canvasY - corner.y) <= handleSize) {
            return corner.mode;
        }
    }

    // 領域内かチェック
    if (canvasX >= x && canvasX <= x + w && canvasY >= y && canvasY <= y + h) {
        return 'move';
    }

    // 領域外 = 新規選択
    return 'new';
}

// カーソルスタイルを更新
function updateCursor(mode) {
    const canvas = elements.cropOverlay;
    switch (mode) {
        case 'nw': canvas.style.cursor = 'nw-resize'; break;
        case 'ne': canvas.style.cursor = 'ne-resize'; break;
        case 'sw': canvas.style.cursor = 'sw-resize'; break;
        case 'se': canvas.style.cursor = 'se-resize'; break;
        case 'move': canvas.style.cursor = 'move'; break;
        default: canvas.style.cursor = 'crosshair';
    }
}

function onCropMouseDown(e) {
    const rect = elements.cropOverlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const mode = getCropDragMode(x, y);

    state.cropDragMode = mode;
    state.isDraggingCrop = true;
    state.cropDragStart = { x, y };
    state.cropDragStartRect = { ...state.crop };
}

function onCropMouseMove(e) {
    const rect = elements.cropOverlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // カーソル更新（ドラッグ中でない時）
    if (!state.isDraggingCrop) {
        const mode = getCropDragMode(x, y);
        updateCursor(mode);
        return;
    }

    const startVideo = canvasToVideo(state.cropDragStart.x, state.cropDragStart.y);
    const currentVideo = canvasToVideo(x, y);
    const deltaX = currentVideo.x - startVideo.x;
    const deltaY = currentVideo.y - startVideo.y;

    const orig = state.cropDragStartRect;
    let newX = orig.x, newY = orig.y, newW = orig.w, newH = orig.h;

    switch (state.cropDragMode) {
        case 'move':
            // 移動
            newX = orig.x + deltaX;
            newY = orig.y + deltaY;
            // 境界制限
            newX = Math.max(0, Math.min(newX, state.videoWidth - newW));
            newY = Math.max(0, Math.min(newY, state.videoHeight - newH));
            break;

        case 'nw':
            // 左上コーナー
            newX = orig.x + deltaX;
            newY = orig.y + deltaY;
            newW = orig.w - deltaX;
            newH = orig.h - deltaY;
            break;

        case 'ne':
            // 右上コーナー
            newY = orig.y + deltaY;
            newW = orig.w + deltaX;
            newH = orig.h - deltaY;
            break;

        case 'sw':
            // 左下コーナー
            newX = orig.x + deltaX;
            newW = orig.w - deltaX;
            newH = orig.h + deltaY;
            break;

        case 'se':
            // 右下コーナー
            newW = orig.w + deltaX;
            newH = orig.h + deltaY;
            break;

        case 'new':
            // 新規選択
            newX = Math.min(startVideo.x, currentVideo.x);
            newY = Math.min(startVideo.y, currentVideo.y);
            newW = Math.abs(currentVideo.x - startVideo.x);
            newH = Math.abs(currentVideo.y - startVideo.y);
            break;
    }

    // 比率制約を適用（移動以外）
    if (state.cropDragMode !== 'move' && state.aspectRatio !== 'free') {
        const ratio = getAspectRatioValue();
        if (ratio) {
            // 幅を基準に高さを調整
            const targetH = newW / ratio;
            if (state.cropDragMode === 'nw' || state.cropDragMode === 'sw') {
                // 左側ハンドル：右端を固定
            }
            if (state.cropDragMode === 'nw' || state.cropDragMode === 'ne') {
                // 上側ハンドル：下端を固定
                newY = orig.y + orig.h - targetH;
            }
            newH = targetH;
        }
    }

    // 最小サイズ制限
    newW = Math.max(20, newW);
    newH = Math.max(20, newH);

    // 境界制限（リサイズ時）
    if (state.cropDragMode !== 'move') {
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        if (newX + newW > state.videoWidth) newW = state.videoWidth - newX;
        if (newY + newH > state.videoHeight) newH = state.videoHeight - newY;
    }

    state.crop = {
        x: Math.round(newX),
        y: Math.round(newY),
        w: Math.round(newW),
        h: Math.round(newH)
    };
    updateCropInputs();
    drawCropOverlay();
}

function onCropMouseUp() {
    state.isDraggingCrop = false;
    state.cropDragMode = null;
}

function getAspectRatioValue() {
    switch (state.aspectRatio) {
        case 'free': return null;
        case 'original': return state.videoWidth / state.videoHeight;
        case '16:9': return 16 / 9;
        case '4:3': return 4 / 3;
        case '1:1': return 1;
        case '9:16': return 9 / 16;
        case 'custom': return state.customRatio.w / state.customRatio.h;
        default: return null;
    }
}

function updateCropInputs() {
    elements.cropX.value = state.crop.x;
    elements.cropY.value = state.crop.y;
    elements.cropW.value = state.crop.w;
    elements.cropH.value = state.crop.h;
}

// ============================================
// 時間範囲
// ============================================
function setupTimeRange() {
    // ハンドルドラッグ
    [elements.rangeHandleStart, elements.rangeHandleEnd].forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            state.isDraggingHandle = handle.dataset.handle;
            e.preventDefault();
        });
    });

    document.addEventListener('mousemove', onTimeRangeMove);
    document.addEventListener('mouseup', () => {
        state.isDraggingHandle = null;
    });

    // 再生ボタン
    elements.btnPlay.addEventListener('click', togglePlay);

    // 再生スライダー
    elements.playbackSlider.addEventListener('input', (e) => {
        const time = (e.target.value / 100) * state.duration;
        elements.videoPlayer.currentTime = time;
    });
}

function onTimeRangeMove(e) {
    if (!state.isDraggingHandle) return;

    const track = elements.rangeTrack;
    const rect = track.getBoundingClientRect();
    let pct = (e.clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));

    const time = pct * state.duration;

    if (state.isDraggingHandle === 'start') {
        state.timeRange.start = Math.min(time, state.timeRange.end - 0.1);
    } else {
        state.timeRange.end = Math.max(time, state.timeRange.start + 0.1);
    }

    updateTimeLabels();
    updateTimeInputs();
    updateFrameCountInfo();
}

function updateTimeLabels() {
    elements.timeStartLabel.textContent = formatTime(state.timeRange.start);
    elements.timeEndLabel.textContent = formatTime(state.timeRange.end);

    // ハンドル位置更新
    const startPct = (state.timeRange.start / state.duration) * 100;
    const endPct = (state.timeRange.end / state.duration) * 100;

    elements.rangeHandleStart.style.left = `${startPct}%`;
    elements.rangeHandleEnd.style.left = `${endPct}%`;
    elements.rangeSelected.style.left = `${startPct}%`;
    elements.rangeSelected.style.width = `${endPct - startPct}%`;
}

function updateTimeInputs() {
    elements.inputStartTime.value = formatTime(state.timeRange.start);
    elements.inputEndTime.value = formatTime(state.timeRange.end);

    const duration = state.timeRange.end - state.timeRange.start;
    elements.durationInfo.textContent = `選択範囲: ${duration.toFixed(2)}秒`;
}

function togglePlay() {
    const video = elements.videoPlayer;
    if (video.paused) {
        video.play();
        elements.btnPlay.textContent = '⏸';
    } else {
        video.pause();
        elements.btnPlay.textContent = '▶';
    }
}

// ============================================
// 設定パネル
// ============================================
function setupSettings() {
    // クロップ数値入力
    ['cropX', 'cropY', 'cropW', 'cropH'].forEach(id => {
        elements[id].addEventListener('change', () => {
            state.crop.x = parseInt(elements.cropX.value) || 0;
            state.crop.y = parseInt(elements.cropY.value) || 0;
            state.crop.w = parseInt(elements.cropW.value) || 100;
            state.crop.h = parseInt(elements.cropH.value) || 100;
            drawCropOverlay();
        });
    });

    // 比率選択
    elements.aspectRatio.addEventListener('change', (e) => {
        state.aspectRatio = e.target.value;
        elements.customRatioInputs.classList.toggle('hidden', e.target.value !== 'custom');
        applyCropRatio();
    });

    // カスタム比率
    elements.customRatioW.addEventListener('change', () => {
        state.customRatio.w = parseInt(elements.customRatioW.value) || 16;
        applyCropRatio();
    });
    elements.customRatioH.addEventListener('change', () => {
        state.customRatio.h = parseInt(elements.customRatioH.value) || 9;
        applyCropRatio();
    });

    // リセットボタン
    elements.btnResetCrop.addEventListener('click', () => {
        state.crop = { x: 0, y: 0, w: state.videoWidth, h: state.videoHeight };
        updateCropInputs();
        drawCropOverlay();
    });

    // 時間入力
    elements.inputStartTime.addEventListener('change', () => {
        const time = parseTime(elements.inputStartTime.value);
        if (time !== null && time < state.timeRange.end) {
            state.timeRange.start = time;
            updateTimeLabels();
            updateFrameCountInfo();
        }
    });
    elements.inputEndTime.addEventListener('change', () => {
        const time = parseTime(elements.inputEndTime.value);
        if (time !== null && time > state.timeRange.start) {
            state.timeRange.end = time;
            updateTimeLabels();
            updateFrameCountInfo();
        }
    });

    // 間隔設定
    elements.intervalValue.addEventListener('change', () => {
        state.interval = parseFloat(elements.intervalValue.value) || 1.0;
        updateFrameCountInfo();
    });
}

function applyCropRatio() {
    const ratio = getAspectRatioValue();
    if (!ratio) return;

    // 現在のクロップ中心を維持して比率を適用
    const centerX = state.crop.x + state.crop.w / 2;
    const centerY = state.crop.y + state.crop.h / 2;

    let newW = state.crop.w;
    let newH = state.crop.h;

    if (newW / newH > ratio) {
        newW = newH * ratio;
    } else {
        newH = newW / ratio;
    }

    let newX = centerX - newW / 2;
    let newY = centerY - newH / 2;

    // 境界チェック
    newX = Math.max(0, Math.min(newX, state.videoWidth - newW));
    newY = Math.max(0, Math.min(newY, state.videoHeight - newH));

    state.crop = { x: Math.round(newX), y: Math.round(newY), w: Math.round(newW), h: Math.round(newH) };
    updateCropInputs();
    drawCropOverlay();
}

function updateFrameCountInfo() {
    const duration = state.timeRange.end - state.timeRange.start;
    const frameCount = Math.floor(duration / state.interval) + 1;
    elements.frameCountInfo.textContent = `推定フレーム数: ${frameCount}`;
}

// ============================================
// フレーム抽出
// ============================================
function setupActions() {
    elements.btnPreview.addEventListener('click', generatePreview);
    elements.btnExport.addEventListener('click', exportPNG);
}

async function generatePreview() {
    const frames = await extractFrames(true);
    displayPreview(frames);
    elements.btnExport.disabled = frames.length === 0;
}

async function extractFrames(isPreview = false) {
    const video = elements.videoPlayer;
    const { start, end } = state.timeRange;
    const { x, y, w, h } = state.crop;
    const interval = state.interval;

    const frames = [];
    const times = [];

    for (let t = start; t <= end; t += interval) {
        times.push(t);
    }

    // プログレス表示
    elements.previewSection.classList.remove('hidden');
    elements.progressContainer.classList.remove('hidden');
    elements.previewGallery.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < times.length; i++) {
        const t = times[i];

        // 進捗更新
        const progress = ((i + 1) / times.length) * 100;
        elements.progressFill.style.width = `${progress}%`;
        elements.progressText.textContent = `処理中... ${i + 1} / ${times.length}`;

        // フレーム取得
        video.currentTime = t;
        await new Promise(resolve => {
            video.onseeked = resolve;
        });

        // クロップして描画
        ctx.drawImage(video, x, y, w, h, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/png');
        frames.push({
            time: t,
            dataUrl,
            index: i + 1
        });
    }

    elements.progressContainer.classList.add('hidden');
    state.previewFrames = frames;

    return frames;
}

function displayPreview(frames) {
    elements.previewCount.textContent = `(${frames.length} フレーム)`;
    elements.previewGallery.innerHTML = '';

    frames.forEach(frame => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${frame.dataUrl}" alt="Frame ${frame.index}">
            <div class="frame-label">#${frame.index} (${formatTime(frame.time)})</div>
        `;
        // クリックで実サイズ表示
        item.addEventListener('click', () => {
            showImageModal(frame);
        });
        elements.previewGallery.appendChild(item);
    });

    // モーダル閉じるイベント設定
    setupModal();
}

// ============================================
// モーダル表示
// ============================================
let modalSetupDone = false;
let currentModalIndex = 0;

function setupModal() {
    if (modalSetupDone) return;
    modalSetupDone = true;

    const { imageModal, modalClose } = elements;
    const modalPrev = document.getElementById('modal-prev');
    const modalNext = document.getElementById('modal-next');

    // 閉じるボタン
    modalClose.addEventListener('click', closeImageModal);

    // 背景クリックで閉じる
    imageModal.querySelector('.modal-backdrop').addEventListener('click', closeImageModal);

    // 前後ナビゲーションボタン
    modalPrev.addEventListener('click', showPrevImage);
    modalNext.addEventListener('click', showNextImage);

    // キーボードナビゲーション
    document.addEventListener('keydown', (e) => {
        if (imageModal.classList.contains('hidden')) return;

        switch (e.key) {
            case 'Escape':
                closeImageModal();
                break;
            case 'ArrowLeft':
                showPrevImage();
                break;
            case 'ArrowRight':
                showNextImage();
                break;
        }
    });
}

function showImageModal(frame) {
    const { imageModal, modalImage, modalInfo } = elements;

    // インデックスを記録（0始まりに変換）
    currentModalIndex = frame.index - 1;

    updateModalContent();
    imageModal.classList.remove('hidden');
}

function updateModalContent() {
    const { modalImage, modalInfo } = elements;
    const frame = state.previewFrames[currentModalIndex];

    if (!frame) return;

    modalImage.src = frame.dataUrl;
    modalInfo.textContent = `フレーム #${frame.index} / ${state.previewFrames.length} | 時間: ${formatTime(frame.time)} | サイズ: ${state.crop.w} × ${state.crop.h}px | ← → でナビゲート`;
}

function showPrevImage() {
    if (state.previewFrames.length === 0) return;
    currentModalIndex = (currentModalIndex - 1 + state.previewFrames.length) % state.previewFrames.length;
    updateModalContent();
}

function showNextImage() {
    if (state.previewFrames.length === 0) return;
    currentModalIndex = (currentModalIndex + 1) % state.previewFrames.length;
    updateModalContent();
}

function closeImageModal() {
    elements.imageModal.classList.add('hidden');
}

// ============================================
// PNG書き出し
// ============================================
async function exportPNG() {
    if (state.previewFrames.length === 0) {
        await generatePreview();
    }

    elements.progressContainer.classList.remove('hidden');
    elements.progressText.textContent = 'ZIPを生成中...';
    elements.progressFill.style.width = '0%';

    const zip = new JSZip();

    for (let i = 0; i < state.previewFrames.length; i++) {
        const frame = state.previewFrames[i];
        const base64Data = frame.dataUrl.split(',')[1];
        const filename = `frame_${String(frame.index).padStart(4, '0')}.png`;
        zip.file(filename, base64Data, { base64: true });

        const progress = ((i + 1) / state.previewFrames.length) * 100;
        elements.progressFill.style.width = `${progress}%`;
    }

    const content = await zip.generateAsync({ type: 'blob' });

    // ダウンロード
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frames_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(url);

    elements.progressContainer.classList.add('hidden');
}

// ============================================
// ユーティリティ
// ============================================
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const ms = Math.floor((secs % 1) * 1000);
    return `${String(mins).padStart(2, '0')}:${String(Math.floor(secs)).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

function parseTime(str) {
    const match = str.match(/^(\d+):(\d+)(?:\.(\d+))?$/);
    if (!match) return null;
    const mins = parseInt(match[1]);
    const secs = parseInt(match[2]);
    const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3)) : 0;
    return mins * 60 + secs + ms / 1000;
}

// 初期化実行
init();
