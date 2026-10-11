import { useEffect, useMemo, useReducer } from 'react'

const STORAGE_KEY = 'task-board:v1'

export function createId(prefix) {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 10)
  return `${prefix}_${random}`
}

function createInitialState() {
  const backlog = createId('task')
  const progress = createId('task')
  const review = createId('task')
  const done = createId('task')

  return {
    columns: [
      { id: 'col_backlog', title: 'Бэклог', taskIds: [backlog] },
      { id: 'col_progress', title: 'В работе', taskIds: [progress, review] },
      { id: 'col_done', title: 'Готово', taskIds: [done] },
    ],
    tasks: {
      [backlog]: {
        id: backlog,
        title: 'Продумать структуру доски',
        description: 'Колонки, карточки и то, как задачи перемещаются между ними.',
        createdAt: Date.now(),
      },
      [progress]: {
        id: progress,
        title: 'Свёрстать интерфейс',
        description: 'Колонки, карточки и модальное окно редактирования.',
        createdAt: Date.now(),
      },
      [review]: {
        id: review,
        title: 'Реализовать drag & drop',
        description: 'Перетаскивание задач между колонками и перестановка самих колонок.',
        createdAt: Date.now(),
      },
      [done]: {
        id: done,
        title: 'Настроить проект',
        description: 'React + Vite, базовые стили и сохранение в localStorage.',
        createdAt: Date.now(),
      },
    },
  }
}

function isValidState(value) {
  return (
    value &&
    typeof value === 'object' &&
    Array.isArray(value.columns) &&
    value.tasks &&
    typeof value.tasks === 'object'
  )
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed = JSON.parse(raw)
    return isValidState(parsed) ? parsed : createInitialState()
  } catch {
    return createInitialState()
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'column/add': {
      const id = createId('col')
      return {
        ...state,
        columns: [
          ...state.columns,
          { id, title: action.title?.trim() || 'Новая колонка', taskIds: [] },
        ],
      }
    }

    case 'column/rename':
      return {
        ...state,
        columns: state.columns.map((column) =>
          column.id === action.columnId
            ? { ...column, title: action.title.trim() || column.title }
            : column,
        ),
      }

    case 'column/delete': {
      const column = state.columns.find((item) => item.id === action.columnId)
      if (!column) return state
      const tasks = { ...state.tasks }
      column.taskIds.forEach((taskId) => {
        delete tasks[taskId]
      })
      return {
        columns: state.columns.filter((item) => item.id !== action.columnId),
        tasks,
      }
    }

    case 'column/move': {
      const { fromIndex, toIndex } = action
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.columns.length
      ) {
        return state
      }
      const columns = [...state.columns]
      const [moved] = columns.splice(fromIndex, 1)
      columns.splice(Math.min(Math.max(toIndex, 0), columns.length), 0, moved)
      return { ...state, columns }
    }

    case 'task/add': {
      const id = createId('task')
      const task = {
        id,
        title: action.title.trim(),
        description: action.description?.trim() || '',
        createdAt: Date.now(),
      }
      return {
        ...state,
        tasks: { ...state.tasks, [id]: task },
        columns: state.columns.map((column) =>
          column.id === action.columnId
            ? { ...column, taskIds: [...column.taskIds, id] }
            : column,
        ),
      }
    }

    case 'task/update': {
      const existing = state.tasks[action.taskId]
      if (!existing) return state
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.taskId]: {
            ...existing,
            title: action.title.trim() || existing.title,
            description: action.description?.trim() || '',
            updatedAt: Date.now(),
          },
        },
      }
    }

    case 'task/delete': {
      if (!state.tasks[action.taskId]) return state
      const tasks = { ...state.tasks }
      delete tasks[action.taskId]
      return {
        ...state,
        tasks,
        columns: state.columns.map((column) =>
          column.taskIds.includes(action.taskId)
            ? { ...column, taskIds: column.taskIds.filter((id) => id !== action.taskId) }
            : column,
        ),
      }
    }

    case 'task/move': {
      const { taskId, toColumnId, toIndex } = action
      const fromColumnId = state.columns.find((column) =>
        column.taskIds.includes(taskId),
      )?.id
      if (!fromColumnId) return state
      if (!state.columns.some((column) => column.id === toColumnId)) return state

      const columns = state.columns.map((column) => {
        if (fromColumnId === toColumnId && column.id === fromColumnId) {
          const ids = column.taskIds.filter((id) => id !== taskId)
          ids.splice(Math.min(Math.max(toIndex, 0), ids.length), 0, taskId)
          return { ...column, taskIds: ids }
        }
        if (column.id === fromColumnId) {
          return { ...column, taskIds: column.taskIds.filter((id) => id !== taskId) }
        }
        if (column.id === toColumnId) {
          const ids = [...column.taskIds]
          ids.splice(Math.min(Math.max(toIndex, 0), ids.length), 0, taskId)
          return { ...column, taskIds: ids }
        }
        return column
      })

      return { ...state, columns }
    }

    case 'board/reset':
      return createInitialState()

    default:
      return state
  }
}

export function useBoard() {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // хранилище может быть недоступно — просто игнорируем
    }
  }, [state])

  const actions = useMemo(
    () => ({
      addColumn: (title) => dispatch({ type: 'column/add', title }),
      renameColumn: (columnId, title) => dispatch({ type: 'column/rename', columnId, title }),
      deleteColumn: (columnId) => dispatch({ type: 'column/delete', columnId }),
      moveColumn: (fromIndex, toIndex) => dispatch({ type: 'column/move', fromIndex, toIndex }),
      addTask: (columnId, title, description) =>
        dispatch({ type: 'task/add', columnId, title, description }),
      updateTask: (taskId, title, description) =>
        dispatch({ type: 'task/update', taskId, title, description }),
      deleteTask: (taskId) => dispatch({ type: 'task/delete', taskId }),
      moveTask: (taskId, toColumnId, toIndex) =>
        dispatch({ type: 'task/move', taskId, toColumnId, toIndex }),
      resetBoard: () => dispatch({ type: 'board/reset' }),
    }),
    [],
  )

  return { state, actions }
}
