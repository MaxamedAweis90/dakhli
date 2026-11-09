import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Camera, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { uploadApi, type SessionStatusResponse } from '../api/uploadApi'

export const MobileUploadPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')

  const [, setSessionData] = useState<SessionStatusResponse | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Validate session on mount
  useEffect(() => {
    if (!sessionId) {
      setErrorMsg('No upload session detected. Please scan the QR code again.')
      setIsLoadingSession(false)
      return
    }

    uploadApi
      .getSession(sessionId)
      .then((data) => {
        if (data.status === 'EXPIRED') {
          setErrorMsg('This QR code session has expired. Please refresh the QR code on your computer.')
        } else if (data.status === 'COMPLETED') {
          setIsDone(true)
        }
        setSessionData(data)
      })
      .catch((err) => {
        console.error('[MobileUpload] Failed to load session:', err)
        setErrorMsg('Upload session not found or already expired.')
      })
      .finally(() => {
        setIsLoadingSession(false)
      })
  }, [sessionId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !sessionId) return
    setIsUploading(true)
    setErrorMsg(null)

    try {
      await uploadApi.uploadToSession(sessionId, selectedFile)
      setIsDone(true)
    } catch (err: any) {
      console.error('[MobileUpload] Upload error:', err)
      setErrorMsg(err?.response?.data?.error?.message || 'Failed to upload image. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0E12] text-white flex flex-col justify-between p-5 select-none font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#D4A359] to-[#F7B668] flex items-center justify-center text-[#121316] font-bold text-sm shadow-sm">
            D
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Dakhli Camera</h1>
            <p className="text-[11px] text-[#8E92A0]">Quick Photo Sync</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center py-8 max-w-sm mx-auto w-full">
        {isLoadingSession ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-7 h-7 text-[#D4A359] animate-spin" />
            <p className="text-xs text-[#8E92A0]">Connecting to your desktop...</p>
          </div>
        ) : errorMsg ? (
          <div className="w-full rounded-2xl bg-[#17181D] border border-rose-500/20 p-6 text-center shadow-lg">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
            <h2 className="text-base font-semibold text-white mb-1">Session Expired</h2>
            <p className="text-xs text-[#8E92A0] leading-relaxed mb-4">{errorMsg}</p>
            <p className="text-[11px] text-[#D4A359]">Scan a fresh QR code from your desktop screen.</p>
          </div>
        ) : isDone ? (
          <div className="w-full rounded-2xl bg-[#17181D] border border-emerald-500/20 p-7 text-center shadow-lg animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-[#4ADE80] mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-1.5">Photo Transferred!</h2>
            <p className="text-xs text-[#8E92A0] leading-relaxed mb-6">
              Your photo is now attached to the wishlist item on your desktop computer.
            </p>
            <div className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-[11px] text-[#8E92A0]">
              You can close this window now.
            </div>
          </div>
        ) : previewUrl ? (
          /* Preview State */
          <div className="w-full flex flex-col gap-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#17181D] border border-white/10 shadow-xl">
              <img
                src={previewUrl}
                alt="Captured Preview"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null)
                  setPreviewUrl(null)
                }}
                className="absolute top-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-xs font-medium text-white flex items-center gap-1.5 border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#D4A359] to-[#F7B668] text-[#121316] font-semibold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending to desktop...</span>
                  </>
                ) : (
                  <span>Send to Desktop Item</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploading}
                className="w-full h-10 rounded-xl bg-[#17181D] border border-white/[0.06] text-xs font-medium text-[#8E92A0] hover:text-white transition-colors"
              >
                Take another photo
              </button>
            </div>
          </div>
        ) : (
          /* Camera / Gallery Trigger State */
          <div className="w-full flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-lg font-semibold tracking-tight">Snap Wishlist Item</h2>
              <p className="text-xs text-[#8E92A0] mt-1">
                Take a photo or pick one from your mobile gallery. It will appear instantly on your desktop screen.
              </p>
            </div>

            {/* Hidden Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Big Action: Camera */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="w-full h-28 rounded-2xl bg-[#17181D] hover:bg-[#1E2028] border border-white/[0.08] flex flex-col items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer shadow-md group"
            >
              <div className="w-12 h-12 rounded-full bg-[#D4A359]/15 text-[#D4A359] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Camera className="w-6 h-6 stroke-[2]" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
                Take Photo with Camera
              </span>
            </button>

            {/* Secondary Action: Photo Library */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="w-full h-14 rounded-2xl bg-[#17181D] hover:bg-[#1E2028] border border-white/[0.06] flex items-center justify-center gap-2.5 active:scale-98 transition-all cursor-pointer text-xs font-medium text-[#C5C8D4]"
            >
              <ImageIcon className="w-4 h-4 text-[#8E92A0]" />
              <span>Choose from Photo Library</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-3 text-[11px] text-[#5F6370]">
        Dakhli Financial OS • Encrypted Session
      </footer>
    </div>
  )
}

export default MobileUploadPage
