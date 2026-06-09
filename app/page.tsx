'use client'

import { useState, useRef, useCallback } from 'react'
import styles from './page.module.css'

type Status = 'idle' | 'uploading' | 'processing' | 'done' | 'error'

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [renovatedImage, setRenovatedImage] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string>('')
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<File | null>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files allowed (JPG, PNG, WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB.')
      return
    }
    fileRef.current = file
    const reader = new FileReader()
    reader.onload = (e) => setOriginalImage(e.target?.result as string)
    reader.readAsDataURL(file)
    setRenovatedImage(null)
    setStatus('idle')
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleRenovate = async () => {
    if (!fileRef.current) return
    setStatus('processing')
    setError('')

    const formData = new FormData()
    formData.append('image', fileRef.current)

    try {
      let attempts = 0
      const maxAttempts = 3

      while (attempts < maxAttempts) {
        const res = await fetch('/api/renovate', { method: 'POST', body: formData })
        const data = await res.json()

        if (data.retry) {
          attempts++
          await new Promise(r => setTimeout(r, 30000)) // wait 30s for model load
          continue
        }

        if (!res.ok || !data.success) {
          setError(data.error || 'Renovation failed')
          setStatus('error')
          return
        }

        setRenovatedImage(data.image)
        setStatus('done')
        setSliderPos(50)
        return
      }

      setError('HuggingFace model still loading. Try again in 1 minute.')
      setStatus('error')
    } catch {
      setError('Network error. Check connection.')
      setStatus('error')
    }
  }

  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const pos = Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100)
    setSliderPos(pos)
  }, [])

  const handleDownload = () => {
    if (!renovatedImage) return
    const a = document.createElement('a')
    a.href = renovatedImage
    a.download = 'renovated-house.png'
    a.click()
  }

  const isProcessing = status === 'processing'

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>🏠</span>
          <span className={styles.logoText}>GharBadlo<span className={styles.logoAi}>AI</span></span>
        </div>
        <p className={styles.tagline}>Apna ghar ka renovation — AI se, free mein</p>
      </header>

      {/* Steps */}
      <div className={styles.steps}>
        {['Photo upload karo', 'AI renovate karta hai', 'Before/After dekho'].map((s, i) => (
          <div key={i} className={styles.step}>
            <span className={styles.stepNum}>{i + 1}</span>
            <span className={styles.stepText}>{s}</span>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      {!originalImage && (
        <div
          className={styles.dropzone}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.dropIcon}>📷</div>
          <p className={styles.dropTitle}>Ghar ki photo drop karo</p>
          <p className={styles.dropSub}>ya click karo — JPG, PNG, WEBP (max 10MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Image uploaded — show preview + button */}
      {originalImage && status !== 'done' && (
        <div className={styles.previewSection}>
          <img src={originalImage} alt="Original house" className={styles.previewImg} />
          <div className={styles.previewActions}>
            <button
              className={styles.btnRenovate}
              onClick={handleRenovate}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <><span className={styles.spinner} /> AI kaam kar raha hai...</>
              ) : (
                '✨ Renovate Karo'
              )}
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => { setOriginalImage(null); fileRef.current = null; setStatus('idle') }}
              disabled={isProcessing}
            >
              Doosri photo
            </button>
          </div>
          {isProcessing && (
            <div className={styles.processingNote}>
              ⏳ HuggingFace free model use ho raha hai — 30-60 seconds lagenge
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.errorBox}>
          ⚠️ {error}
        </div>
      )}

      {/* Before/After Slider */}
      {status === 'done' && originalImage && renovatedImage && (
        <div className={styles.resultSection}>
          <h2 className={styles.resultTitle}>Before vs After</h2>

          <div
            ref={sliderRef}
            className={styles.sliderContainer}
            onMouseMove={e => isDragging && handleSliderMove(e.clientX)}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onTouchMove={e => handleSliderMove(e.touches[0].clientX)}
          >
            {/* Original (full) */}
            <img src={originalImage} alt="Before" className={styles.sliderImg} />

            {/* Renovated (clipped) */}
            <div
              className={styles.sliderOverlay}
              style={{ width: `${sliderPos}%` }}
            >
              <img src={renovatedImage} alt="After" className={styles.sliderImg} />
            </div>

            {/* Divider */}
            <div className={styles.sliderDivider} style={{ left: `${sliderPos}%` }}>
              <div className={styles.sliderHandle}>⟺</div>
            </div>

            {/* Labels */}
            <span className={styles.labelBefore}>BEFORE</span>
            <span className={styles.labelAfter}>AFTER</span>
          </div>

          <div className={styles.resultActions}>
            <button className={styles.btnRenovate} onClick={handleDownload}>
              ⬇️ Download Karo
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => { setOriginalImage(null); setRenovatedImage(null); fileRef.current = null; setStatus('idle') }}
            >
              Naya Photo
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p>Free — Powered by HuggingFace AI • No login needed • Made in 🇮🇳 India</p>
      </footer>
    </main>
  )
}
