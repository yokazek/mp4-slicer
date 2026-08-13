# mp4 Slicer

A modern, browser-based tool to extract high-quality PNG frames from MP4 videos. Process everything locally in your browser—no server uploads required.

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
- **Image-to-GIF Workflow**: Import multiple images or a folder, select frames, preview the animation, and export a resized and color-reduced animated GIF.
- **Batch Export**: 
  - Preview frames before exporting.
  - Download selected frames as original files, PNG, or WebP in a single ZIP file.
  - Configure lossy/lossless mode, quality, and effort for WebP output.
  - WebP conversion runs in a Web Worker with a fixed progress display at the bottom of the viewport.
- **Modern UI**: 
  - Sleek glassmorphism design.
  - Dark and Light mode support.
  - Responsive layout.

## 🚀 Quick Start

1. Open `index.html` in any modern web browser.
2. Drag and drop an MP4 file into the upload area.
3. Adjust the crop area and time range.
4. Click **Generate Preview** to check the frames.
5. Click **Download PNGs (ZIP)** to save your results.

To create a GIF from images, drop image files or a folder onto the image area, select the desired frames, and configure the GIF settings.

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
