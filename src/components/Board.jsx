import { useRef, useState } from 'react'
import Column from './Column.jsx'
import TaskModal from './TaskModal.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { PlusIcon } from './icons.jsx'

const EMPTY_TASK = { id: null, title: '', description: '' }

export default function Board({ state, actions }) {
  const { columns, tasks } = state
  const boardRef = useRef(null)

  const [drag, setDrag] = useState(null)
  const [taskDrop, setTaskDrop] = useState(null)
  const [columnDrop, setColumnDrop] = useState(null)

  const [modal, setModal] = useState(null)
  const [columnToDelete, setColumnToDelete] = useState(null)
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnTitle, setNewColumnTitle] = useState('')
  const addColumnInputRef = useRef(null)

  const resetDrag = () => {
    setDrag(null)
    setTaskDrop(null)
    setColumnDrop(null)
  }

  /* ------------------------------- задачи ------------------------------- */

  const handleTaskDragStart = (event, task) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
    setDrag({ type: 'task', taskId: task.id })
  }

  const handleTaskDragEnd = () => resetDrag()

  /* ------------------------------ колонки ------------------------------- */

  const handleColumnDragStart = (event, columnId) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', columnId)
    setDrag({ type: 'column', columnId })
  }

  const handleColumnDragEnd = () => resetDrag()

  /* ---------------------------- drag over/drop --------------------------- */

  const computeTaskIndex = (sectionEl, draggedTaskId, clientY) => {
    const cards = Array.from(sectionEl.querySelectorAll('[data-task-card]')).filter(
      (card) => card.dataset.taskId !== draggedTaskId,
    )
    for (let index = 0; index < cards.length; index += 1) {
      const rect = cards[index].getBoundingClientRect()
      if (clientY < rect.top + rect.height / 2) return index
    }
    return cards.length
  }

  const computeColumnIndex = (sectionEl, overColumnId, clientX, draggedColumnId) => {
    const others = columns.filter((column) => column.id !== draggedColumnId)
    const overIndex = others.findIndex((column) => column.id === overColumnId)
    if (overIndex === -1) return null
    const rect = sectionEl.getBoundingClientRect()
    const isAfter = clientX > rect.left + rect.width / 2
    return overIndex + (isAfter ? 1 : 0)
  }

  const handleDragOver = (event, column) => {
    if (!drag) return

    if (drag.type === 'task') {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      const index = computeTaskIndex(event.currentTarget, drag.taskId, event.clientY)
      setTaskDrop((prev) =>
        prev && prev.columnId === column.id && prev.index === index
          ? prev
          : { columnId: column.id, index },
      )
      return
    }

    if (drag.type === 'column' && drag.columnId !== column.id) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      const index = computeColumnIndex(
        event.currentTarget,
        column.id,
        event.clientX,
        drag.columnId,
      )
      if (index === null) return
      setColumnDrop((prev) => (prev === index ? prev : index))
    }
  }

  const handleDrop = (event, column) => {
    const draggedId = event.dataTransfer.getData('text/plain')

    if (draggedId && tasks[draggedId]) {
      // перетаскивание задачи
      event.preventDefault()
      const index = computeTaskIndex(event.currentTarget, draggedId, event.clientY)
      actions.moveTask(draggedId, column.id, index)
    } else if (draggedId && columns.some((item) => item.id === draggedId)) {
      // перетаскивание колонки
      event.preventDefault()
      const toIndex = computeColumnIndex(
        event.currentTarget,
        column.id,
        event.clientX,
        draggedId,
      )
      if (toIndex !== null && toIndex !== undefined) {
        const fromIndex = columns.findIndex((item) => item.id === draggedId)
        actions.moveColumn(fromIndex, toIndex)
      }
    }

    resetDrag()
  }

  const handleDragLeave = (event) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    const columnId = event.currentTarget.dataset.columnId
    setTaskDrop((prev) => (prev && prev.columnId === columnId ? null : prev))
  }

  /* ------------------------------ модальные окна ------------------------- */

  const openCreateTask = (columnId) => {
    setModal({ mode: 'create', columnId, task: EMPTY_TASK })
  }

  const openEditTask = (task, columnId) => {
    setModal({ mode: 'edit', columnId, task })
  }

  const closeModal = () => setModal(null)

  const saveTask = ({ title, description }) => {
    if (!modal) return
    if (modal.mode === 'create') {
      actions.addTask(modal.columnId, title, description)
    } else {
      actions.updateTask(modal.task.id, title, description)
    }
    setModal(null)
  }

  const deleteTaskFromModal = () => {
    if (modal?.task?.id) actions.deleteTask(modal.task.id)
    setModal(null)
  }

  /* --------------------------- добавление колонки ------------------------ */

  const submitNewColumn = () => {
    const title = newColumnTitle.trim()
    if (title) actions.addColumn(title)
    setNewColumnTitle('')
    setIsAddingColumn(false)
  }

  const startAddingColumn = () => {
    setIsAddingColumn(true)
    window.setTimeout(() => addColumnInputRef.current?.focus(), 0)
  }

  /* -------------------------------- рендер ------------------------------- */

  const draggedTaskId = drag?.type === 'task' ? drag.taskId : null
  const isDraggingColumn = drag?.type === 'column'
  const draggedColumnId = isDraggingColumn ? drag.columnId : null

  const columnNodes = []
  let seenColumns = 0

  columns.forEach((column) => {
    if (column.id === draggedColumnId) {
      columnNodes.push(
        <Column
          key={column.id}
          column={column}
          tasks={column.taskIds.map((id) => tasks[id]).filter(Boolean)}
          draggedTaskId={null}
          dropIndex={null}
          isColumnDragging
          onRename={actions.renameColumn}
          onDelete={setColumnToDelete}
          onAddTask={openCreateTask}
          onEditTask={openEditTask}
          onDeleteTask={(task) => actions.deleteTask(task.id)}
          onTaskDragStart={handleTaskDragStart}
          onTaskDragEnd={handleTaskDragEnd}
          onColumnDragStart={(event) => handleColumnDragStart(event, column.id)}
          onColumnDragEnd={handleColumnDragEnd}
          onDragOver={(event) => handleDragOver(event, column)}
          onDrop={(event) => handleDrop(event, column)}
          onDragLeave={handleDragLeave}
        />,
      )
      return
    }

    if (isDraggingColumn && columnDrop === seenColumns) {
      columnNodes.push(
        <div key={`column-drop-${column.id}`} className="column-drop-indicator" aria-hidden />,
      )
    }
    seenColumns += 1

    columnNodes.push(
      <Column
        key={column.id}
        column={column}
        tasks={column.taskIds.map((id) => tasks[id]).filter(Boolean)}
        draggedTaskId={draggedTaskId}
        dropIndex={taskDrop && taskDrop.columnId === column.id ? taskDrop.index : null}
        isColumnDragging={false}
        onRename={actions.renameColumn}
        onDelete={setColumnToDelete}
        onAddTask={openCreateTask}
        onEditTask={openEditTask}
        onDeleteTask={(task) => actions.deleteTask(task.id)}
        onTaskDragStart={handleTaskDragStart}
        onTaskDragEnd={handleTaskDragEnd}
        onColumnDragStart={(event) => handleColumnDragStart(event, column.id)}
        onColumnDragEnd={handleColumnDragEnd}
        onDragOver={(event) => handleDragOver(event, column)}
        onDrop={(event) => handleDrop(event, column)}
        onDragLeave={handleDragLeave}
      />,
    )
  })

  if (isDraggingColumn && columnDrop === seenColumns) {
    columnNodes.push(
      <div key="column-drop-end" className="column-drop-indicator" aria-hidden />,
    )
  }

  const modalColumn = modal
    ? columns.find((column) => column.id === modal.columnId)
    : null

  return (
    <div className="board" ref={boardRef}>
      <div className="board__columns">
        {columnNodes}

        <div className="add-column">
          {isAddingColumn ? (
            <form
              className="add-column__form"
              onSubmit={(event) => {
                event.preventDefault()
                submitNewColumn()
              }}
            >
              <input
                ref={addColumnInputRef}
                className="add-column__input"
                value={newColumnTitle}
                maxLength={60}
                placeholder="Название колонки"
                onChange={(event) => setNewColumnTitle(event.target.value)}
                onBlur={submitNewColumn}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setNewColumnTitle('')
                    setIsAddingColumn(false)
                  }
                }}
              />
            </form>
          ) : (
            <button type="button" className="add-column__button" onClick={startAddingColumn}>
              <PlusIcon />
              <span>Добавить колонку</span>
            </button>
          )}
        </div>
      </div>

      <TaskModal
        open={Boolean(modal)}
        mode={modal?.mode ?? 'create'}
        task={modal?.task}
        columnTitle={modalColumn?.title}
        onClose={closeModal}
        onSave={saveTask}
        onDelete={deleteTaskFromModal}
      />

      <ConfirmDialog
        open={Boolean(columnToDelete)}
        title="Удалить колонку?"
        message={
          columnToDelete
            ? `Колонка «${columnToDelete.title}» и все её задачи будут удалены безвозвратно.`
            : ''
        }
        confirmLabel="Удалить колонку"
        onCancel={() => setColumnToDelete(null)}
        onConfirm={() => {
          actions.deleteColumn(columnToDelete.id)
          setColumnToDelete(null)
        }}
      />
    </div>
  )
}
