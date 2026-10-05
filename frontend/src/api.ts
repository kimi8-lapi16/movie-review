export type Review = {
  id: number
  title: string
  watchedOn: string // YYYY-MM-DD
  rating: number
  body: string
  createdAt: string
  updatedAt: string
}

export type ReviewInput = Pick<Review, 'title' | 'watchedOn' | 'rating' | 'body'>

const TOKEN_KEY = 'movie-review-token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new ApiError(res.status, data.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  login: (password: string) => request<{ token: string }>('POST', '/api/login', { password }),
  me: () => request<{ admin: boolean }>('GET', '/api/me'),
  listReviews: (q = '') => request<Review[]>('GET', `/api/reviews?q=${encodeURIComponent(q)}`),
  getReview: (id: number) => request<Review>('GET', `/api/reviews/${id}`),
  createReview: (input: ReviewInput) => request<Review>('POST', '/api/reviews', input),
  updateReview: (id: number, input: ReviewInput) => request<Review>('PUT', `/api/reviews/${id}`, input),
  deleteReview: (id: number) => request<void>('DELETE', `/api/reviews/${id}`),
}
