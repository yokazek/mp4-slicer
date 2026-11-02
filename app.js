/**
 * mp4 Slicer
 * クライアントサイドで動画からPNGフレームを抽出
 */

// ============================================
// アプリケーション状態
// ============================================
const state = {
    sourceMode: null, // 'video' | 'image'
    video: null,
    sourceFile: null,
    videoWidth: 0,
    videoHeight: 0,
    duration: 0,
    sourceFrameCount: null,
    sourceFps: null,

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
    imageObjectUrls: [],
    outputAspectRatio: 1,
    gifCancelled: false,
    activeProgressButton: null,
    activeProgressButtonWasDisabled: false,

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
    // 動画・画像の共通入力
    mediaDropZone: document.getElementById('media-drop-zone'),
    mediaFileInput: document.getElementById('media-file-input'),
    imageFolderInput: document.getElementById('image-folder-input'),
    btnSelectFiles: document.getElementById('btn-select-files'),
    btnSelectFolder: document.getElementById('btn-select-folder'),
    imageImportStatus: document.getElementById('image-import-status'),

    // 動画の時間操作
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
    sourceFrameInfo: document.getElementById('source-frame-info'),
    btnFrameInterval: document.getElementById('btn-frame-interval'),
    frameCountInfo: document.getElementById('frame-count-info'),

    // アクション
    btnPreview: document.getElementById('btn-preview'),
    btnExport: document.getElementById('btn-export'),
    exportImageFormat: document.getElementById('export-image-format'),
    webpExportOptions: document.getElementById('webp-export-options'),
    webpMode: document.getElementById('webp-mode'),
    webpQuality: document.getElementById('webp-quality'),
    webpQualityLabel: document.getElementById('webp-quality-label'),
    webpEffort: document.getElementById('webp-effort'),
    webpOptionHint: document.getElementById('webp-option-hint'),

    // プレビュー
    previewSection: document.getElementById('preview-section'),
    previewCount: document.getElementById('preview-count'),
    previewGallery: document.getElementById('preview-gallery'),
    timelineSeek: document.getElementById('timeline-seek'),
    timelinePositionLabel: document.getElementById('timeline-position-label'),
    previewHint: document.getElementById('preview-hint'),
    selectionToolbar: document.getElementById('selection-toolbar'),
    selectionCount: document.getElementById('selection-count'),
    btnSelectAll: document.getElementById('btn-select-all'),
    btnSelectNone: document.getElementById('btn-select-none'),
    flipbookPlayer: document.getElementById('flipbook-player'),
    flipbookImage: document.getElementById('flipbook-image'),
    flipbookInfo: document.getElementById('flipbook-info'),
    btnFlipbookPlay: document.getElementById('btn-flipbook-play'),
    btnFlipbookClose: document.getElementById('btn-flipbook-close'),
    btnPreviewPrev: document.getElementById('btn-preview-prev'),
    btnPreviewNext: document.getElementById('btn-preview-next'),
    previewFrameIncluded: document.getElementById('preview-frame-included'),
    progressContainer: document.getElementById('progress-container'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    progressPercent: document.getElementById('progress-percent'),

    outputSizeMode: document.getElementById('output-size-mode'),
    outputTransparent: document.getElementById('output-transparent'),
    outputPreview: document.getElementById('output-preview'),
    outputPreviewInfo: document.getElementById('output-preview-info'),
    // 共通加工・GIF出力
    outputWidth: document.getElementById('output-width'),
    outputHeight: document.getElementById('output-height'),
    outputLockRatio: document.getElementById('output-lock-ratio'),
    gifFps: document.getElementById('gif-fps'),
    gifColors: document.getElementById('gif-colors'),
    outputFit: document.getElementById('output-fit'),
    outputBackground: document.getElementById('output-background'),
    gifRepeat: document.getElementById('gif-repeat'),
    gifDither: document.getElementById('gif-dither'),
    gifEstimate: document.getElementById('gif-estimate'),
    btnExportGif: document.getElementById('btn-export-gif'),
    btnCancelGif: document.getElementById('btn-cancel-gif'),
    gifResult: document.getElementById('gif-result'),

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
    setupMediaImport();
    setupCropOverlay();
    setupTimeRange();
    setupSettings();
    setupActions();
    window.addEventListener('beforeunload', stopWebpWorker);
}

// ============================================
// 画像リスト／フォルダー読み込み
// ============================================
const supportedImagePattern = /\.(png|jpe?g|webp|gif|bmp)$/i;
const naturalFileCollator = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' });

function setupMediaImport() {
    const { mediaDropZone, mediaFileInput, imageFolderInput, btnSelectFiles, btnSelectFolder } = elements;

    btnSelectFiles.addEventListener('click', (event) => {
        event.stopPropagation();
        mediaFileInput.click();
    });
    btnSelectFolder.addEventListener('click', (event) => {
        event.stopPropagation();
        imageFolderInput.click();
    });
    mediaDropZone.addEventListener('click', () => mediaFileInput.click());
    mediaDropZone.addEventListener('keydown', (event) => {
        if (event.target !== mediaDropZone) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            mediaFileInput.click();
        }
    });
    mediaDropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        mediaDropZone.classList.add('drag-over');
    });
    mediaDropZone.addEventListener('dragleave', event => {
        if (event.relatedTarget && mediaDropZone.contains(event.relatedTarget)) return;
        mediaDropZone.classList.remove('drag-over');
    });
    mediaDropZone.addEventListener('drop', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (document.body.classList.contains('is-processing')) return;
        mediaDropZone.classList.remove('drag-over');
        await handleMediaDrop(event.dataTransfer);
    });

    mediaFileInput.addEventListener('change', async (event) => {
        await loadMediaFiles(Array.from(event.target.files));
        event.target.value = '';
    });
    imageFolderInput.addEventListener('change', async (event) => {
        await loadImageFiles(Array.from(event.target.files));
        event.target.value = '';
    });
}

async function handleMediaDrop(dataTransfer) {
    const items = Array.from(dataTransfer.items || []);
    const entries = items.map(item => item.webkitGetAsEntry?.()).filter(Boolean);
    let files;

    if (entries.length > 0) {
        files = (await Promise.all(entries.map(entry => readDroppedEntry(entry)))).flat();
    } else {
        files = Array.from(dataTransfer.files || []);
    }

    await loadMediaFiles(files);
}

async function readDroppedEntry(entry, parentPath = '') {
    if (entry.isFile) {
        const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
        Object.defineProperty(file, '_dropPath', {
            value: `${parentPath}${file.name}`,
            configurable: true
        });
        return [file];
    }
    if (!entry.isDirectory) return [];

    const reader = entry.createReader();
    const children = [];
    while (true) {
        const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        if (batch.length === 0) break;
        children.push(...batch);
    }
    const directoryPath = `${parentPath}${entry.name}/`;
    return (await Promise.all(children.map(child => readDroppedEntry(child, directoryPath)))).flat();
}

function isSupportedImage(file) {
    return file.type.startsWith('image/') && supportedImagePattern.test(file.name)
        || supportedImagePattern.test(file.name);
}

function getImagePath(file) {
    return file.webkitRelativePath || file._dropPath || file.name;
}

async function loadImageFiles(files) {
    const imageFiles = files.filter(isSupportedImage).sort((a, b) =>
        naturalFileCollator.compare(getImagePath(a), getImagePath(b))
    );
    if (imageFiles.length === 0) {
        showImageImportStatus('対応する画像が見つかりませんでした', true);
        return;
    }

    releaseImageObjectUrls();
    closeFlipbook();
    elements.previewSection.classList.remove('hidden');
    showProgress('画像を読み込み中...');
    elements.previewGallery.innerHTML = '';
    showImageImportStatus(`${imageFiles.length}枚の画像を読み込み中...`);

    const frames = [];
    let failedCount = 0;
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        try {
            const decoded = await decodeImageFile(file);
            frames.push({
                id: `image-${Date.now()}-${i}`,
                sourceType: 'image',
                file,
                name: file.name,
                relativePath: getImagePath(file),
                dataUrl: decoded.url,
                width: decoded.width,
                height: decoded.height,
                time: i / 6,
                index: frames.length + 1,
                selected: true
            });
            state.imageObjectUrls.push(decoded.url);
        } catch (error) {
            failedCount++;
        }
        const progress = ((i + 1) / imageFiles.length) * 100;
        updateProgress(progress, `画像を読み込み中... ${i + 1} / ${imageFiles.length}`);
        if (i % 10 === 0) await nextPaint();
    }

    hideProgress();
    if (frames.length === 0) {
        showImageImportStatus('画像を読み込めませんでした', true);
        elements.previewSection.classList.add('hidden');
        return;
    }

    state.sourceMode = 'image';
    state.previewFrames = frames;
    updateExtractionStatus();
    elements.videoPlayer.pause();
    elements.editorSection.classList.add('hidden');
    initializeOutputSize(frames[0]);
    displayPreview(frames);
    updateGifEstimate();

    const message = `${frames.length}枚を読み込みました${failedCount ? `（${failedCount}枚は読み込み失敗）` : ''}`;
    showImageImportStatus(message, failedCount > 0);
    elements.previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function decodeImageFile(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => resolve({ url, width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error(`画像を読み込めません: ${file.name}`));
        };
        image.src = url;
    });
}

function releaseImageObjectUrls() {
    state.imageObjectUrls.forEach(url => URL.revokeObjectURL(url));
    state.imageObjectUrls = [];
}

function showImageImportStatus(message, isError = false) {
    elements.imageImportStatus.textContent = message;
    elements.imageImportStatus.classList.toggle('error', isError);
}

function nextPaint() {
    return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function showProgress(message, button = null) {
    stopFlipbook();
    state.processingControls = [...document.querySelectorAll('button, input, select')].filter(control => control.id !== 'btn-cancel-gif').map(control => [control, control.disabled]);
    state.processingControls.forEach(([control]) => { control.disabled = true; });
    state.activeProgressButton = button;
    state.activeProgressButtonWasDisabled = state.processingControls.find(([control]) => control === button)?.[1] || false;
    elements.progressContainer.classList.remove('hidden');
    elements.progressContainer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-processing');
    if (button) {
        button.disabled = true;
        button.classList.add('button-progress');
        button.setAttribute('aria-busy', 'true');
    }
    updateProgress(0, message);
}

function updateProgress(percent, message) {
    const value = Math.min(100, Math.max(0, Number(percent) || 0));
    elements.progressFill.style.width = `${value}%`;
    elements.progressPercent.textContent = `${Math.round(value)}%`;
    if (message) elements.progressText.textContent = message;
    if (state.activeProgressButton) {
        state.activeProgressButton.style.setProperty('--button-progress', `${value}%`);
    }
}

function hideProgress() {
    const button = state.activeProgressButton;
    elements.progressContainer.classList.add('hidden');
    elements.progressContainer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-processing');
    if (button) {
        button.classList.remove('button-progress');
        button.style.removeProperty('--button-progress');
        button.removeAttribute('aria-busy');
        button.disabled = state.activeProgressButtonWasDisabled;
    }
    state.processingControls?.forEach(([control, disabled]) => { control.disabled = disabled; });
    state.processingControls = null;
    state.activeProgressButton = null;
    state.activeProgressButtonWasDisabled = false;
}

// ============================================
// 読み込んだ素材を種類に応じて振り分ける
// ============================================
// 動画1本、または連番画像を同じ入口で受け付ける。
async function loadMediaFiles(files) {
    if (files.length === 0) return;
    const videos = files.filter(file => file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name));
    if (videos.length > 1 || (videos.length && files.some(isSupportedImage))) {
        showImageImportStatus('動画は1本ずつ、連番画像とは分けて読み込んでください。', true);
        return;
    }
    if (videos.length) loadVideo(videos[0]);
    else await loadImageFiles(files);
}

function loadVideo(file) {
    showImageImportStatus(`${file.name} を読み込み中...`);
    releaseImageObjectUrls();
    state.sourceMode = 'video';
    elements.editorSection.classList.remove('hidden');
    const url = URL.createObjectURL(file);
    const video = elements.videoPlayer;

    video.src = url;
    video.load();
    state.sourceFile = file;
    state.sourceFrameCount = null;
    state.sourceFps = null;
    elements.sourceFrameInfo.textContent = '元動画: フレーム情報を解析中...';
    elements.btnFrameInterval.disabled = true;

    readMp4VideoFrameCount(file).then(frameCount => {
        if (state.sourceFile !== file) return;
        if (!frameCount) {
            elements.sourceFrameInfo.textContent = '元動画: フレーム数を取得できませんでした';
            return;
        }
        state.sourceFrameCount = frameCount;
        updateSourceFrameInfo();
    }).catch(() => {
        if (state.sourceFile === file) elements.sourceFrameInfo.textContent = '元動画: フレーム数を取得できませんでした';
    });

    video.onloadedmetadata = () => {
        // 一部の動画ではシーク後にも通知されるため、編集状態の初期化は一度だけ行う。
        video.onloadedmetadata = null;
        state.video = video;
        state.videoWidth = video.videoWidth;
        state.videoHeight = video.videoHeight;
        state.duration = video.duration;
        updateSourceFrameInfo();

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
        elements.timeControls.classList.remove('hidden');

        // プレビューをリセット
        state.previewFrames = [];
        closeFlipbook();
        elements.previewGallery.innerHTML = '';
        elements.previewSection.classList.add('hidden');
        elements.btnExport.disabled = true;
        updateWebpExportOptions();
        elements.btnExportGif.disabled = true;

        // プレビューボタンを有効化
        elements.btnPreview.disabled = false;

        showImageImportStatus(`動画: ${file.name}`);
        elements.editorSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // クロップオーバーレイを初期化
        resizeCropOverlay();
        drawCropOverlay();
    };

    video.onerror = () => showImageImportStatus('動画を読み込めませんでした。対応形式の動画を選択してください。', true);

    video.ontimeupdate = () => {
        constrainVideoPlayback();
        const pct = (video.currentTime / state.duration) * 100;
        elements.playbackSlider.value = pct;
        elements.timeCurrentLabel.textContent = formatTime(video.currentTime);
    };
    video.onplay = () => {
        elements.btnPlay.textContent = '⏸';
        cancelAnimationFrame(videoPlaybackRequest);
        monitorVideoPlayback();
    };
    video.onpause = () => {
        cancelAnimationFrame(videoPlaybackRequest);
        elements.btnPlay.textContent = '▶';
    };
    video.onended = () => {
        if (!video.ended || !(state.timeRange.end > state.timeRange.start)) return;
        video.currentTime = state.timeRange.start;
        video.play().catch(() => { elements.btnPlay.textContent = '▶'; });
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
    updateExtractionStatus();
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
    constrainVideoPlayback();
    updateExtractionStatus();
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

let videoPlaybackRequest = 0;

// 停止中のシークやフレーム抽出には干渉せず、再生だけを範囲内に制限する。
function constrainVideoPlayback() {
    const video = elements.videoPlayer;
    if (video.paused) return;
    const { start, end } = state.timeRange;
    if (video.currentTime >= end) {
        video.currentTime = start;
    } else if (video.currentTime < start) {
        video.currentTime = start;
    }
}

function monitorVideoPlayback() {
    constrainVideoPlayback();
    if (!elements.videoPlayer.paused) {
        videoPlaybackRequest = requestAnimationFrame(monitorVideoPlayback);
    }
}

function togglePlay() {
    const video = elements.videoPlayer;
    if (video.paused) {
        const { start, end } = state.timeRange;
        if (!(end > start)) return;
        if (video.currentTime < start || video.currentTime >= end) video.currentTime = start;
        video.play().catch(() => { elements.btnPlay.textContent = '▶'; });
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
        state.interval = Math.max(0.001, parseFloat(elements.intervalValue.value) || 1.0);
        elements.intervalValue.value = state.interval;
        updateFrameCountInfo();
    });

    elements.btnFrameInterval.addEventListener('click', () => {
        if (!state.sourceFps) return;
        state.interval = 1 / state.sourceFps;
        elements.intervalValue.value = state.interval.toFixed(6);
        updateFrameCountInfo();
    });
}

function updateSourceFrameInfo() {
    if (!state.sourceFrameCount || !state.duration) return;
    state.sourceFps = state.sourceFrameCount / state.duration;
    elements.sourceFrameInfo.textContent = `元動画: ${state.sourceFrameCount.toLocaleString()} フレーム / 平均 ${state.sourceFps.toFixed(3)} fps`;
    elements.btnFrameInterval.disabled = false;
}

// MP4の動画トラックにあるサンプル数（stsz）を読む。外部ライブラリは使用しない。
async function readMp4VideoFrameCount(file) {
    const view = new DataView(await file.arrayBuffer());
    const containers = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

    function readType(offset) {
        return String.fromCharCode(
            view.getUint8(offset), view.getUint8(offset + 1),
            view.getUint8(offset + 2), view.getUint8(offset + 3)
        );
    }

    function readBoxes(start, end) {
        const boxes = [];
        let offset = start;
        while (offset + 8 <= end) {
            let size = view.getUint32(offset);
            const type = readType(offset + 4);
            let headerSize = 8;
            if (size === 1) {
                const largeSize = view.getBigUint64(offset + 8);
                if (largeSize > BigInt(Number.MAX_SAFE_INTEGER)) break;
                size = Number(largeSize);
                headerSize = 16;
            } else if (size === 0) {
                size = end - offset;
            }
            if (size < headerSize || offset + size > end) break;
            const box = { type, start: offset, dataStart: offset + headerSize, end: offset + size, children: [] };
            if (containers.has(type)) box.children = readBoxes(box.dataStart, box.end);
            boxes.push(box);
            offset += size;
        }
        return boxes;
    }

    function find(boxes, type) {
        for (const box of boxes) {
            if (box.type === type) return box;
            const nested = find(box.children, type);
            if (nested) return nested;
        }
        return null;
    }

    const root = readBoxes(0, view.byteLength);
    const moov = root.find(box => box.type === 'moov');
    if (!moov) return null;

    for (const trak of moov.children.filter(box => box.type === 'trak')) {
        const handler = find(trak.children, 'hdlr');
        if (!handler || handler.dataStart + 12 > handler.end || readType(handler.dataStart + 8) !== 'vide') continue;
        const sampleSize = find(trak.children, 'stsz');
        if (sampleSize && sampleSize.dataStart + 12 <= sampleSize.end) {
            return view.getUint32(sampleSize.dataStart + 8);
        }
    }
    return null;
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
    updateExtractionStatus();
    const duration = state.timeRange.end - state.timeRange.start;
    // 動画の終了時刻には表示可能な新しいフレームがないため、終了点は含めない。
    const frameCount = Math.ceil(duration / state.interval);
    elements.frameCountInfo.textContent = `推定フレーム数: ${frameCount}`;
}

// ============================================
// フレーム抽出
// ============================================
function setupActions() {
    elements.btnPreview.addEventListener('click', () => {
        generatePreview().catch(error => window.alert(`フレームを抽出できませんでした: ${error.message}`));
    });
    elements.btnExport.addEventListener('click', exportImages);
    elements.exportImageFormat.addEventListener('change', updateWebpExportOptions);
    elements.webpMode.addEventListener('change', updateWebpExportOptions);
    elements.btnSelectAll.addEventListener('click', () => setAllFramesSelected(true));
    elements.btnSelectNone.addEventListener('click', () => setAllFramesSelected(false));
    elements.btnFlipbookPlay.addEventListener('click', toggleFlipbookPlayback);
    elements.btnFlipbookClose.addEventListener('click', closeFlipbook);
    elements.btnPreviewPrev.addEventListener('click', () => stepPreview(-1));
    elements.btnPreviewNext.addEventListener('click', () => stepPreview(1));
    elements.timelineSeek.addEventListener('input', () => selectPreviewFrame(Number(elements.timelineSeek.value)));
    document.querySelector('.preview-include-control').addEventListener('pointerdown', stopFlipbook);
    elements.previewFrameIncluded.addEventListener('keydown', event => {
        if (event.key === ' ') stopFlipbook();
    });
    elements.previewFrameIncluded.addEventListener('change', () => {
        stopFlipbook();
        const frame = getActivePreviewFrame();
        if (!frame) return;
        frame.selected = elements.previewFrameIncluded.checked;
        updateSelectionUI();
    });
    elements.btnExportGif.addEventListener('click', exportGif);
    elements.btnCancelGif.addEventListener('click', () => { state.gifCancelled = true; });
    elements.outputWidth.addEventListener('change', () => updateOutputDimension('width'));
    elements.outputHeight.addEventListener('change', () => updateOutputDimension('height'));
    [elements.outputWidth, elements.outputHeight].forEach(input => input.addEventListener('input', refreshOutput));
    elements.gifFps.addEventListener('change', syncGifFps);
    elements.gifColors.addEventListener('change', updateGifEstimate);
    [elements.outputSizeMode, elements.outputFit, elements.outputBackground, elements.outputTransparent].forEach(input => input.addEventListener('change', refreshOutput));
    elements.outputLockRatio.addEventListener('change', () => {
        state.outputAspectRatio = Number(elements.outputWidth.value) / Number(elements.outputHeight.value);
    });
    updateWebpExportOptions();
}

async function generatePreview() {
    if (!state.video) return;
    const initializeSize = state.previewFrames.length === 0 || state.sourceMode !== 'video';
    state.sourceMode = 'video';
    closeFlipbook();
    const frames = await extractFrames(true);
    state.extractionSignature = extractionSignature();
    updateExtractionStatus();
    if (initializeSize && frames.length > 0) initializeOutputSize(frames[0]);
    displayPreview(frames);
    elements.btnExport.disabled = frames.length === 0;
}

async function extractFrames(isPreview = false) {
    const video = elements.videoPlayer;
    video.pause();
    const { start, end } = state.timeRange;
    const { x, y, w, h } = state.crop;
    const interval = state.interval;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !(interval > 0)) {
        throw new Error('開始・終了時刻と抽出間隔を確認してください。');
    }

    const frames = [];
    const times = [];

    for (let t = start; t < end - 1e-9; t += interval) {
        times.push(t);
    }

    // プログレス表示
    elements.previewSection.classList.remove('hidden');
    showProgress('フレームを抽出中...', elements.btnPreview);
    elements.previewGallery.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    try {
        for (let i = 0; i < times.length; i++) {
            const t = times[i];

            // 進捗更新
            const progress = ((i + 1) / times.length) * 100;
            updateProgress(progress, `フレームを抽出中... ${i + 1} / ${times.length}`);

            // フレーム取得
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('動画の読み取りがタイムアウトしました。')), 15000);
                video.onseeked = () => { clearTimeout(timeout); resolve(); };
                video.currentTime = t;
            });

            // クロップして描画
            ctx.drawImage(video, x, y, w, h, 0, 0, w, h);

            const dataUrl = canvas.toDataURL('image/png');
            frames.push({
                id: `video-${i}`,
                sourceType: 'video',
                name: `frame_${String(i + 1).padStart(4, '0')}.png`,
                time: t,
                dataUrl,
                width: w,
                height: h,
                index: i + 1,
                selected: true
            });
        }

    } catch (error) {
        displayPreview(state.previewFrames);
        throw error;
    } finally {
        video.onseeked = null;
        hideProgress();
    }
    state.previewFrames = frames;

    return frames;
}

function displayPreview(frames) {
    updateSelectionUI();
    elements.previewGallery.innerHTML = '';

    frames.forEach((frame, position) => {
        const item = document.createElement('div');
        item.className = `preview-item${frame.selected ? '' : ' deselected'}`;
        item.dataset.frameIndex = frame.index;
        const image = document.createElement('img');
        image.src = frame.dataUrl;
        image.alt = frame.name || `Frame ${frame.index}`;
        const mark = document.createElement('input');
        mark.type = 'checkbox';
        mark.className = 'frame-checkbox';
        mark.checked = frame.selected !== false;
        mark.setAttribute('aria-label', `${frame.name}を書き出す`);
        mark.addEventListener('change', () => {
            stopFlipbook();
            frame.selected = mark.checked;
            item.classList.toggle('deselected', !frame.selected);
            updateSelectionUI();
        });
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
        image.addEventListener('click', () => selectPreviewFrame(position));
        image.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectPreviewFrame(position);
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                const next = Math.max(0, Math.min(frames.length - 1, position + (event.key === 'ArrowLeft' ? -1 : 1)));
                selectPreviewFrame(next);
                elements.previewGallery.children[next].querySelector('img').focus({ preventScroll: true });
            }
        });
        const tick = document.createElement('div');
        tick.className = 'frame-tick';
        tick.textContent = `${position + 1}`;
        tick.setAttribute('aria-hidden', 'true');
        const expand = document.createElement('button');
        expand.type = 'button';
        expand.className = 'frame-expand';
        expand.textContent = '拡大';
        expand.setAttribute('aria-label', `${frame.name}を拡大`);
        expand.addEventListener('click', () => showImageModal(frame));
        const label = document.createElement('div');
        label.className = 'frame-label';
        label.textContent = frame.sourceType === 'image'
            ? `#${frame.index} ${frame.name} (${frame.width}×${frame.height})`
            : `#${frame.index} (${formatTime(frame.time)})`;
        label.title = label.textContent;
        item.append(tick, image, mark, expand, label);
        const order = document.createElement('div');
        order.className = 'frame-order';
        [-1, 1].forEach(direction => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = direction < 0 ? '←' : '→';
            button.setAttribute('aria-label', `${frame.name}を${direction < 0 ? '前' : '後'}へ移動`);
            button.disabled = position + direction < 0 || position + direction >= frames.length;
            button.addEventListener('click', () => {
                stopFlipbook();
                const next = position + direction;
                [frames[position], frames[next]] = [frames[next], frames[position]];
                displayPreview(frames);
                elements.previewGallery.children[next].querySelector('img').focus();
            });
            order.appendChild(button);
        });
        item.appendChild(order);
        elements.previewGallery.appendChild(item);
    });

    // モーダル閉じるイベント設定
    setupModal();
    syncTimeline();
}

function getSelectedFrames() {
    return state.previewFrames.filter(frame => frame.selected !== false);
}

function updateSelectionUI() {
    const selectedCount = getSelectedFrames().length;
    const total = state.previewFrames.length;
    elements.previewCount.textContent = `(${selectedCount} / ${total} フレーム選択)`;
    elements.selectionCount.textContent = `${selectedCount} / ${total} フレーム選択`;
    elements.btnExport.disabled = selectedCount === 0;
    elements.btnFlipbookPlay.disabled = selectedCount === 0;
    elements.btnFlipbookClose.disabled = total === 0;
    elements.btnExportGif.disabled = selectedCount === 0;
    const framesByIndex = new Map(state.previewFrames.map(frame => [frame.index, frame]));
    elements.previewGallery.querySelectorAll('.preview-item').forEach(item => {
        const selected = framesByIndex.get(Number(item.dataset.frameIndex))?.selected !== false;
        item.classList.toggle('deselected', !selected);
        item.querySelector('.frame-checkbox').checked = selected;
    });
    refreshOutput();
}

function setAllFramesSelected(selected) {
    stopFlipbook();
    state.previewFrames.forEach(frame => { frame.selected = selected; });
    elements.previewGallery.querySelectorAll('.preview-item').forEach(item => {
        item.classList.toggle('deselected', !selected);
        item.querySelector('input').checked = selected;
    });
    updateSelectionUI();
}

let flipbookTimer = null;

// 表示中の画像は選択状態や並べ替えに関わらず同じオブジェクトを保持する。
function getActivePreviewFrame() {
    if (!state.previewFrames.includes(state.activePreviewFrame)) {
        state.activePreviewFrame = state.previewFrames[0] || null;
    }
    return state.activePreviewFrame;
}

function stepPreview(direction) {
    stopFlipbook();
    const frame = getActivePreviewFrame();
    if (!frame) return;
    const index = state.previewFrames.indexOf(frame);
    state.activePreviewFrame = state.previewFrames[Math.max(0, Math.min(state.previewFrames.length - 1, index + direction))];
    refreshOutput();
}

function selectPreviewFrame(index) {
    const frame = state.previewFrames[index];
    if (!frame) return;
    stopFlipbook();
    state.activePreviewFrame = frame;
    refreshOutput();
}

function syncTimeline() {
    const frame = getActivePreviewFrame();
    const index = state.previewFrames.indexOf(frame);
    elements.timelineSeek.max = Math.max(0, state.previewFrames.length - 1);
    elements.timelineSeek.value = Math.max(0, index);
    elements.timelineSeek.disabled = state.previewFrames.length < 2;
    const positionText = `${index + 1} / ${state.previewFrames.length} コマ`;
    elements.timelineSeek.setAttribute('aria-valuetext', positionText);
    elements.timelinePositionLabel.textContent = positionText;
    const gallery = elements.previewGallery;
    const previous = gallery.querySelector('.is-current');
    const current = gallery.children[index];
    if (previous === current) return;
    if (previous) {
        previous.classList.remove('is-current');
        previous.querySelector('img').removeAttribute('aria-current');
    }
    if (!current) return;
    current.classList.add('is-current');
    current.querySelector('img').setAttribute('aria-current', 'true');
    // ページ全体は動かさず、横方向だけ再生位置に追従させる。
    const bounds = gallery.getBoundingClientRect();
    const itemBounds = current.getBoundingClientRect();
    if (itemBounds.left < bounds.left) gallery.scrollLeft -= bounds.left - itemBounds.left + 8;
    else if (itemBounds.right > bounds.right) gallery.scrollLeft += itemBounds.right - bounds.right + 8;
}

function openFlipbook() {
    const selected = getSelectedFrames();
    if (!selected.length) return;
    if (!selected.includes(getActivePreviewFrame())) state.activePreviewFrame = selected[0];
    elements.flipbookPlayer.classList.remove('hidden');
    elements.outputPreview.classList.add('hidden');
    refreshOutput();
    startFlipbook();
}

function startFlipbook() {
    stopFlipbook();
    const count = getSelectedFrames().length;
    if (!count) return;
    const fps = clampNumber(elements.gifFps.value, 1, 50, 6);
    elements.gifFps.value = fps;
    elements.btnFlipbookPlay.textContent = '一時停止';
    const repeat = Number(elements.gifRepeat.value);
    let remaining = repeat === 0 ? Infinity : count * (repeat === -1 ? 1 : repeat + 1);
    flipbookTimer = setInterval(() => {
        if (--remaining <= 0) return stopFlipbook();
        const frames = getSelectedFrames();
        if (!frames.length) return stopFlipbook();
        const index = frames.indexOf(state.activePreviewFrame);
        state.activePreviewFrame = frames[(index + 1) % frames.length];
        renderActivePreview();
    }, gifFrameDelay(fps));
}

function stopFlipbook() {
    if (flipbookTimer !== null) clearInterval(flipbookTimer);
    flipbookTimer = null;
    if (elements.btnFlipbookPlay) elements.btnFlipbookPlay.textContent = '再生';
}

function toggleFlipbookPlayback() {
    if (flipbookTimer === null) openFlipbook();
    else stopFlipbook();
}

function restartFlipbookIfPlaying() {
    if (flipbookTimer !== null) startFlipbook();
}

function closeFlipbook() {
    stopFlipbook();
    state.activePreviewFrame = state.previewFrames[0] || null;
    elements.flipbookPlayer.classList.add('hidden');
    elements.outputPreview.classList.remove('hidden');
    refreshOutput();
}

function renderActivePreview() {
    const frame = getActivePreviewFrame();
    const index = state.previewFrames.indexOf(frame);
    syncTimeline();
    elements.btnPreviewPrev.disabled = index <= 0;
    elements.btnPreviewNext.disabled = index < 0 || index >= state.previewFrames.length - 1;
    elements.previewFrameIncluded.disabled = !frame;
    elements.previewFrameIncluded.checked = !!frame && frame.selected !== false;
    elements.flipbookInfo.textContent = frame ? `${index + 1} / ${state.previewFrames.length} コマ` : '';
    if (frame) {
        const size = getOutputSize(frame);
        elements.outputPreviewInfo.textContent = `${frame.name} → ${size.width} × ${size.height}px${frame.selected === false ? '（除外中）' : ''}`;
        const target = elements.flipbookPlayer.classList.contains('hidden') ? elements.outputPreview : elements.flipbookImage;
        renderFramePreview(frame, target);
    } else {
        elements.outputPreview.previewRequest = (elements.outputPreview.previewRequest || 0) + 1;
        elements.outputPreview.getContext('2d').clearRect(0, 0, elements.outputPreview.width, elements.outputPreview.height);
        elements.outputPreviewInfo.textContent = '画像を読み込んでください';
        elements.flipbookImage.previewRequest = (elements.flipbookImage.previewRequest || 0) + 1;
        elements.flipbookImage.removeAttribute('src');
    }
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
    currentModalIndex = state.previewFrames.indexOf(frame);

    updateModalContent();
    imageModal.classList.remove('hidden');
}

function updateModalContent() {
    const { modalImage, modalInfo } = elements;
    const frame = state.previewFrames[currentModalIndex];

    if (!frame) return;

    renderFramePreview(frame, modalImage);
    const size = getOutputSize(frame);
    const sourceInfo = frame.sourceType === 'image'
        ? `${frame.relativePath || frame.name}`
        : `時間: ${formatTime(frame.time)}`;
    modalInfo.textContent = `#${frame.index} / ${state.previewFrames.length} | ${sourceInfo} | 出力: ${size.width} × ${size.height}px | ← → でナビゲート`;
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
// アニメーションGIF書き出し
// ============================================
const gifEncoderModuleUrl = 'https://cdn.jsdelivr.net/npm/gifenc@1.0.3/dist/gifenc.esm.js';

function initializeOutputSize(frame) {
    if (!frame?.width || !frame?.height) return;
    const scale = Math.min(1, 4096 / frame.width, 4096 / frame.height);
    const width = Math.max(1, Math.round(frame.width * scale));
    const height = Math.max(1, Math.round(frame.height * scale));
    state.outputAspectRatio = width / height;
    elements.outputWidth.value = width;
    elements.outputHeight.value = height;
    refreshOutput();
}

function updateOutputDimension(changed) {
    let width = clampNumber(elements.outputWidth.value, 1, 4096, 480);
    let height = clampNumber(elements.outputHeight.value, 1, 4096, 320);
    if (elements.outputLockRatio.checked && state.outputAspectRatio > 0) {
        if (changed === 'width') height = Math.max(1, Math.round(width / state.outputAspectRatio));
        else width = Math.max(1, Math.round(height * state.outputAspectRatio));
    }
    const scale = Math.min(1, 4096 / width, 4096 / height);
    elements.outputWidth.value = Math.max(1, Math.round(width * scale));
    elements.outputHeight.value = Math.max(1, Math.round(height * scale));
    refreshOutput();
}

function syncGifFps() {
    const fps = clampNumber(elements.gifFps.value, 1, 50, 6);
    elements.gifFps.value = fps;
    document.getElementById('playback-speed-label').textContent = `${fps} fps`;
    restartFlipbookIfPlaying();
    updateGifEstimate();
}

function updateGifEstimate() {
    if (!elements.gifEstimate) return;
    const count = getSelectedFrames().length;
    const rawBytes = getSelectedFrames().reduce((sum, frame) => {
        const size = getOutputSize(frame);
        return sum + size.width * size.height * 4;
    }, 0);
    elements.gifEstimate.textContent = count > 0
        ? `${count}フレーム / 処理量 約${formatBytes(rawBytes)}`
        : '画像を選択してください';
}

async function exportGif() {
    const frames = getSelectedFrames();
    if (frames.length === 0) return;

    const width = clampNumber(elements.outputWidth.value, 1, 4096, 480);
    const height = clampNumber(elements.outputHeight.value, 1, 4096, 320);
    const fps = clampNumber(elements.gifFps.value, 1, 50, 6);
    const colors = clampNumber(elements.gifColors.value, 2, 256, 256);
    const repeat = Number(elements.gifRepeat.value);
    const delay = gifFrameDelay(fps);
    const rawBytes = width * height * 4 * frames.length;

    elements.outputWidth.value = width;
    elements.outputHeight.value = height;
    elements.gifFps.value = fps;
    elements.gifColors.value = colors;
    if (rawBytes > 512 * 1024 * 1024 && !window.confirm(
        `処理量が約${formatBytes(rawBytes)}あります。ブラウザーの動作が重くなる可能性があります。続行しますか？`
    )) return;

    state.gifCancelled = false;
    showProgress('GIFエンコーダーを準備中...', elements.btnExportGif);
    elements.btnCancelGif.classList.remove('hidden');
    elements.gifResult.classList.add('hidden');
    elements.gifResult.classList.remove('error');

    try {
        const { GIFEncoder, quantize, applyPalette } = await import(gifEncoderModuleUrl);
        if (state.gifCancelled) throw new DOMException('キャンセルされました', 'AbortError');

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        const gif = GIFEncoder();

        for (let i = 0; i < frames.length; i++) {
            if (state.gifCancelled) throw new DOMException('キャンセルされました', 'AbortError');
            const image = await loadImageElement(frames[i].dataUrl);
            drawOutputFrame(context, image, width, height);
            const imageData = context.getImageData(0, 0, width, height);
            if (elements.gifDither.checked) applyOrderedDither(imageData.data, width, height);
            const palette = quantize(imageData.data, colors, { format: 'rgb565' });
            const indexed = applyPalette(imageData.data, palette, 'rgb565');
            const options = { palette, delay, dispose: 1 };
            if (i === 0) options.repeat = repeat;
            gif.writeFrame(indexed, width, height, options);

            const progress = ((i + 1) / frames.length) * 100;
            updateProgress(progress, `GIFを生成中... ${i + 1} / ${frames.length}`);
            await nextPaint();
        }

        gif.finish();
        const blob = new Blob([gif.bytes()], { type: 'image/gif' });
        downloadBlob(blob, `animation_${Date.now()}.gif`);
        showGifResult(`${width}×${height}px・${frames.length}フレーム・${colors}色・${formatBytes(blob.size)} を出力しました`);
    } catch (error) {
        if (error.name === 'AbortError') showGifResult('GIF生成をキャンセルしました', true);
        else {
            console.error(error);
            showGifResult('GIFを生成できませんでした。通信状態または画像サイズを確認してください。', true);
        }
    } finally {
        hideProgress();
        elements.btnCancelGif.classList.add('hidden');
        elements.btnExportGif.disabled = getSelectedFrames().length === 0;
    }
}

function drawOutputFrame(context, image, width, height) {
    context.save();
    context.clearRect(0, 0, width, height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    if (!elements.outputTransparent.checked || elements.exportImageFormat.value === 'gif') {
        context.fillStyle = elements.outputBackground.value;
        context.fillRect(0, 0, width, height);
    }
    const fit = elements.outputFit.value;
    if (fit === 'stretch') {
        context.drawImage(image, 0, 0, width, height);
    } else {
        const scale = fit === 'cover'
            ? Math.max(width / image.naturalWidth, height / image.naturalHeight)
            : Math.min(width / image.naturalWidth, height / image.naturalHeight);
        const drawWidth = image.naturalWidth * scale;
        const drawHeight = image.naturalHeight * scale;
        context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
    }
    context.restore();
}

function applyOrderedDither(data, width, height) {
    const matrix = [
        0, 8, 2, 10,
        12, 4, 14, 6,
        3, 11, 1, 9,
        15, 7, 13, 5
    ];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const offset = (y * width + x) * 4;
            const adjustment = (matrix[(y & 3) * 4 + (x & 3)] - 7.5) * 2;
            data[offset] = Math.max(0, Math.min(255, data[offset] + adjustment));
            data[offset + 1] = Math.max(0, Math.min(255, data[offset + 1] + adjustment));
            data[offset + 2] = Math.max(0, Math.min(255, data[offset + 2] + adjustment));
        }
    }
}

function loadImageElement(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showGifResult(message, isError = false) {
    elements.gifResult.textContent = message;
    elements.gifResult.classList.remove('hidden');
    elements.gifResult.classList.toggle('error', isError);
}

function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================
// 選択画像の書き出し
// ============================================
let webpWorker = null;
let webpRequestId = 0;
const webpRequests = new Map();

function updateWebpExportOptions() {
    const isWebp = elements.exportImageFormat.value === 'webp';
    const isGif = elements.exportImageFormat.value === 'gif';
    document.getElementById('gif-export-panel').classList.toggle('hidden', !isGif);
    elements.btnExport.classList.toggle('hidden', isGif);
    elements.btnExport.textContent = `${isWebp ? 'WebP' : 'PNG'}を保存（ZIP）`;
    refreshOutput();
    const isLossless = elements.webpMode.value === 'lossless';
    elements.webpExportOptions.classList.toggle('hidden', !isWebp);
    elements.webpQualityLabel.textContent = isLossless ? '圧縮率' : 'Quality';
    elements.webpOptionHint.textContent = isLossless
        ? 'Losslessでは画質は変化せず、圧縮率を上げるほど処理時間が長くなります。Effortは0（高速）～6（高圧縮）です。'
        : 'Qualityは画質、Effortは0（高速）～6（高圧縮）です。';
}

function getWebpWorker() {
    if (webpWorker) return webpWorker;
    webpWorker = new Worker('webp-worker.js', { type: 'module' });
    webpWorker.addEventListener('message', event => {
        const request = webpRequests.get(event.data.id);
        if (!request) return;
        webpRequests.delete(event.data.id);
        if (event.data.error) request.reject(new Error(event.data.error));
        else request.resolve(event.data.buffer);
    });
    webpWorker.addEventListener('error', event => {
        const error = event.error || new Error(event.message || 'WebPエンコーダーを起動できませんでした');
        webpRequests.forEach(request => request.reject(error));
        webpRequests.clear();
        webpWorker?.terminate();
        webpWorker = null;
    });
    return webpWorker;
}

function encodeWebpInWorker(imageData, options) {
    return new Promise((resolve, reject) => {
        const id = ++webpRequestId;
        webpRequests.set(id, { resolve, reject });
        try {
            getWebpWorker().postMessage({
                id,
                width: imageData.width,
                height: imageData.height,
                rgbaBuffer: imageData.data.buffer,
                options
            }, [imageData.data.buffer]);
        } catch (error) {
            webpRequests.delete(id);
            reject(error);
        }
    });
}

function stopWebpWorker() {
    if (webpWorker) {
        webpWorker.terminate();
        webpWorker = null;
    }
}

async function exportImages() {
    if (state.previewFrames.length === 0) {
        await generatePreview();
    }

    const exportFrames = getSelectedFrames();
    if (exportFrames.length === 0) return;

    const format = elements.exportImageFormat.value;
    const formatLabel = format.toUpperCase();
    showProgress(`${formatLabel}を準備中...`, elements.btnExport);

    try {
        const zip = new JSZip();

        for (let i = 0; i < exportFrames.length; i++) {
            const frame = exportFrames[i];
            updateProgress((i / exportFrames.length) * 80, `${formatLabel}を変換中... ${i + 1} / ${exportFrames.length}`);
            const exported = await prepareExportImage(frame, format, i);
            zip.file(exported.filename, exported.data, exported.options);

            const progress = ((i + 1) / exportFrames.length) * 80;
            updateProgress(progress, `${formatLabel}を準備中... ${i + 1} / ${exportFrames.length}`);
            if (i % 5 === 0) await nextPaint();
        }

        updateProgress(80, 'ZIPを生成中...');
        const content = await zip.generateAsync({ type: 'blob' }, metadata => {
            updateProgress(80 + metadata.percent * 0.2, `ZIPを生成中... ${Math.round(metadata.percent)}%`);
        });
        updateProgress(100, 'ダウンロードを開始します...');
        downloadBlob(content, `frames_${Date.now()}.zip`);
    } catch (error) {
        console.error(error);
        window.alert(`画像を書き出せませんでした: ${error.message}`);
    } finally {
        hideProgress();
        elements.btnExport.disabled = getSelectedFrames().length === 0;
    }
}

async function prepareExportImage(frame, format, outputIndex) {
    const prefix = String(outputIndex + 1).padStart(4, '0');
    const blob = await convertFrameImage(frame, format);
    const baseName = (frame.name || `frame_${String(frame.index).padStart(4, '0')}`)
        .replace(/\.[^.]+$/, '');
    return {
        filename: `${prefix}_${baseName}.${format}`,
        data: blob
    };
}

async function convertFrameImage(frame, format) {
    const image = await loadImageElement(frame.dataUrl);
    const canvas = document.createElement('canvas');
    const size = getOutputSize(frame);
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext('2d');
    drawOutputFrame(context, image, canvas.width, canvas.height);
    if (format === 'webp') {
        const lossless = elements.webpMode.value === 'lossless';
        const options = {
            lossless: lossless ? 1 : 0,
            quality: clampNumber(elements.webpQuality.value, 0, 100, 90),
            method: clampNumber(elements.webpEffort.value, 0, 6, 4),
            alpha_quality: 100,
            exact: lossless ? 1 : 0
        };
        elements.webpQuality.value = options.quality;
        elements.webpEffort.value = options.method;
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const buffer = await encodeWebpInWorker(imageData, options);
        return new Blob([buffer], { type: 'image/webp' });
    }

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob || blob.type !== 'image/png') throw new Error('PNGへの変換に対応していません');
    return blob;
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

// 共通の描画をプレビューとすべての出力形式で使用する。
function getOutputSize(frame) {
    const fixed = elements.outputSizeMode.value === 'fixed' || elements.exportImageFormat.value === 'gif';
    return fixed
        ? { width: clampNumber(elements.outputWidth.value, 1, 4096, 480), height: clampNumber(elements.outputHeight.value, 1, 4096, 320) }
        : { width: frame.width, height: frame.height };
}

function gifFrameDelay(fps) {
    // GIFの時間単位は10ms。再生確認も保存時の間隔に合わせる。
    return Math.max(20, Math.round(100 / fps) * 10);
}

async function renderFramePreview(frame, target) {
    const request = (target.previewRequest || 0) + 1;
    target.previewRequest = request;
    try {
        const image = await loadImageElement(frame.dataUrl);
        if (request !== target.previewRequest) return;
        const size = getOutputSize(frame);
        const canvas = target.tagName === 'CANVAS' ? target : document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        drawOutputFrame(canvas.getContext('2d'), image, size.width, size.height);
        if (target !== canvas) target.src = canvas.toDataURL('image/png');
    } catch (error) {
        if (request === target.previewRequest) elements.outputPreviewInfo.textContent = 'プレビューを表示できませんでした。画像を読み込み直してください。';
    }
}

function refreshOutput() {
    const isGif = elements.exportImageFormat.value === 'gif';
    const fixed = isGif || elements.outputSizeMode.value === 'fixed';
    elements.outputSizeMode.disabled = isGif;
    [elements.outputWidth, elements.outputHeight, elements.outputLockRatio, elements.outputFit].forEach(input => { input.disabled = !fixed; });
    elements.outputTransparent.disabled = isGif;
    elements.outputBackground.disabled = !isGif && elements.outputTransparent.checked;
    document.getElementById('output-size-hint').textContent = isGif
        ? 'GIFは全フレームを指定サイズに統一します。初期サイズは先頭画像を基準にしています。'
        : fixed ? '全画像を指定サイズに統一します。収め方で余白や切り抜きを選べます。' : '各画像のピクセル数を維持します。サイズ変更には「共通サイズを指定」を選んでください。';
    renderActivePreview();
    if (!elements.imageModal.classList.contains('hidden')) updateModalContent();
    updateGifEstimate();
}

function extractionSignature() {
    return JSON.stringify([state.crop, state.timeRange, state.interval]);
}

function updateExtractionStatus() {
    const stale = state.sourceMode === 'video' && state.previewFrames.length > 0 && state.extractionSignature !== extractionSignature();
    document.getElementById('extraction-status').textContent = stale
        ? '動画の抽出設定が変更されています。現在の一覧は抽出時のままです。「フレームを抽出」で一覧を作り直せます（選択・並び順はリセットされます）。' : '';
}
