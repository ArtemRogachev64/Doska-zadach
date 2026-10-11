import { useState } from 'react'
import Board from './components/Board.jsx'
import ConfirmDialog from './components/ConfirmDialog.jsx'
import { ResetIcon } from './components/icons.jsx'
import { useBoard } from './hooks/useBoard.js'

export default function App() {
  const { state, actions } = useBoard()
  const [isResetOpen, setResetOpen] = useState(false)

  const taskCount = Object.keys(state.tasks).length
  const columnCount = state.columns.length

  return (
    <div className="app">
      <header className="app__header">
        <div className="app__brand">
          <span className="app__logo" aria-hidden>
            ✓
          </span>
          <div>
            <h1 className="app__title">Доска задач</h1>
            <p className="app__subtitle">
              {columnCount} {plural(columnCount, ['колонка', 'колонки', 'колонок'])} ·{' '}
              {taskCount} {plural(taskCount, ['задача', 'задачи', 'задач'])}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="button button--ghost"
          onClick={() => setResetOpen(true)}
        >
          <ResetIcon />
          <span>Сбросить доску</span>
        </button>
      </header>

      <p className="app__hint">
        Перетаскивайте карточки между колонками, тяните колонку за иконку слева, чтобы
        изменить её порядок. Двойной щелчок по карточке открывает редактирование.
      </p>

      <Board state={state} actions={actions} />

      <ConfirmDialog
        open={isResetOpen}
        title="Сбросить доску?"
        message="Все колонки и задачи будут заменены начальным набором. Действие нельзя отменить."
        confirmLabel="Сбросить"
        onCancel={() => setResetOpen(false)}
        onConfirm={() => {
          actions.resetBoard()
          setResetOpen(false)
        }}
      />
    </div>
  )
}

function plural(count, forms) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}
