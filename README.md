# mp4 Slicer

A browser tool for extracting image sequences from videos, batch processing images, and exporting PNG, WebP, or GIF. Start with a video or an existing image folder. Media processing stays in your browser.

Page: https://yokazek.github.io/mp4-slicer/

[日本語版はこちら (README.ja.md)](README.ja.md)

## ✨ Features

- **Privacy First**: All processing happens on the client side. Your videos never leave your computer.
- **Smart Cropping**: 
  - Freeform or aspect ratio presets (16:9, 4:3, 1:1, 9:16).
  - Drag-to-resize cropping area.
- **Precise Timing**: 
  - Select start and end points using visual range handles.
  - Manual timestamp input for millisecond precision.
- **Flexible Interval**: Set the extraction interval (e.g., every 0.5s or 1.0s).
- **Shared Image Editing**: Import images in natural order, select them with checkboxes, reorder them, and apply size, fit, and background settings across PNG, WebP, and GIF. Original images are retained for further edits. Preview processed stills or animations before compression and color reduction.
- **GIF Export**: Set playback speed, loops, colors, and dithering. GIF uses a common canvas size and a solid background; transparent output is available for PNG and WebP. GIF playback intervals are rounded to 10 ms.
- **Batch Export**: 
  - Preview frames before exporting.
  - Download selected frames as PNG or WebP in a single ZIP file, with filenames reflecting their order.
  - Configure lossy/lossless mode, quality, and effort for WebP output.
  - WebP conversion runs in a Web Worker with a fixed progress display at the bottom of the viewport.
- **Modern UI**: 
  - Sleek glassmorphism design.
  - Dark and Light mode support.
  - Responsive layout.

## 🚀 Quick Start

1. Open the hosted page, or run `python -m http.server 8765 --bind 127.0.0.1` in this directory and open `http://127.0.0.1:8765/`. HTTP is required for the WebP worker.
2. Drop a video, image sequence, or image folder into the shared import area. The file picker accepts both videos and images.
3. Adjust the crop area and time range. Video playback loops within the selected range, returning to its start at the end. Pausing within the range resumes from that position.
4. Extract frames, then select and reorder them.
5. Apply shared processing settings and inspect the output preview. Step backward/forward through all frames, or play only included frames. Uncheck the displayed frame to exclude it, and check it again to restore it; the gallery stays in sync. Stepping pauses playback. These controls sit below the preview; select-all and deselect-all sit directly above the frame list. The horizontal timeline highlights and follows the current frame during playback. Click a thumbnail or use the position slider to seek; use the expand button for a larger view.
6. Choose PNG, WebP, or GIF in the export panel and save.

Import existing images or a folder to go directly to editing. Changing extraction settings shows a notice while keeping the existing frames; extracting again resets the selection and order.

## Verification

Open `/tests/workflow.html` on the local server and run the checks. Generated images and a short video exercise PNG/WebP/GIF encoding, ZIP output, selection, ordering, and extraction notices. The existing CDN libraries require a network connection on first load.

## 🛠️ Built With

- **HTML5 / CSS3**: Vanilla implementation for maximum performance.
- **JavaScript (ES6+)**: Core logic and canvas-based frame extraction.
- **[JSZip](https://stuk.github.io/jszip/)**: For client-side ZIP generation.
- **[gifenc](https://github.com/mattdesl/gifenc)**: For client-side GIF encoding and color quantization.
- **[@jsquash/webp](https://github.com/jamsinclair/jSquash)**: For libwebp-based WebP encoding through WebAssembly.
- **[Lucide Icons](https://lucide.dev/)**: For a clean, modern icon set.
- **Google Fonts**: `Inter` for clear readability.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
