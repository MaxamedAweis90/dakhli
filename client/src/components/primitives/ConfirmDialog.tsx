import React from 'react'
import { ModalWrapper } from './ModalWrapper'
import { Button } from './Button'
import { AlertTriangle, AlertCircle, Info } from '@/components/shared/icons'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconMap = {
    danger: <AlertCircle className="w-5 h-5 text-status-danger" />,
    warning: <AlertTriangle className="w-5 h-5 text-status-warning" />,
    primary: <Info className="w-5 h-5 text-brand" />,
  }

  const buttonVariantMap = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    primary: 'primary' as const,
  }

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} maxWidth="sm">
      <div className="flex items-start space-x-3 mb-4">
        <div className="p-2 rounded-xl bg-surface-elevated border border-surface-subtle flex-shrink-0">
          {iconMap[variant]}
        </div>
        <div>
          <h4 className="text-base font-bold text-white tracking-tight">{title}</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-surface-subtle mt-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          variant={buttonVariantMap[variant]}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </ModalWrapper>
  )
}

export default ConfirmDialog
