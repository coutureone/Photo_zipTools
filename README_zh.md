# Photo Zip - 智能图片压缩工具

[English Documentation](./README.md)

**Photo Zip** 是一款基于 React 和 Vite 构建的现代化、安全且快速的本地图片压缩工具。所有图片处理均在浏览器端完成，无需上传到服务器，确保存储隐私安全。

### ✨ 主要功能

*   **🔒 100% 本地处理**: 所有压缩过程都在浏览器中进行，您的照片永远不会离开您的设备。
*   **📋 剪贴板支持**: 支持直接粘贴截图或复制的图片 (Ctrl+V / Cmd+V)。
*   **🚀 批量处理**: 支持一次性上传并压缩多张图片。
*   **🎛️ 高级控制**:
    *   调节 **图片质量** (从低到高)
    *   设置 **最大体积** (例如：限制在 2MB 以内)
    *   调整尺寸 (最大宽度/高度)
    *   **证件照预设**: 支持 1寸 (295x413)、2寸 (413x579) 智能裁剪。
    *   格式转换 (JPG, PNG, WebP)
*   **📦 一键下载**: 支持单独下载或打包成 ZIP 下载所有图片。
*   **🌍 双语界面**: 支持中英文一键切换。
*   **🌙 深色模式**: 适配系统主题的精美界面。

### 🛠️ 技术栈

*   **React 19**
*   **Vite**
*   **browser-image-compression**: 用于高效的本地压缩。
*   **JSZip**: 用于文件打包。
*   **Lucide React**: 提供精美的图标。

### 🚀 快速开始

1.  **克隆项目**
    ```bash
    git clone https://github.com/coutureone/Photo_zipTools.git
    cd Photo_zipTools
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **本地运行**
    ```bash
    npm run dev
    ```
