import { useEffect } from 'react'

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const handle = (event) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div
        className="modal modal--confirm"
        role="alertdialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="modal__title">{title}</h2>
        {message ? <p className="modal__text">{message}</p> : null}
        <div className="modal__footer">
          <span />
          <div className="modal__footer-right">
            <button type="button" className="button button--ghost" onClick={onCancel}>
              Отмена
            </button>
            <button type="button" className="button button--danger" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
