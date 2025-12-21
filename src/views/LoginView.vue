<template>
  <div v-if="isOpen" class="fixed inset-0 z-[9999]">
    <button
      type="button"
      class="absolute inset-0 bg-black/70"
      @click="close()"
      aria-label="Sluiten"
    ></button>

    <div class="relative flex min-h-full items-end justify-center p-4 sm:items-center">
      <div
        class="pointer-events-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl"
        @click.stop
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-base font-semibold text-slate-100">Inloggen</div>
            <div class="mt-1 text-sm leading-relaxed text-slate-300">
              Log in om zelf producten toe te voegen en je instellingen te bewaren.
            </div>
          </div>

          <button
            type="button"
            class="rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-300 hover:bg-slate-950"
            @click="close()"
          >
            Sluiten
          </button>
        </div>

        <div v-if="user" class="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div class="text-xs text-slate-400">Ingelogd als</div>
          <div class="mt-1 break-words text-sm font-semibold text-slate-100">
            {{ user.name || user.email || 'Gebruiker' }}
          </div>

          <button
            type="button"
            class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-200 hover:bg-rose-950/40"
            :disabled="loading"
            @click="onLogout"
          >
            <font-awesome-icon icon="right-from-bracket" />
            Uitloggen
          </button>
        </div>

        <div v-else class="mt-4 space-y-3">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-950/60"
            :disabled="loading"
            @click="onGoogle"
          >
            <font-awesome-icon icon="brands fa-google" />
            Doorgaan met Google
          </button>

          <div v-if="error" class="rounded-xl border border-rose-900/50 bg-rose-950/20 p-3 text-xs text-rose-200 break-words">
            {{ error }}
          </div>

          <div class="text-xs text-slate-500 leading-relaxed">
            Door in te loggen ga je akkoord met het opslaan van je account-id om bijdragen te koppelen.
          </div>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 hover:bg-slate-950/60 sm:w-auto"
            @click="refreshMe"
          >
            <font-awesome-icon icon="arrows-rotate" />
            Status verversen
          </button>

          <button
            v-if="!user"
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-300 hover:bg-slate-950/60 sm:w-auto"
            @click="close()"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuth } from '@/composables/useAuth'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'logged-in'])

const { user, loading, fetchMe, loginWithGoogle, logout } = useAuth()

const isOpen = ref(Boolean(props.modelValue))
const error = ref('')

watch(
  () => props.modelValue,
  v => {
    isOpen.value = Boolean(v)
    if (isOpen.value) {
      error.value = ''
      fetchMe()
    }
  }
)

watch(isOpen, v => emit('update:modelValue', v))

watch(
  () => user.value,
  u => {
    if (u) emit('logged-in', u)
  }
)

function close() {
  isOpen.value = false
}

async function refreshMe() {
  error.value = ''
  try {
    await fetchMe()
  } catch {
    error.value = 'Kon login status niet ophalen'
  }
}

function onGoogle() {
  error.value = ''
  loginWithGoogle()
}

async function onLogout() {
  error.value = ''
  try {
    await logout()
  } catch {
    error.value = 'Uitloggen mislukt'
  }
}
</script>
