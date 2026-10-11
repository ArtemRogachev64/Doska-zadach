import { Fragment, useEffect, useRef, useState } from 'react'
import TaskCard from './TaskCard.jsx'
import { GripIcon, PlusIcon, TrashIcon } from './icons.jsx'

function DropLine() {
  return <div className="drop-line" aria-hidden />
}

export default function Column({
  column,
  tasks,
  draggedTaskId,
  dropIndex,
  isColumnDragging,
  onRename,
  onDelete,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onTaskDragStart,
  onTaskDragEnd,
  onColumnDragStart,
  onColumnDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(column.title)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const startEditing = () => {
    setDraft(column.title)
    setIsEditing(true)
  }

  const commit = () => {
    setIsEditing(false)
    if (draft.trim() && draft.trim() !== column.title) {
      onRename(column.id, draft)
    }
  }

  const cancel = () => {
    setDraft(column.title)
    setIsEditing(false)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancel()
    }
  }

  // Позиции задач без учёта перетаскиваемой карточки — именно в этих
  // координатах приходит индекс места вставки (dropIndex).
  const others = tasks.filter((task) => task.id !== draggedTaskId)
  const dropPositions = new Map(others.map((task, position) => [task.id, position]))

  return (
    <section
      className={`column${isColumnDragging ? ' column--dragging' : ''}`}
      data-column-id={column.id}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
    >
      <header
        className="column__header"
        draggable={!isEditing}
        onDragStart={onColumnDragStart}
        onDragEnd={onColumnDragEnd}
      >
        <span className="column__grip" title="Перетащите, чтобы изменить порядок колонок">
          <GripIcon />
        </span>

        {isEditing ? (
          <input
            ref={inputRef}
            className="column__title-input"
            value={draft}
            maxLength={60}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <button
            type="button"
            className="column__title"
            title="Нажмите, чтобы переименовать колонку"
            onClick={startEditing}
          >
            {column.title}
          </button>
        )}

        <span className="column__count">{tasks.length}</span>

        <button
          type="button"
          className="icon-button icon-button--danger"
          title="Удалить колонку"
          aria-label={`Удалить колонку «${column.title}»`}
          onClick={() => onDelete(column)}
        >
          <TrashIcon />
        </button>
      </header>

      <div className="column__body">
        {tasks.map((task) => {
          const isDragged = task.id === draggedTaskId
          const showLine = !isDragged && dropIndex === dropPositions.get(task.id)

          return (
            <Fragment key={task.id}>
              {showLine ? <DropLine /> : null}
              <TaskCard
                task={task}
                isDragging={isDragged}
                onDragStart={(event) => onTaskDragStart(event, task, column.id)}
                onDragEnd={onTaskDragEnd}
                onEdit={() => onEditTask(task, column.id)}
                onDelete={() => onDeleteTask(task, column.id)}
              />
            </Fragment>
          )
        })}

        {dropIndex !== null && dropIndex === others.length ? <DropLine /> : null}

        {tasks.length === 0 && dropIndex === null ? (
          <p className="column__empty">Перетащите задачу сюда или добавьте новую</p>
        ) : null}
      </div>

      <button type="button" className="column__add" onClick={() => onAddTask(column.id)}>
        <PlusIcon />
        <span>Добавить задачу</span>
      </button>
    </section>
  )
}
