import { ref } from 'vue'

const user = ref(null)
const loading = ref(false)

const FRONTEND_URL =
  (import.meta.env.FRONTEND_URL || '').replace(/\/+$/, '') ||
  window.location.origin

async function fetchJson(path, options = {}) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 6000)

  try {
    const res = await fetch(`${FRONTEND_URL}${path}`, {
      credentials: 'include',
      ...options,
      signal: controller.signal
    })
    return res
  } finally {
    clearTimeout(t)
  }
}

export function useAuth() {
  async function fetchMe() {
    loading.value = true
    try {
      const res = await fetchJson('/api/me')
      if (!res.ok) {
        user.value = null
        return
      }
      const data = await res.json().catch(() => ({}))
      user.value = data?.user || null
    } catch {
      user.value = null
      throw new Error('ME_FAILED')
    } finally {
      loading.value = false
    }
  }

  function loginWithGoogle() {
    window.location.href = `${FRONTEND_URL}/auth/google`
  }

  async function logout() {
    await fetchJson('/api/logout', { method: 'POST' })
    user.value = null
  }

  return { user, loading, fetchMe, loginWithGoogle, logout }
}
