import { useState, useEffect } from 'react'
import imageCompression from 'browser-image-compression'
import JSZip from 'jszip'
import { Upload, Download, FileImage, Settings, X, RefreshCw, Github, Languages, Trash2 } from 'lucide-react'
import './App.css'
import { translations } from './translations'

function App() {
  const [files, setFiles] = useState([])
  const [isCompressing, setIsCompressing] = useState(false)
  const [lang, setLang] = useState('zh') // Default to Chinese as requested
  const [targetSize, setTargetSize] = useState('original') // original, 1inch, 2inch, custom
  const [options, setOptions] = useState({
    maxSizeMB: 5, // Increased default to 5MB to preserve quality
    maxWidthOrHeight: 2560, // Increased default resolution
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.9 // High default quality
  })

  const t = translations[lang]

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en')
  }

  useEffect(() => {
    const handlePaste = (event) => {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;
      const newFiles = [];

      for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
          const blob = item.getAsFile();
          // Give it a name if it doesn't have a proper one (often "image.png" from clipboard)
          const fileName = blob.name === 'image.png'
            ? `pasted_image_${new Date().getTime()}.png`
            : blob.name;

          // Create a new File object to ensure name is correct if we changed it
          const file = new File([blob], fileName, { type: blob.type });

          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            original: file,
            compressed: null,
            status: 'pending',
            progress: 0
          });
        }
      }

      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  const handleFileSelect = (event) => {
    if (!event.target.files || event.target.files.length === 0) return;

    const newFiles = Array.from(event.target.files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      original: file,
      compressed: null,
      status: 'pending', // pending, compressing, done, error
      progress: 0
    }))
    setFiles(prev => [...prev, ...newFiles])
    // Reset input value to allow selecting the same file again if needed
    event.target.value = ''
  }

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const clearAll = () => {
    setFiles([])
  }

  // Helper to crop and resize image to exact dimensions
  const resizeImage = (file, width, height) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Calculate aspect ratios
        const sourceRatio = img.width / img.height;
        const targetRatio = width / height;

        let sx, sy, sWidth, sHeight;

        if (sourceRatio > targetRatio) {
          // Source is wider than target: crop width
          sHeight = img.height;
          sWidth = sHeight * targetRatio;
          sx = (img.width - sWidth) / 2;
          sy = 0;
        } else {
          // Source is taller than target: crop height
          sWidth = img.width;
          sHeight = sWidth / targetRatio;
          sx = 0;
          sy = (img.height - sHeight) / 2;
        }

        // Draw cropped image to canvas
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: file.type }));
          } else {
            reject(new Error('Canvas to Blob failed'));
          }
        }, file.type, 1.0); // Use max quality for intermediate step
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const compressImage = async (fileObj) => {
    try {
      let fileToCompress = fileObj.original;

      // Handle ID Photo Resizing
      if (targetSize === '1inch') {
        fileToCompress = await resizeImage(fileToCompress, 295, 413);
      } else if (targetSize === '2inch') {
        fileToCompress = await resizeImage(fileToCompress, 413, 579);
      }

      // Dynamic configuration based on file size to preserve clarity
      // If the file is smaller than maxSizeMB, we prioritize quality over size reduction
      let currentOptions = {
        ...options,
        onProgress: (p) => {
          setFiles(prev => prev.map(f =>
            f.id === fileObj.id ? { ...f, progress: p } : f
          ))
        }
      }

      // If we resized for ID photo, we don't want browser-image-compression to resize again
      // unless the user specifically set a custom max width/height that is smaller (which is unlikely for ID photos)
      if (targetSize !== 'original' && targetSize !== 'custom') {
        delete currentOptions.maxWidthOrHeight;
      }

      // If user wants high quality (>= 0.9) and file is already smaller than max size,
      // we ensure we don't aggressively downsample
      if (fileToCompress.size / 1024 / 1024 < options.maxSizeMB && targetSize === 'original') {
        // Keep dimensions if possible
        // browser-image-compression might resize if maxWidthOrHeight is set.
        // We trust the user's setting, but if they haven't touched it (default),
        // we might want to be careful. For now, we respect the UI settings.
      }

      const compressedFile = await imageCompression(fileToCompress, currentOptions)

      return {
        ...fileObj,
        compressed: compressedFile,
        status: 'done',
        progress: 100
      }
    } catch (error) {
      console.error(error)
      return {
        ...fileObj,
        status: 'error',
        error: error.message
      }
    }
  }

  const handleCompressAll = async () => {
    setIsCompressing(true)

    const newFiles = [...files]
    // Process sequentially to avoid freezing UI on low-end devices,
    // though browser-image-compression uses web workers.
    // Parallel execution is faster.

    const promises = newFiles.map(async (file, index) => {
      if (file.status !== 'done') {
        setFiles(prev => prev.map(f => f.id === file.id ? { ...f, status: 'compressing' } : f))
        const result = await compressImage(file)
        setFiles(prev => prev.map(f => f.id === file.id ? result : f))
      }
    })

    await Promise.all(promises)
    setIsCompressing(false)
  }

  const handleDownloadAll = async () => {
    const compressedFiles = files.filter(f => f.status === 'done' && f.compressed)

    if (compressedFiles.length === 0) return

    if (compressedFiles.length === 1) {
      const file = compressedFiles[0].compressed
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      // Preserve original extension if possible or use selected format
      const ext = options.fileType.split('/')[1]
      const originalName = compressedFiles[0].original.name.substring(0, compressedFiles[0].original.name.lastIndexOf('.'))
      a.download = `${originalName}_compressed.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    const zip = new JSZip()
    compressedFiles.forEach(f => {
      const ext = options.fileType.split('/')[1]
      const originalName = f.original.name.substring(0, f.original.name.lastIndexOf('.'))
      zip.file(`${originalName}_compressed.${ext}`, f.compressed)
    })

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'compressed_images.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container">
      <header className="header">
        <div className="top-controls">
          <button onClick={toggleLanguage} className="lang-btn" title="Switch Language">
            <Languages size={20} />
            <span>{lang === 'en' ? '中文' : 'English'}</span>
          </button>
          <a href="https://github.com/coutureone/Photo_zipTools" target="_blank" rel="noreferrer" className="github-link" aria-label={t.github_aria}>
            <Github size={24} />
          </a>
        </div>
        <h1 className="title">{t.title}</h1>
        <p className="subtitle">{t.subtitle}</p>
      </header>

      <main>
        <div className="card upload-area">
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
          />
          <label htmlFor="file-upload" className="upload-label">
            <Upload size={48} className="upload-icon" />
            <span>{t.upload_drag}</span>
            <span className="upload-hint">{t.upload_hint}</span>
          </label>
        </div>

        {files.length > 0 && (
          <div className="controls card">
            <div className="settings-header">
              <h3>{t.settings}</h3>
              {files.length > 0 && (
                <button className="text-btn" onClick={clearAll}>
                  {t.clear_all}
                </button>
              )}
            </div>
            <div className="settings">
              <div className="setting-group">
                <label>{t.id_photo_size}</label>
                <select
                  value={targetSize}
                  onChange={e => setTargetSize(e.target.value)}
                >
                  <option value="original">{t.size_original}</option>
                  <option value="1inch">{t.size_1inch}</option>
                  <option value="2inch">{t.size_2inch}</option>
                  <option value="custom">{t.size_custom}</option>
                </select>
              </div>

              {targetSize === 'custom' && (
                <div className="setting-group">
                  <label>{t.max_width_height}</label>
                  <input
                    type="number"
                    value={options.maxWidthOrHeight}
                    onChange={e => setOptions({ ...options, maxWidthOrHeight: parseInt(e.target.value) })}
                    step="100"
                  />
                </div>
              )}

              <div className="setting-group">
                <label>{t.quality} ({Math.round(options.initialQuality * 100)}%)</label>
                <div className="range-wrapper">
                  <span>{t.quality_low}</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={options.initialQuality}
                    onChange={e => setOptions({ ...options, initialQuality: parseFloat(e.target.value) })}
                  />
                  <span>{t.quality_high}</span>
                </div>
              </div>
              <div className="setting-group">
                <label>{t.max_size}</label>
                <input
                  type="number"
                  value={options.maxSizeMB}
                  onChange={e => setOptions({ ...options, maxSizeMB: parseFloat(e.target.value) })}
                  step="0.1"
                  min="0.1"
                />
              </div>
              <div className="setting-group">
                <label>{t.format}</label>
                <select
                  value={options.fileType}
                  onChange={e => setOptions({ ...options, fileType: e.target.value })}
                >
                  <option value="image/jpeg">JPEG</option>
                  <option value="image/png">PNG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
            </div>

            <div className="actions">
              <button
                onClick={handleCompressAll}
                disabled={isCompressing || files.every(f => f.status === 'done')}
                className="btn-primary"
              >
                {isCompressing ? <RefreshCw className="spin" /> : <Settings size={18} />}
                {isCompressing ? t.compressing : t.compress_all}
              </button>

              <button
                onClick={handleDownloadAll}
                disabled={!files.some(f => f.status === 'done')}
                className="btn-success"
              >
                <Download size={18} />
                {t.download_all}
              </button>
            </div>
          </div>
        )}

        <div className="file-list">
          {files.map(file => (
            <div key={file.id} className="file-item card">
              <div className="file-info">
                <div className="file-preview">
                  {file.original.type.startsWith('image/') ? (
                    <img src={URL.createObjectURL(file.original)} alt="preview" />
                  ) : (
                    <FileImage size={32} />
                  )}
                </div>
                <div className="file-details">
                  <div className="file-name">{file.original.name}</div>
                  <div className="file-meta">
                    {t.original}: {formatSize(file.original.size)}
                    {file.compressed && (
                      <>
                        {' → '}
                        <span className="compressed-size">{formatSize(file.compressed.size)}</span>
                        <span className="saving-badge">
                          {t.saved} {Math.round((1 - file.compressed.size / file.original.size) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="file-actions">
                {file.status === 'compressing' && (
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${file.progress}%` }}></div>
                  </div>
                )}
                {file.status === 'done' && (
                  <button
                    className="icon-btn"
                    onClick={() => {
                      const url = URL.createObjectURL(file.compressed)
                      const a = document.createElement('a')
                      a.href = url
                      const ext = options.fileType.split('/')[1]
                      const originalName = file.original.name.substring(0, file.original.name.lastIndexOf('.'))
                      a.download = `${originalName}_compressed.${ext}`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    title={t.download}
                  >
                    <Download size={20} />
                  </button>
                )}
                <button className="icon-btn delete" onClick={() => removeFile(file.id)} title={t.remove}>
                  <X size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
