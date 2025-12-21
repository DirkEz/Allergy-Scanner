import { ref } from 'vue'

const user = ref(null)
const loading = ref(false)

export function useAuth() {
  async function fetchMe() {
    loading.value = true
    try {
      const res = await fetch(`/api/me`, { credentials: 'include' })
      const data = await res.json()
      user.value = data?.user || null
    } finally {
      loading.value = false
    }
  }

  function loginWithGoogle() {
    window.location.href = `/auth/google`
  }

  async function logout() {
    await fetch(`/api/logout`, {
      method: 'POST',
      credentials: 'include'
    })
    user.value = null
  }

  return { user, loading, fetchMe, loginWithGoogle, logout }
}
