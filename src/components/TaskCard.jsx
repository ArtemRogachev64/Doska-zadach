import { PencilIcon, TrashIcon } from './icons.jsx'

export default function TaskCard({
  task,
  isDragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}) {
  return (
    <article
      className={`task-card${isDragging ? ' task-card--dragging' : ''}`}
      data-task-card
      data-task-id={task.id}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDoubleClick={onEdit}
    >
      <div className="task-card__body">
        <h4 className="task-card__title">{task.title}</h4>
        {task.description ? (
          <p className="task-card__description">{task.description}</p>
        ) : null}
      </div>

      <div className="task-card__actions">
        <button
          type="button"
          className="icon-button"
          title="Редактировать задачу"
          aria-label={`Редактировать задачу «${task.title}»`}
          onClick={onEdit}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          className="icon-button icon-button--danger"
          title="Удалить задачу"
          aria-label={`Удалить задачу «${task.title}»`}
          onClick={onDelete}
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  )
}
