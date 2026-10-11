import { useEffect, useRef, useState } from 'react'
import { CloseIcon, TrashIcon } from './icons.jsx'

function TaskForm({ initialTitle, initialDescription, isEdit, onSubmit, onDelete, onClose }) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!title.trim()) {
      setError(true)
      inputRef.current?.focus()
      return
    }
    onSubmit({ title: title.trim(), description: description.trim() })
  }

  return (
    <form className="modal__form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">Название</span>
        <input
          ref={inputRef}
          className={`field__input${error ? ' field__input--error' : ''}`}
          value={title}
          maxLength={80}
          placeholder="Например: подготовить отчёт"
          onChange={(event) => {
            setTitle(event.target.value)
            if (error) setError(false)
          }}
        />
        {error ? <span className="field__error">Введите название задачи</span> : null}
      </label>

      <label className="field">
        <span className="field__label">Описание</span>
        <textarea
          className="field__input field__input--area"
          value={description}
          rows={4}
          maxLength={600}
          placeholder="Опишите детали задачи (необязательно)"
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <div className="modal__footer">
        {isEdit ? (
          <button type="button" className="button button--danger" onClick={onDelete}>
            <TrashIcon />
            <span>Удалить</span>
          </button>
        ) : (
          <span />
        )}

        <div className="modal__footer-right">
          <button type="button" className="button button--ghost" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="button button--primary">
            {isEdit ? 'Сохранить' : 'Создать задачу'}
          </button>
        </div>
      </div>
    </form>
  )
}

export default function TaskModal({ open, mode, task, columnTitle, onClose, onSave, onDelete }) {
  useEffect(() => {
    if (!open) return
    const handle = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  if (!open) return null

  const isEdit = mode === 'edit'

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Редактирование задачи' : 'Новая задача'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__header">
          <div>
            <h2 className="modal__title">
              {isEdit ? 'Редактирование задачи' : 'Новая задача'}
            </h2>
            {columnTitle ? <p className="modal__subtitle">Колонка: {columnTitle}</p> : null}
          </div>

          <button
            type="button"
            className="icon-button"
            title="Закрыть"
            aria-label="Закрыть окно"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </header>

        <TaskForm
          key={task?.id ?? 'new-task'}
          initialTitle={task?.title ?? ''}
          initialDescription={task?.description ?? ''}
          isEdit={isEdit}
          onSubmit={onSave}
          onDelete={onDelete}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
