import React, { useState, useRef, useEffect } from 'react'
import {
  X,
  Camera,
  Upload,
  QrCode,
  Loader2,
  Trash2,
  Smartphone,
  RefreshCw,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import type { ItemTier } from '@/stores/itemsStore'
import type { CreateItemPayload } from '../types/item.types'
import { uploadApi } from '../api/uploadApi'

export interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (payload: CreateItemPayload) => Promise<any> | void
  isSubmitting?: boolean
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  isSubmitting = false,
}) => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [tier, setTier] = useState<ItemTier>('Wants')
  const [imageUrl, setImageUrl] = useState('')
  const [hasTarget, setHasTarget] = useState(false)
  const [targetProgress, setTargetProgress] = useState('15')

  // Upload & QR State
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isQrMode, setIsQrMode] = useState(false)
  const [qrSessionId, setQrSessionId] = useState<string | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const directInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Clear polling on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [])

  if (!isOpen) return null

  // Start polling when QR mode is active
  const startPolling = (sessionId: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const session = await uploadApi.getSession(sessionId)
        if (session.status === 'COMPLETED' && session.imageUrl) {
          setImageUrl(session.imageUrl)
          setIsQrMode(false)
          setQrSessionId(null)
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
        } else if (session.status === 'EXPIRED') {
          setUploadError('QR code session expired. Please refresh.')
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
            pollIntervalRef.current = null
          }
        }
      } catch (err) {
        console.error('[AddItemModal] Polling error:', err)
      }
    }, 2000)
  }

  const handleOpenQrMode = async () => {
    setIsCreatingSession(true)
    setUploadError(null)
    try {
      const session = await uploadApi.createSession()
      setQrSessionId(session.sessionId)
      setIsQrMode(true)
      startPolling(session.sessionId)
    } catch (err: any) {
      console.error('[AddItemModal] Failed to create upload session:', err)
      setUploadError('Failed to initialize QR session. Please try direct upload.')
    } finally {
      setIsCreatingSession(false)
    }
  }

  const handleCloseQrMode = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setIsQrMode(false)
    setQrSessionId(null)
  }

  const handleUploadFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    try {
      const res = await uploadApi.uploadDirect(file)
      setImageUrl(res.imageUrl)
    } catch (err: any) {
      console.error('[AddItemModal] Direct upload failed:', err)
      setUploadError(
        err?.response?.data?.error?.message ||
          'Failed to upload image. Please try again.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleDirectFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleUploadFile(file)
    }
    // reset input value so user can reselect the same file if needed
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      await handleUploadFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numPrice = parseFloat(price)
    if (!name.trim() || isNaN(numPrice) || numPrice <= 0) return

    await onAdd({
      title: name.trim(),
      name: name.trim(),
      targetPrice: numPrice,
      price: numPrice,
      imageUrl: imageUrl.trim() || undefined,
      tier,
      tag: hasTarget ? 'In Save Plan' : tier,
      targetProgress: hasTarget
        ? Math.min(100, Math.max(0, parseInt(targetProgress, 10) || 15))
        : undefined,
    })

    // Reset form
    setName('')
    setPrice('')
    setTier('Wants')
    setImageUrl('')
    setHasTarget(false)
    handleCloseQrMode()
    onClose()
  }

  const qrUrl = qrSessionId
    ? `${window.location.origin}/mobile-upload?session=${qrSessionId}`
    : ''

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-[1.25rem] bg-[#17181D] border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.6)] p-6 select-none flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b border-white/[0.05]">
          <div>
            <h3 className="text-[1.18rem] font-semibold text-white tracking-tight">
              Add Wishlist Item
            </h3>
            <p className="text-[0.78rem] text-[#8E92A0] mt-0.5">
              Register a target item to track into your 3-tier wishlist.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#20222B] text-[#8E92A0] hover:text-white flex items-center justify-center border border-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden inputs for direct and camera capture */}
        <input
          ref={directInputRef}
          type="file"
          accept="image/*"
          onChange={handleDirectFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleDirectFileSelect}
          className="hidden"
        />

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Item Name */}
          <div>
            <label className="block text-[0.8rem] font-medium text-[#C5C8D4] mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MacBook Pro M3"
              className="w-full h-[2.5rem] px-3.5 rounded-xl bg-[#20222B] border border-white/[0.06] text-white text-[0.875rem] placeholder:text-[#5F6370] outline-none focus:border-[#D4A359]/60 transition-colors"
            />
          </div>

          {/* Price & Tier Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Price */}
            <div>
              <label className="block text-[0.8rem] font-medium text-[#C5C8D4] mb-1.5">
                Estimated Price ($)
              </label>
              <div className="h-[2.5rem] px-3.5 rounded-xl bg-[#20222B] border border-white/[0.06] flex items-center gap-1 focus-within:border-[#D4A359]/60 transition-colors">
                <span className="text-[0.95rem] font-semibold text-[#8E92A0]">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="500"
                  className="w-full bg-transparent text-white text-[0.875rem] outline-none"
                />
              </div>
            </div>

            {/* Tier Selector */}
            <div>
              <label className="block text-[0.8rem] font-medium text-[#C5C8D4] mb-1.5">
                Tier
              </label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as ItemTier)}
                className="w-full h-[2.5rem] px-3 rounded-xl bg-[#20222B] border border-white/[0.06] text-white text-[0.85rem] outline-none focus:border-[#D4A359]/60 transition-colors cursor-pointer"
              >
                <option value="Essentials">Essentials</option>
                <option value="Future Needs">Future Needs</option>
                <option value="Wants">Wants</option>
              </select>
            </div>
          </div>

          {/* Photo Section (Replaced Photo Preset with Upload, Mobile Camera & QR Option) */}
          <div>
            <label className="block text-[0.8rem] font-medium text-[#C5C8D4] mb-1.5 flex items-center justify-between">
              <span>Item Photo</span>
              {imageUrl && (
                <span className="text-[0.72rem] text-[#4ADE80] font-normal">
                  Photo attached
                </span>
              )}
            </label>

            {/* Case A: Image is attached / uploaded */}
            {imageUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative w-full rounded-2xl bg-[#20222B] border p-3 flex items-center gap-4 transition-all ${
                  isDragging
                    ? 'border-[#D4A359] bg-[#D4A359]/10 ring-1 ring-[#D4A359]/30'
                    : 'border-white/[0.08]'
                }`}
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                  <img
                    src={imageUrl}
                    alt="Uploaded Item"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-white block truncate">
                    {isDragging ? 'Drop to replace image' : 'Attached Photo'}
                  </span>
                  <span className="text-[11px] text-[#8E92A0] block mt-0.5">
                    {isDragging ? 'Release to upload new photo' : 'Ready to save with this item'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => directInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-[#C5C8D4] hover:text-white transition-colors cursor-pointer"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    title="Remove photo"
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : isQrMode ? (
              /* Case B: QR Code mode (Desktop -> Mobile Camera Transfer) */
              <div className="w-full rounded-2xl bg-[#20222B] border border-white/[0.08] p-5 flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between w-full pb-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Smartphone className="w-3.5 h-3.5 text-[#D4A359]" />
                    <span>Scan with your phone</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseQrMode}
                    className="text-[11px] text-[#8E92A0] hover:text-white transition-colors"
                  >
                    Close QR
                  </button>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-white rounded-xl shadow-md my-1">
                  <QRCodeSVG
                    value={qrUrl}
                    size={140}
                    level="M"
                    includeMargin={false}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8E92A0]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D4A359]" />
                  <span>Waiting for photo from your phone...</span>
                </div>

                <p className="text-[11px] text-[#5F6370] max-w-xs leading-relaxed">
                  Open your camera app and point at the code to snap or select a photo.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleOpenQrMode}
                    className="text-[11px] text-[#D4A359] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Refresh QR code</span>
                  </button>
                  <span className="text-[#5F6370]">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseQrMode()
                      directInputRef.current?.click()
                    }}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Upload from computer instead
                  </button>
                </div>
              </div>
            ) : (
              /* Case C: No image selected - options for Mobile & Desktop */
              <div className="flex flex-col gap-2">
                {/* Mobile Viewport Actions (Camera & Library) */}
                <div className="grid grid-cols-2 gap-2 sm:hidden">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-14 rounded-xl bg-[#20222B] hover:bg-[#282B37] border border-white/[0.06] flex flex-col items-center justify-center gap-1 text-xs font-medium text-white active:scale-95 transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#D4A359]" />
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => directInputRef.current?.click()}
                    disabled={isUploading}
                    className="h-14 rounded-xl bg-[#20222B] hover:bg-[#282B37] border border-white/[0.06] flex flex-col items-center justify-center gap-1 text-xs font-medium text-[#C5C8D4] active:scale-95 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[#8E92A0]" />
                    <span>Upload Image</span>
                  </button>
                </div>

                {/* Desktop Viewport Actions (Upload Drop Zone + QR Scan Option) */}
                <div className="hidden sm:grid sm:grid-cols-5 gap-2.5">
                  {/* Upload Direct Button / Zone */}
                  <div
                    onClick={() => directInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`col-span-3 rounded-xl border border-dashed p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center group ${
                      isDragging
                        ? 'border-[#D4A359] bg-[#D4A359]/10 ring-1 ring-[#D4A359]/30 scale-[1.01]'
                        : 'bg-[#20222B] hover:bg-[#262833] border-white/[0.12] hover:border-[#D4A359]/50'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-5 h-5 text-[#D4A359] animate-spin" />
                        <span className="text-xs text-[#C5C8D4]">Uploading image...</span>
                      </>
                    ) : isDragging ? (
                      <>
                        <Upload className="w-5 h-5 text-[#D4A359] -translate-y-0.5 transition-transform" />
                        <span className="text-xs font-semibold text-[#D4A359]">
                          Drop image here to upload
                        </span>
                        <span className="text-[10px] text-[#C5C8D4]">
                          Release to upload immediately
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-[#8E92A0] group-hover:text-[#D4A359] transition-colors" />
                        <span className="text-xs font-medium text-white group-hover:text-[#D4A359] transition-colors">
                          Click to browse or drag & drop
                        </span>
                        <span className="text-[10px] text-[#5F6370]">
                          PNG, JPG, WEBP up to 10MB
                        </span>
                      </>
                    )}
                  </div>

                  {/* QR Code Phone Capture Trigger */}
                  <div
                    onClick={handleOpenQrMode}
                    className="col-span-2 rounded-xl bg-[#20222B] hover:bg-[#262833] border border-white/[0.06] hover:border-white/20 p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all text-center group"
                  >
                    {isCreatingSession ? (
                      <Loader2 className="w-5 h-5 text-[#D4A359] animate-spin" />
                    ) : (
                      <QrCode className="w-5 h-5 text-[#D4A359] group-hover:scale-105 transition-transform" />
                    )}
                    <span className="text-xs font-medium text-white">
                      Snap with Phone
                    </span>
                    <span className="text-[10px] text-[#8E92A0]">
                      Scan QR with mobile camera
                    </span>
                  </div>
                </div>

                {uploadError && (
                  <p className="text-[11px] text-rose-400 mt-1 pl-1">
                    {uploadError}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Target Progress Toggle */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[0.82rem] text-[#C5C8D4]">
              <input
                type="checkbox"
                checked={hasTarget}
                onChange={(e) => setHasTarget(e.target.checked)}
                className="rounded bg-[#20222B] border-white/20 text-[#D4A359] focus:ring-0 cursor-pointer"
              />
              <span>Set active saving plan target progress %</span>
            </label>

            {hasTarget && (
              <div className="mt-2.5 flex items-center gap-2 pl-6">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetProgress}
                  onChange={(e) => setTargetProgress(e.target.value)}
                  className="w-20 h-[2.1rem] px-2.5 rounded-lg bg-[#20222B] border border-white/[0.08] text-white text-[0.85rem] outline-none"
                />
                <span className="text-[0.8rem] text-[#8E92A0]">% target funded</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.05]">
            <button
              type="button"
              onClick={onClose}
              className="h-[2.3rem] px-4 rounded-xl bg-[#20222B] hover:bg-[#282B37] active:scale-95 text-[#A1A1AA] hover:text-white text-[0.825rem] font-medium transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="h-[2.3rem] px-5 rounded-xl bg-[#D4A359] hover:bg-[#DEB066] active:scale-95 text-[#18191E] text-[0.825rem] font-semibold transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddItemModal
