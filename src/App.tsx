import { useState, type FormEvent } from 'react'
import './App.css'

type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskFilter = 'all' | TaskStatus

type Task = {
  id: number
  title: string
  description: string
  status: TaskStatus
  dueLabel: string
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: 'طراحی صفحه ورود',
    description: 'نسخه موبایل و حالت خطای فرم را هم بررسی کن.',
    status: 'in-progress',
    dueLabel: 'امروز',
  },
  {
    id: 2,
    title: 'مرتب‌سازی یادداشت‌های جلسه',
    description: 'تصمیم‌ها را به کارهای قابل پیگیری تبدیل کن.',
    status: 'todo',
    dueLabel: 'فردا',
  },
  {
    id: 3,
    title: 'ساخت کامپوننت دکمه',
    description: 'حالت‌های اصلی و دسترس‌پذیری را کامل کن.',
    status: 'done',
    dueLabel: 'تکمیل‌شده',
  },
]

const statusLabels: Record<TaskStatus, string> = {
  todo: 'برای انجام',
  'in-progress': 'در حال انجام',
  done: 'انجام‌شده',
}

const TASKS_STORAGE_KEY = 'taskflow.tasks.v1'
const TITLE_MAX_LENGTH = 80
const DESCRIPTION_MAX_LENGTH = 200

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false

  const task = value as Record<string, unknown>
  return typeof task.id === 'number'
    && Number.isSafeInteger(task.id)
    && typeof task.title === 'string'
    && task.title.trim().length > 0
    && task.title.length <= TITLE_MAX_LENGTH
    && typeof task.description === 'string'
    && task.description.length <= DESCRIPTION_MAX_LENGTH
    && typeof task.dueLabel === 'string'
    && (task.status === 'todo' || task.status === 'in-progress' || task.status === 'done')
}

function loadTasks(): Task[] {
  if (typeof window === 'undefined') return initialTasks

  try {
    const savedTasks = window.localStorage.getItem(TASKS_STORAGE_KEY)
    if (savedTasks === null) return initialTasks

    const parsedTasks: unknown = JSON.parse(savedTasks)
    return Array.isArray(parsedTasks) && parsedTasks.every(isTask)
      ? parsedTasks
      : initialTasks
  } catch {
    return initialTasks
  }
}

function saveTasks(tasksToSave: Task[]): boolean {
  if (typeof window === 'undefined') return false

  try {
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasksToSave))
    return true
  } catch {
    return false
  }
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [titleError, setTitleError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all')
  const [storageError, setStorageError] = useState(false)

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    inProgress: tasks.filter((task) => task.status === 'in-progress').length,
    done: tasks.filter((task) => task.status === 'done').length,
  }
  const visibleTasks = activeFilter === 'all'
    ? tasks
    : tasks.filter((task) => task.status === activeFilter)

  function handleStatusChange(taskId: number, status: TaskStatus) {
    const updatedTasks = tasks.map((task) => (
      task.id === taskId ? { ...task, status } : task
    ))
    setTasks(updatedTasks)
    setStorageError(!saveTasks(updatedTasks))
  }

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError('عنوان کار را وارد کن.')
      setNotice('')
      return
    }
    if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      setTitleError(`عنوان باید حداکثر ${TITLE_MAX_LENGTH} کاراکتر باشد.`)
      setNotice('')
      return
    }
    if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      setNotice(`توضیح باید حداکثر ${DESCRIPTION_MAX_LENGTH} کاراکتر باشد.`)
      return
    }

    const newTask: Task = {
      id: Date.now(),
      title: trimmedTitle,
      description: description.trim(),
      status: 'todo',
      dueLabel: 'امروز',
    }

    const updatedTasks = [newTask, ...tasks]
    setTasks(updatedTasks)
    setStorageError(!saveTasks(updatedTasks))
    setTitle('')
    setDescription('')
    setTitleError('')
    setNotice('کار تازه با موفقیت اضافه شد.')
  }

  return (
    <main className="app-shell" dir="rtl">
      <aside className="sidebar" aria-label="ناوبری اصلی">
        <a className="brand" href="#dashboard" aria-label="TaskFlow، صفحه اصلی">
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>taskflow</span>
        </a>

        <p className="nav-caption">فضای کاری</p>
        <nav className="main-nav" aria-label="منوی فضای کاری">
          <a className="nav-link nav-link-active" href="#dashboard" aria-current="page">
            <span className="nav-icon" aria-hidden="true">▦</span>
            <span>نمای کلی</span>
          </a>
          <a className="nav-link" href="#tasks">
            <span className="nav-icon" aria-hidden="true">☷</span>
            <span>همه کارها</span>
            <span className="nav-count">{taskCounts.all}</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon" aria-hidden="true">✳</span>
            <p>قدم‌های کوچک،<br />پیشرفت‌های بزرگ.</p>
          </div>
          <button className="profile-button" type="button">
            <span className="avatar" aria-hidden="true">م</span>
            <span className="profile-copy"><strong>مینا رضایی</strong><small>فضای شخصی</small></span>
            <span className="profile-more" aria-hidden="true">···</span>
          </button>
        </div>
      </aside>

      <section className="main-panel" id="dashboard">
        <header className="topbar">
          <span className="breadcrumb">فضای کاری <span aria-hidden="true">/</span> نمای کلی</span>
          <button className="icon-button notification-button" type="button" aria-label="اعلان‌ها">
            ♧<span className="notification-dot" />
          </button>
        </header>

        <div className="dashboard-content">
          {storageError && <p className="storage-warning" role="status">ذخیره‌سازی مرورگر در دسترس نیست؛ تغییرات پس از بستن صفحه باقی نمی‌مانند.</p>}
          <section className="welcome-row" aria-labelledby="page-title">
            <div>
              <p className="eyebrow">یک روز تازه، یک شروع تازه</p>
              <h1 id="page-title">کارهای من <span aria-hidden="true">✦</span></h1>
              <p className="welcome-subtitle">آرام و پیوسته پیش برو؛ داری عالی پیش می‌ری.</p>
            </div>
              <div className="date-chip"><span aria-hidden="true">◷</span> سه‌شنبه، ۲۱ مهر ۱۴۰۵</div>
          </section>

          <section className="stats-grid" aria-label="خلاصه کارها">
            <article className="stat-card stat-total">
              <span className="stat-icon" aria-hidden="true">▤</span>
              <p>همه کارها</p><strong>{taskCounts.all}</strong><small>در فهرست شما</small>
            </article>
            <article className="stat-card stat-progress">
              <span className="stat-icon" aria-hidden="true">◷</span>
              <p>در حال انجام</p><strong>{taskCounts.inProgress}</strong><small>با همین ریتم ادامه بده</small>
            </article>
            <article className="stat-card stat-done">
              <span className="stat-icon" aria-hidden="true">✓</span>
              <p>انجام‌شده</p><strong>{taskCounts.done}</strong><small>یک قدم رو به جلو</small>
            </article>
          </section>

          <section className="create-card" aria-labelledby="create-title">
            <div className="section-heading">
              <div><span className="section-kicker">شروع کن</span><h2 id="create-title">یک کار تازه اضافه کن</h2></div>
              <span className="create-sparkle" aria-hidden="true">✳</span>
            </div>
            <form className="task-form" onSubmit={handleAddTask} noValidate>
              <label className="field field-title">
                <span>عنوان کار</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    if (titleError) setTitleError('')
                  }}
                  placeholder="مثلاً: آماده‌کردن طرح اولیه"
                  maxLength={TITLE_MAX_LENGTH}
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={titleError ? 'title-error title-counter' : 'title-counter'}
                />
                {titleError && <small className="field-error" id="title-error" role="alert">{titleError}</small>}
                <small className="field-counter" id="title-counter">{title.length}/{TITLE_MAX_LENGTH}</small>
              </label>
              <label className="field field-description">
                <span>توضیح <small>اختیاری</small></span>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="جزئیات کوتاه کار را بنویس..."
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  aria-describedby="description-counter"
                />
                <small className="field-counter" id="description-counter">{description.length}/{DESCRIPTION_MAX_LENGTH}</small>
              </label>
              <button className="add-button" type="submit"><span aria-hidden="true">＋</span> افزودن کار</button>
            </form>
            {notice && <p className="form-notice" role="status">{notice}</p>}
          </section>

          <section className="task-section" id="tasks" aria-labelledby="tasks-title">
            <div className="task-section-heading">
              <div><span className="section-kicker">فهرست شما</span><h2 id="tasks-title">کارها <span className="task-total">{taskCounts.all}</span></h2></div>
              <button className="sort-button" type="button"><span aria-hidden="true">☷</span> جدیدترین <span aria-hidden="true">⌄</span></button>
            </div>
            <div className="filter-row" aria-label="فیلتر کارها">
              <button className={`filter-chip ${activeFilter === 'all' ? 'filter-active' : ''}`} type="button" aria-pressed={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>همه <span>{taskCounts.all}</span></button>
              <button className={`filter-chip ${activeFilter === 'todo' ? 'filter-active' : ''}`} type="button" aria-pressed={activeFilter === 'todo'} onClick={() => setActiveFilter('todo')}>برای انجام <span>{taskCounts.todo}</span></button>
              <button className={`filter-chip ${activeFilter === 'in-progress' ? 'filter-active' : ''}`} type="button" aria-pressed={activeFilter === 'in-progress'} onClick={() => setActiveFilter('in-progress')}>در حال انجام <span>{taskCounts.inProgress}</span></button>
              <button className={`filter-chip ${activeFilter === 'done' ? 'filter-active' : ''}`} type="button" aria-pressed={activeFilter === 'done'} onClick={() => setActiveFilter('done')}>انجام‌شده <span>{taskCounts.done}</span></button>
            </div>

            <div className="task-list">
              {visibleTasks.length > 0 ? visibleTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <span className={`task-check task-check-${task.status}`} aria-hidden="true">{task.status === 'done' ? '✓' : ''}</span>
                  <div className="task-copy"><h3>{task.title}</h3><p>{task.description}</p></div>
                  <label className={`status-badge status-${task.status}`}>
                    <span className="sr-only">وضعیت {task.title}</span>
                    <select
                      className="status-select"
                      value={task.status}
                      aria-label={`وضعیت ${task.title}`}
                      onChange={(event) => handleStatusChange(task.id, event.target.value as TaskStatus)}
                    >
                      <option value="todo">{statusLabels.todo}</option>
                      <option value="in-progress">{statusLabels['in-progress']}</option>
                      <option value="done">{statusLabels.done}</option>
                    </select>
                  </label>
                  <span className="task-date">{task.dueLabel}</span>
                  <button className="task-menu" type="button" aria-label={`گزینه‌های ${task.title}`}>···</button>
                </article>
              )) : <p className="empty-state" role="status">در این وضعیت هنوز کاری نداری.</p>}
            </div>
            {activeFilter !== 'all' && <button className="see-all-button" type="button" onClick={() => setActiveFilter('all')}>نمایش همه کارها <span aria-hidden="true">←</span></button>}
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
