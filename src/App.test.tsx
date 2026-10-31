import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const storageKey = 'task-flow.tasks.v1'
const legacyStorageKey = 'taskflow.tasks.v1'
const themeStorageKey = 'task-flow.theme.v1'
const languageStorageKey = 'task-flow.language.v1'
const sampleTasks = [
  { id: 1, title: 'طراحی صفحه ورود', description: 'نسخه موبایل و حالت خطای فرم را هم بررسی کن.', status: 'in-progress', dueLabel: 'امروز' },
  { id: 2, title: 'مرتب‌سازی یادداشت‌های جلسه', description: 'تصمیم‌ها را به کارهای قابل پیگیری تبدیل کن.', status: 'todo', dueLabel: 'فردا' },
  { id: 3, title: 'ساخت کامپوننت دکمه', description: 'حالت‌های اصلی و دسترس‌پذیری را کامل کن.', status: 'done', dueLabel: 'تکمیل‌شده' },
]

function saveSampleTasks() {
  window.localStorage.setItem(storageKey, JSON.stringify(sampleTasks))
}

describe('TaskFlow dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('starts without preloaded tasks', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'My Tasks' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /Tasks/ })).toHaveTextContent('0')
    expect(screen.getByRole('status')).toHaveTextContent('There are no tasks in this status yet.')
    expect(screen.queryByText('مرتب‌سازی: جدیدترین')).not.toBeInTheDocument()
    expect(screen.queryByText('یک روز تازه، یک شروع تازه')).not.toBeInTheDocument()
    expect(screen.queryByText('آرام و پیوسته پیش برو؛ داری عالی پیش می‌ری.')).not.toBeInTheDocument()
  })

  it('switches between light and dark themes and saves the preference', async () => {
    const user = userEvent.setup()
    render(<App />)

    const app = screen.getByRole('main')
    expect(app).toHaveAttribute('data-theme', 'light')
    await user.click(screen.getByRole('button', { name: 'Enable dark theme' }))

    expect(app).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Enable light theme' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem(themeStorageKey)).toBe('dark')
  })

  it('restores the saved theme preference on startup', () => {
    window.localStorage.setItem(themeStorageKey, 'dark')
    render(<App />)

    expect(screen.getByRole('main')).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Enable light theme' })).toBeInTheDocument()
  })

  it('defaults to English and allows switching to Persian', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('main')).toHaveAttribute('lang', 'en')
    expect(screen.getByRole('main')).toHaveAttribute('dir', 'ltr')
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    await user.click(screen.getByRole('button', { name: 'Switch to Persian' }))

    expect(screen.getByRole('heading', { level: 1, name: 'کارهای من' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('dir', 'rtl')
    expect(window.localStorage.getItem(languageStorageKey)).toBe('fa')
  })

  it('restores the saved language on startup', () => {
    window.localStorage.setItem(languageStorageKey, 'fa')
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: 'کارهای من' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'تغییر زبان به انگلیسی' })).toBeInTheDocument()
  })

  it('loads valid saved tasks instead of the starter tasks', () => {
    window.localStorage.setItem(storageKey, JSON.stringify([
      { id: 20, title: 'کار ذخیره‌شده', description: 'از نشست قبلی', status: 'todo', dueLabel: 'امروز' },
    ]))

    render(<App />)

    expect(screen.getByRole('heading', { name: 'کار ذخیره‌شده' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'طراحی صفحه ورود' })).not.toBeInTheDocument()
  })

  it('continues to load tasks saved with the previous storage key', () => {
    window.localStorage.setItem(legacyStorageKey, JSON.stringify([
      { id: 21, title: 'کار قدیمی', description: 'باید حفظ شود', status: 'todo', dueLabel: 'امروز' },
    ]))

    render(<App />)

    expect(screen.getByRole('heading', { name: 'کار قدیمی' })).toBeInTheDocument()
  })

  it('ignores malformed saved data and starts with an empty list', () => {
    window.localStorage.setItem(storageKey, '{not valid json')

    render(<App />)

    expect(screen.getByRole('status')).toHaveTextContent('There are no tasks in this status yet.')
  })

  it('does not delete a task when the user cancels confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    saveSampleTasks()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Delete طراحی صفحه ورود' }))

    expect(screen.getByRole('heading', { name: 'طراحی صفحه ورود' })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')).toHaveLength(3)
  })

  it('requires a non-empty title', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('e.g., Prepare the first draft'), '   ')
    await user.click(screen.getByRole('button', { name: /Add task/ }))

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a task title.')
    expect(screen.queryByRole('heading', { name: '   ' })).not.toBeInTheDocument()
  })

  it('adds a task and persists it to local storage', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('e.g., Prepare the first draft'), '  نوشتن تست  ')
    await user.type(screen.getByPlaceholderText('Add a short description...'), 'توضیح تست')
    await user.click(screen.getByRole('button', { name: /Add task/ }))

    expect(screen.getByRole('heading', { name: 'نوشتن تست' })).toBeInTheDocument()
    expect(screen.getByText('توضیح تست')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')).toHaveLength(1)
  })

  it('keeps the app usable and warns when local storage cannot save changes', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is unavailable', 'QuotaExceededError')
    })
    render(<App />)

    await user.type(screen.getByPlaceholderText('e.g., Prepare the first draft'), 'کار بدون ذخیره')
    await user.click(screen.getByRole('button', { name: /Add task/ }))

    expect(screen.getByRole('heading', { name: 'کار بدون ذخیره' })).toBeInTheDocument()
    expect(screen.getByText(/Browser storage is unavailable/)).toHaveAttribute('role', 'status')
  })

  it('changes task status and filters by that status', async () => {
    const user = userEvent.setup()
    saveSampleTasks()
    render(<App />)

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Status of طراحی صفحه ورود' }),
      'done',
    )
    await user.click(screen.getByRole('button', { name: /Completed/ }))

    expect(screen.getByRole('heading', { name: 'طراحی صفحه ورود' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ساخت کامپوننت دکمه' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'مرتب‌سازی یادداشت‌های جلسه' })).not.toBeInTheDocument()
  })

  it('edits a task and saves the change', async () => {
    const user = userEvent.setup()
    saveSampleTasks()
    render(<App />)
    const taskCard = screen.getByRole('heading', { name: 'طراحی صفحه ورود' }).closest('article')
    expect(taskCard).not.toBeNull()

    await user.click(within(taskCard as HTMLElement).getByRole('button', { name: 'Edit طراحی صفحه ورود' }))
    const titleInput = within(taskCard as HTMLElement).getByLabelText('Task title')
    await user.clear(titleInput)
    await user.type(titleInput, 'صفحه ورود بازطراحی‌شده')
    await user.click(within(taskCard as HTMLElement).getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('heading', { name: 'صفحه ورود بازطراحی‌شده' })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')[0].title).toBe('صفحه ورود بازطراحی‌شده')
  })

  it('asks before deleting and removes a confirmed task', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    saveSampleTasks()
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Delete طراحی صفحه ورود' }))

    expect(window.confirm).toHaveBeenCalledOnce()
    expect(screen.queryByRole('heading', { name: 'طراحی صفحه ورود' })).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')).toHaveLength(2)
  })
})
