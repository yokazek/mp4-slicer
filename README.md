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
- **Batch Export**: 
  - Preview frames before exporting.
  - Download all extracted frames as a single ZIP file.
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

## 🛠️ Built With

- **HTML5 / CSS3**: Vanilla implementation for maximum performance.
- **JavaScript (ES6+)**: Core logic and canvas-based frame extraction.
- **[JSZip](https://stuk.github.io/jszip/)**: For client-side ZIP generation.
- **[Lucide Icons](https://lucide.dev/)**: For a clean, modern icon set.
- **Google Fonts**: `Inter` for clear readability.

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
