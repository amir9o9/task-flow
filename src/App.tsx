import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskFilter = 'all' | TaskStatus
type Theme = 'light' | 'dark'
type Language = 'en' | 'fa'

type Task = {
  id: number
  title: string
  description: string
  status: TaskStatus
  dueLabel: string
}

const initialTasks: Task[] = []

const translations = {
  en: {
    appTitle: 'My Tasks',
    homeLabel: 'TaskFlow home page',
    workspace: 'Workspace',
    workspaceNavigation: 'Workspace navigation',
    overview: 'Overview',
    allTasks: 'All tasks',
    enableDarkTheme: 'Enable dark theme',
    enableLightTheme: 'Enable light theme',
    darkTheme: 'Dark theme',
    lightTheme: 'Light theme',
    switchToPersian: 'Switch to Persian',
    switchToEnglish: 'Switch to English',
    switchLanguage: 'فارسی',
    switchLanguageToEnglish: 'English',
    storageWarning: 'Browser storage is unavailable; changes will not be kept after you close this page.',
    dateLocale: 'en-US',
    allTasksStat: 'All tasks',
    inProgress: 'In progress',
    done: 'Completed',
    inYourList: 'In your list',
    keepGoing: 'Keep up the great work',
    oneStepForward: 'One step forward',
    getStarted: 'GET STARTED',
    addTask: 'Add a new task',
    taskTitle: 'Task title',
    optional: 'Optional',
    titlePlaceholder: 'e.g., Prepare the first draft',
    description: 'Description',
    descriptionPlaceholder: 'Add a short description...',
    addTaskButton: 'Add task',
    taskList: 'Your task list',
    tasks: 'Tasks',
    filters: 'Filter tasks',
    allFilter: 'All',
    todo: 'To do',
    status: (title: string) => `Status of ${title}`,
    edit: (title: string) => `Edit ${title}`,
    delete: (title: string) => `Delete ${title}`,
    save: 'Save',
    cancel: 'Cancel',
    empty: 'There are no tasks in this status yet.',
    showAll: 'Show all tasks',
    titleRequired: 'Enter a task title.',
    titleTooLong: (max: number) => `The title must be ${max} characters or fewer.`,
    descriptionTooLong: (max: number) => `The description must be ${max} characters or fewer.`,
    addSuccess: 'Task added successfully.',
    editSuccess: 'Task updated.',
    deleteConfirm: (title: string) => `Delete “${title}”?`,
    deleteSuccess: 'Task deleted.',
    dueToday: 'Today',
    dueTomorrow: 'Tomorrow',
    dueCompleted: 'Completed',
  },
  fa: {
    appTitle: 'کارهای من',
    homeLabel: 'TaskFlow، صفحه اصلی',
    workspace: 'فضای کاری',
    workspaceNavigation: 'منوی فضای کاری',
    overview: 'نمای کلی',
    allTasks: 'همه کارها',
    enableDarkTheme: 'فعال‌کردن پوستهٔ تاریک',
    enableLightTheme: 'فعال‌کردن پوستهٔ روشن',
    darkTheme: 'پوستهٔ تاریک',
    lightTheme: 'پوستهٔ روشن',
    switchToPersian: 'تغییر زبان به فارسی',
    switchToEnglish: 'تغییر زبان به انگلیسی',
    switchLanguage: 'فارسی',
    switchLanguageToEnglish: 'English',
    storageWarning: 'ذخیره‌سازی مرورگر در دسترس نیست؛ تغییرات پس از بستن صفحه باقی نمی‌مانند.',
    dateLocale: 'fa-IR-u-ca-persian',
    allTasksStat: 'همه کارها',
    inProgress: 'در حال انجام',
    done: 'انجام‌شده',
    inYourList: 'در فهرست شما',
    keepGoing: 'با همین ریتم ادامه بده',
    oneStepForward: 'یک قدم رو به جلو',
    getStarted: 'شروع کن',
    addTask: 'یک کار تازه اضافه کن',
    taskTitle: 'عنوان کار',
    optional: 'اختیاری',
    titlePlaceholder: 'مثلاً: آماده‌کردن طرح اولیه',
    description: 'توضیح',
    descriptionPlaceholder: 'جزئیات کوتاه کار را بنویس...',
    addTaskButton: 'افزودن کار',
    taskList: 'فهرست شما',
    tasks: 'کارها',
    filters: 'فیلتر کارها',
    allFilter: 'همه',
    todo: 'برای انجام',
    status: (title: string) => `وضعیت ${title}`,
    edit: (title: string) => `ویرایش ${title}`,
    delete: (title: string) => `حذف ${title}`,
    save: 'ذخیره',
    cancel: 'انصراف',
    empty: 'در این وضعیت هنوز کاری نداری.',
    showAll: 'نمایش همه کارها',
    titleRequired: 'عنوان کار را وارد کن.',
    titleTooLong: (max: number) => `عنوان باید حداکثر ${max} کاراکتر باشد.`,
    descriptionTooLong: (max: number) => `توضیح باید حداکثر ${max} کاراکتر باشد.`,
    addSuccess: 'کار تازه با موفقیت اضافه شد.',
    editSuccess: 'تغییرات کار اعمال شد.',
    deleteConfirm: (title: string) => `کار «${title}» حذف شود؟`,
    deleteSuccess: 'کار حذف شد.',
    dueToday: 'امروز',
    dueTomorrow: 'فردا',
    dueCompleted: 'تکمیل‌شده',
  },
} as const

const statusLabels: Record<Language, Record<TaskStatus, string>> = {
  en: { todo: translations.en.todo, 'in-progress': translations.en.inProgress, done: translations.en.done },
  fa: { todo: translations.fa.todo, 'in-progress': translations.fa.inProgress, done: translations.fa.done },
}

const TASKS_STORAGE_KEY = 'task-flow.tasks.v1'
const LEGACY_TASKS_STORAGE_KEY = 'taskflow.tasks.v1'
const THEME_STORAGE_KEY = 'task-flow.theme.v1'
const LANGUAGE_STORAGE_KEY = 'task-flow.language.v1'
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
      ?? window.localStorage.getItem(LEGACY_TASKS_STORAGE_KEY)
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

function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function loadLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'fa' ? 'fa' : 'en'
  } catch {
    return 'en'
  }
}

function getDueLabel(label: string, language: Language) {
  if (label === 'Today' || label === 'امروز') return translations[language].dueToday
  if (label === 'Tomorrow' || label === 'فردا') return translations[language].dueTomorrow
  if (label === 'Completed' || label === 'تکمیل‌شده' || label === 'انجام‌شده') return translations[language].dueCompleted
  return label
}

function App() {
  const [language, setLanguage] = useState<Language>(loadLanguage)
  const text = translations[language]
  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
    document.title = `TaskFlow | ${text.appTitle}`
  }, [language, text.appTitle])
  const formattedDate = new Intl.DateTimeFormat(text.dateLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const [tasks, setTasks] = useState<Task[]>(loadTasks)
  const [theme, setTheme] = useState<Theme>(loadTheme)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [titleError, setTitleError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all')
  const [storageError, setStorageError] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState('')

  function handleLanguageToggle() {
    const nextLanguage = language === 'en' ? 'fa' : 'en'
    setLanguage(nextLanguage)
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
    } catch {
      // Language changes remain available for this session if storage is unavailable.
    }
  }

  function handleThemeToggle() {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // Theme changes remain available for this session if storage is unavailable.
    }
  }

  const taskCounts = {
    all: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    inProgress: tasks.filter((task) => task.status === 'in-progress').length,
    done: tasks.filter((task) => task.status === 'done').length,
  }
  const visibleTasks = activeFilter === 'all'
    ? tasks
    : tasks.filter((task) => task.status === activeFilter)

  function updateTasks(updatedTasks: Task[]) {
    setTasks(updatedTasks)
    setStorageError(!saveTasks(updatedTasks))
  }

  function handleStatusChange(taskId: number, status: TaskStatus) {
    const updatedTasks = tasks.map((task) => (
      task.id === taskId ? { ...task, status } : task
    ))
    updateTasks(updatedTasks)
  }

  function handleStartEdit(task: Task) {
    setEditingTaskId(task.id)
    setEditTitle(task.title)
    setEditDescription(task.description)
    setEditError('')
  }

  function handleCancelEdit() {
    setEditingTaskId(null)
    setEditTitle('')
    setEditDescription('')
    setEditError('')
  }

  function handleSaveEdit(event: FormEvent<HTMLFormElement>, taskId: number) {
    event.preventDefault()
    const trimmedTitle = editTitle.trim()

    if (!trimmedTitle) {
      setEditError(text.titleRequired)
      return
    }
    if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      setEditError(text.titleTooLong(TITLE_MAX_LENGTH))
      return
    }

    const updatedTasks = tasks.map((task) => task.id === taskId
      ? { ...task, title: trimmedTitle, description: editDescription.trim() }
      : task
    )
    updateTasks(updatedTasks)
    handleCancelEdit()
    setNotice(text.editSuccess)
  }

  function handleDeleteTask(task: Task) {
    if (!window.confirm(text.deleteConfirm(task.title))) return

    updateTasks(tasks.filter((currentTask) => currentTask.id !== task.id))
    if (editingTaskId === task.id) handleCancelEdit()
    setNotice(text.deleteSuccess)
  }

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setTitleError(text.titleRequired)
      setNotice('')
      return
    }
    if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      setTitleError(text.titleTooLong(TITLE_MAX_LENGTH))
      setNotice('')
      return
    }
    if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      setNotice(text.descriptionTooLong(DESCRIPTION_MAX_LENGTH))
      return
    }

    const newTask: Task = {
      id: Date.now(),
      title: trimmedTitle,
      description: description.trim(),
      status: 'todo',
      dueLabel: text.dueToday,
    }

    const updatedTasks = [newTask, ...tasks]
    updateTasks(updatedTasks)
    setTitle('')
    setDescription('')
    setTitleError('')
    setNotice(text.addSuccess)
  }

  return (
    <main className="app-shell" lang={language} dir={language === 'fa' ? 'rtl' : 'ltr'} data-theme={theme}>
      <aside className="sidebar" aria-label={text.workspace}>
        <a className="brand" href="#dashboard" aria-label={text.homeLabel}>
          <span className="brand-mark" aria-hidden="true">T</span>
          <span>TaskFlow</span>
        </a>

        <p className="nav-caption">{text.workspace}</p>
        <nav className="main-nav" aria-label={text.workspaceNavigation}>
          <a className="nav-link nav-link-active" href="#dashboard" aria-current="page">
            <span className="nav-icon" aria-hidden="true">▦</span>
            <span>{text.overview}</span>
          </a>
          <a className="nav-link" href="#tasks">
            <span className="nav-icon" aria-hidden="true">☷</span>
            <span>{text.allTasks}</span>
            <span className="nav-count">{taskCounts.all}</span>
          </a>
        </nav>

        <button
          className="theme-toggle"
          type="button"
          aria-label={theme === 'light' ? text.enableDarkTheme : text.enableLightTheme}
          aria-pressed={theme === 'dark'}
          onClick={handleThemeToggle}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {theme === 'light'
              ? <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
              : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>}
          </svg>
          <span>{theme === 'light' ? text.darkTheme : text.lightTheme}</span>
        </button>

        <button
          className="language-toggle"
          type="button"
          aria-label={language === 'en' ? text.switchToPersian : text.switchToEnglish}
          onClick={handleLanguageToggle}
        >
          <span>{language === 'en' ? text.switchLanguage : text.switchLanguageToEnglish}</span>
        </button>

      </aside>

      <section className="main-panel" id="dashboard">
        <div className="dashboard-content">
          {storageError && <p className="storage-warning" role="status">{text.storageWarning}</p>}
          <section className="welcome-row" aria-labelledby="page-title">
            <div>
              <h1 id="page-title">{text.appTitle} <span aria-hidden="true">✦</span></h1>
            </div>
              <div className="date-chip"><span aria-hidden="true">◷</span> {formattedDate}</div>
          </section>

          <section className="stats-grid" aria-label={text.allTasks}>
            <article className="stat-card stat-total">
              <span className="stat-icon" aria-hidden="true">▤</span>
              <p>{text.allTasksStat}</p><strong>{taskCounts.all}</strong><small>{text.inYourList}</small>
            </article>
            <article className="stat-card stat-progress">
              <span className="stat-icon" aria-hidden="true">◷</span>
              <p>{text.inProgress}</p><strong>{taskCounts.inProgress}</strong><small>{text.keepGoing}</small>
            </article>
            <article className="stat-card stat-done">
              <span className="stat-icon" aria-hidden="true">✓</span>
              <p>{text.done}</p><strong>{taskCounts.done}</strong><small>{text.oneStepForward}</small>
            </article>
          </section>

          <section className="create-card" aria-labelledby="create-title">
            <div className="section-heading">
              <div><span className="section-kicker">{text.getStarted}</span><h2 id="create-title">{text.addTask}</h2></div>
              <span className="create-sparkle" aria-hidden="true">✳</span>
            </div>
            <form className="task-form" onSubmit={handleAddTask} noValidate>
              <label className="field field-title">
                <span>{text.taskTitle}</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    if (titleError) setTitleError('')
                  }}
                  placeholder={text.titlePlaceholder}
                  maxLength={TITLE_MAX_LENGTH}
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={titleError ? 'title-error title-counter' : 'title-counter'}
                />
                {titleError && <small className="field-error" id="title-error" role="alert">{titleError}</small>}
                <small className="field-counter" id="title-counter">{title.length}/{TITLE_MAX_LENGTH}</small>
              </label>
              <label className="field field-description">
                <span>{text.description} <small>{text.optional}</small></span>
                <input
                  type="text"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={text.descriptionPlaceholder}
                  maxLength={DESCRIPTION_MAX_LENGTH}
                  aria-describedby="description-counter"
                />
                <small className="field-counter" id="description-counter">{description.length}/{DESCRIPTION_MAX_LENGTH}</small>
              </label>
              <button className="add-button" type="submit"><span aria-hidden="true">＋</span> {text.addTaskButton}</button>
            </form>
            {notice && <p className="form-notice" role="status">{notice}</p>}
          </section>

          <section className="task-section" id="tasks" aria-labelledby="tasks-title">
            <div className="task-section-heading">
              <div><span className="section-kicker">{text.taskList}</span><h2 id="tasks-title">{text.tasks} <span className="task-total">{taskCounts.all}</span></h2></div>
            </div>
            <div className="filter-row" aria-label={text.filters}>
              <button className={`filter-chip ${activeFilter === 'all' ? 'filter-active' : ''}`} type="button" aria-pressed={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>{text.allFilter} <span>{taskCounts.all}</span></button>
              <button className={`filter-chip ${activeFilter === 'todo' ? 'filter-active' : ''}`} type="button" aria-pressed={activeFilter === 'todo'} onClick={() => setActiveFilter('todo')}>{statusLabels[language].todo} <span>{taskCounts.todo}</span></button>
              <button className={`filter-chip ${activeFilter === 'in-progress' ? 'filter-active' : ''}`} type="button" aria-pressed={activeFilter === 'in-progress'} onClick={() => setActiveFilter('in-progress')}>{statusLabels[language]['in-progress']} <span>{taskCounts.inProgress}</span></button>
              <button className={`filter-chip ${activeFilter === 'done' ? 'filter-active' : ''}`} type="button" aria-pressed={activeFilter === 'done'} onClick={() => setActiveFilter('done')}>{statusLabels[language].done} <span>{taskCounts.done}</span></button>
            </div>

            <div className="task-list">
              {visibleTasks.length > 0 ? visibleTasks.map((task) => (
                <article className="task-card" key={task.id}>
                  <span className={`task-check task-check-${task.status}`} aria-hidden="true">{task.status === 'done' ? '✓' : ''}</span>
                  {editingTaskId === task.id ? (
                    <form className="edit-task-form" onSubmit={(event) => handleSaveEdit(event, task.id)}>
                      <label className="field">
                        <span>{text.taskTitle}</span>
                        <input value={editTitle} maxLength={TITLE_MAX_LENGTH} onChange={(event) => { setEditTitle(event.target.value); setEditError('') }} aria-invalid={Boolean(editError)} />
                      </label>
                      <label className="field">
                        <span>{text.description}</span>
                        <input value={editDescription} maxLength={DESCRIPTION_MAX_LENGTH} onChange={(event) => setEditDescription(event.target.value)} />
                      </label>
                      {editError && <small className="field-error" role="alert">{editError}</small>}
                      <div className="edit-actions">
                        <button className="edit-save-button" type="submit">{text.save}</button>
                        <button className="edit-cancel-button" type="button" onClick={handleCancelEdit}>{text.cancel}</button>
                      </div>
                    </form>
                  ) : (
                    <div className="task-copy"><h3>{task.title}</h3><p>{task.description}</p></div>
                  )}
                  <label className={`status-badge status-${task.status}`}>
                    <span className="sr-only">{text.status(task.title)}</span>
                    <select
                      className="status-select"
                      value={task.status}
                      aria-label={text.status(task.title)}
                      onChange={(event) => handleStatusChange(task.id, event.target.value as TaskStatus)}
                    >
                      <option value="todo">{statusLabels[language].todo}</option>
                      <option value="in-progress">{statusLabels[language]['in-progress']}</option>
                      <option value="done">{statusLabels[language].done}</option>
                    </select>
                  </label>
                  <span className="task-date">{getDueLabel(task.dueLabel, language)}</span>
                  {editingTaskId !== task.id && <div className="task-actions">
                    <button className="task-edit-button" type="button" aria-label={text.edit(task.title)} onClick={() => handleStartEdit(task)}>{language === 'en' ? 'Edit' : 'ویرایش'}</button>
                    <button className="task-delete-button" type="button" aria-label={text.delete(task.title)} title={text.delete(task.title)} onClick={() => handleDeleteTask(task)}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="m19 6-1 14H6L5 6" />
                        <path d="M10 11v5M14 11v5" />
                      </svg>
                    </button>
                  </div>}
                </article>
              )) : <p className="empty-state" role="status">{text.empty}</p>}
            </div>
            {activeFilter !== 'all' && <button className="see-all-button" type="button" onClick={() => setActiveFilter('all')}>{text.showAll} <span aria-hidden="true">←</span></button>}
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
