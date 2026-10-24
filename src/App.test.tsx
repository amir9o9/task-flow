import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const storageKey = 'taskflow.tasks.v1'

describe('TaskFlow dashboard', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows the starter tasks and their counts', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'طراحی صفحه ورود' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'مرتب‌سازی یادداشت‌های جلسه' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ساخت کامپوننت دکمه' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /کارها/ })).toHaveTextContent('3')
  })

  it('loads valid saved tasks instead of the starter tasks', () => {
    window.localStorage.setItem(storageKey, JSON.stringify([
      { id: 20, title: 'کار ذخیره‌شده', description: 'از نشست قبلی', status: 'todo', dueLabel: 'امروز' },
    ]))

    render(<App />)

    expect(screen.getByRole('heading', { name: 'کار ذخیره‌شده' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'طراحی صفحه ورود' })).not.toBeInTheDocument()
  })

  it('ignores malformed saved data and falls back to starter tasks', () => {
    window.localStorage.setItem(storageKey, '{not valid json')

    render(<App />)

    expect(screen.getByRole('heading', { name: 'طراحی صفحه ورود' })).toBeInTheDocument()
  })

  it('does not delete a task when the user cancels confirmation', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'حذف طراحی صفحه ورود' }))

    expect(screen.getByRole('heading', { name: 'طراحی صفحه ورود' })).toBeInTheDocument()
    expect(window.localStorage.getItem(storageKey)).toBeNull()
  })

  it('requires a non-empty title', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('مثلاً: آماده‌کردن طرح اولیه'), '   ')
    await user.click(screen.getByRole('button', { name: /افزودن کار/ }))

    expect(screen.getByRole('alert')).toHaveTextContent('عنوان کار را وارد کن.')
    expect(screen.queryByRole('heading', { name: '   ' })).not.toBeInTheDocument()
  })

  it('adds a task and persists it to local storage', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('مثلاً: آماده‌کردن طرح اولیه'), '  نوشتن تست  ')
    await user.type(screen.getByPlaceholderText('جزئیات کوتاه کار را بنویس...'), 'توضیح تست')
    await user.click(screen.getByRole('button', { name: /افزودن کار/ }))

    expect(screen.getByRole('heading', { name: 'نوشتن تست' })).toBeInTheDocument()
    expect(screen.getByText('توضیح تست')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')).toHaveLength(4)
  })

  it('changes task status and filters by that status', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'وضعیت طراحی صفحه ورود' }),
      'done',
    )
    await user.click(screen.getByRole('button', { name: /انجام‌شده/ }))

    expect(screen.getByRole('heading', { name: 'طراحی صفحه ورود' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'ساخت کامپوننت دکمه' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'مرتب‌سازی یادداشت‌های جلسه' })).not.toBeInTheDocument()
  })

  it('edits a task and saves the change', async () => {
    const user = userEvent.setup()
    render(<App />)
    const taskCard = screen.getByRole('heading', { name: 'طراحی صفحه ورود' }).closest('article')
    expect(taskCard).not.toBeNull()

    await user.click(within(taskCard as HTMLElement).getByRole('button', { name: 'ویرایش طراحی صفحه ورود' }))
    const titleInput = within(taskCard as HTMLElement).getByLabelText('عنوان کار')
    await user.clear(titleInput)
    await user.type(titleInput, 'صفحه ورود بازطراحی‌شده')
    await user.click(within(taskCard as HTMLElement).getByRole('button', { name: 'ذخیره' }))

    expect(screen.getByRole('heading', { name: 'صفحه ورود بازطراحی‌شده' })).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')[0].title).toBe('صفحه ورود بازطراحی‌شده')
  })

  it('asks before deleting and removes a confirmed task', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)

    await user.click(screen.getByRole('button', { name: 'حذف طراحی صفحه ورود' }))

    expect(window.confirm).toHaveBeenCalledOnce()
    expect(screen.queryByRole('heading', { name: 'طراحی صفحه ورود' })).not.toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')).toHaveLength(2)
  })
})
