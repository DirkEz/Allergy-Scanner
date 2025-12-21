<template>
  <div class="bg-slate-950 p-5">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-200 hover:bg-slate-950/60 sm:w-auto"
          @click="openModal()"
        >
          <font-awesome-icon icon="sliders" class="text-slate-300" />
          Instellingen
        </button>

        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-200 hover:bg-slate-950/60 sm:w-auto"
          @click="openLoginModal()"
        >
          <font-awesome-icon icon="user" class="text-slate-300" />
          {{ authUser ? 'Account' : 'Inloggen' }}
        </button>

        <span class="ml-0 text-center text-[11px] text-slate-500 sm:ml-2 md:text-left">
          {{ enabled ? 'Delen aan' : 'Delen uit' }}
        </span>
      </div>

      <div class="align-left flex items-center gap-3 sm:align-right sm:justify-end">
        <div v-if="authUser" class="text-xs text-slate-400 break-words">
          {{ authUser.name || authUser.email || 'Ingelogd' }}
        </div>
        <img v-if="authUser" :src="authUser.avatar || ''" alt="Avatar" class="h-10 w-10">
      </div>

    </div>
  </div>

  <div v-if="isLoginModalOpen" class="fixed inset-0 z-[9999]">
  <button
    type="button"
    class="absolute inset-0 bg-black/70"
    @click="closeLoginModal()"
  ></button>

  <div class="relative flex min-h-full items-end justify-center p-4 sm:items-center">
    <div
      class="pointer-events-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl"
      @click.stop
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-base font-semibold text-slate-100">
            {{ authUser ? 'Account' : 'Inloggen' }}
          </div>
          <div class="mt-1 text-sm leading-relaxed text-slate-300">
            {{ authUser
              ? 'Je bent ingelogd en kunt straks producten toevoegen.'
              : 'Log in met Google zodat je zelf items kunt toevoegen.' }}
          </div>
        </div>

        <button
          type="button"
          class="rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-300 hover:bg-slate-950"
          @click="closeLoginModal()"
        >
          Sluiten
        </button>
      </div>

      <div v-if="authError" class="mt-4 rounded-lg border border-rose-900/50 bg-rose-950/20 p-3 text-xs text-rose-200 break-words">
        {{ authError }}
      </div>

      <div v-if="authUser" class="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
        <div class="text-xs text-slate-400">Ingelogd als</div>
        <div class="mt-1 text-sm font-semibold text-slate-100 break-words">
          {{ authUser.name || authUser.email || 'Gebruiker' }}
        </div>

        <div class="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-950/60 sm:w-auto"
            :disabled="authLoading"
            @click="refreshMe()"
          >
            <font-awesome-icon icon="arrows-rotate" class="text-slate-300" />
            Verversen
          </button>

          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-sm text-rose-200 hover:bg-rose-950/40 sm:w-auto"
            :disabled="authLoading"
            @click="doLogout()"
          >
            <font-awesome-icon icon="right-from-bracket" />
            Uitloggen
          </button>
        </div>
      </div>

      <div v-else class="mt-4">
        <button
          type="button"
          class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-950/60"
          :disabled="loginBusy"
          @click="loginWithGoogleNow()"
        >
          <font-awesome-icon :icon="['fab','google']" />
          Doorgaan met Google
        </button>
        <div class="mt-3 text-xs leading-relaxed text-slate-500">
          Door in te loggen kun je zelf producten toevoegen en bewerken. Daarmee help je andere gebruikers en jezelf met het verfijnen van de data.
        </div>

        <div class="mt-3 text-xs leading-relaxed text-slate-500">
          Na het inloggen kom je automatisch terug op deze pagina.
        </div>
      </div>
    </div>
  </div>
</div>


  <div v-if="isModalOpen" class="fixed inset-0 z-[9999]">
    <button
      type="button"
      class="absolute inset-0 bg-black/70"
      @click="closeModal()"
    ></button>

    <div class="relative flex min-h-full items-end justify-center p-4 sm:items-center">
      <div
        class="pointer-events-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl"
        @click.stop
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-base font-semibold text-slate-100">Logs delen?</div>
            <div class="mt-1 text-sm leading-relaxed text-slate-300">
              Om de scanner te verbeteren kan je anonieme gebruikslogs delen (zoals: camera gestart, barcode gevonden, API bron gekozen, fouten).
              Geen naam, account of exacte barcode.
            </div>
          </div>

          <button
            type="button"
            class="rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1 text-xs text-slate-300 hover:bg-slate-950"
            @click="closeModal()"
          >
            Sluiten
          </button>
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-950/40 sm:w-auto"
            @click="setConsent('yes')"
          >
            <font-awesome-icon icon="circle-check" />
            Ja, delen
          </button>

          <button
            type="button"
            class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-800/60 bg-rose-950/30 px-3 py-2 text-sm text-slate-200 hover:bg-rose-950/40 sm:w-auto"
            @click="setConsent('no')"
          >
            <font-awesome-icon icon="circle-xmark" />
            Nee
          </button>
        </div>

        <div class="mt-3 text-xs leading-relaxed text-slate-500">
          Je kunt dit later aanpassen via “Instelling”.
        </div>

        <div class="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2 text-xs text-slate-300">
              <font-awesome-icon icon="shield-heart" class="text-slate-300" />
              Standaard allergie
            </div>
            <span class="text-[11px] text-slate-500">Primair</span>
          </div>

          <div class="mt-3">
            <label class="block text-xs text-slate-400">Kies jouw standaard check</label>
            <select
              class="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-slate-600"
              :value="primaryAllergenKey"
              @change="setPrimaryAllergen(($event.target).value)"
            >
              <option
                class="rounded-xl bg-slate-900"
                v-for="o in ALLERGEN_OPTIONS"
                :key="o.key"
                :value="o.key"
              >
                {{ o.label }}
              </option>
            </select>

            <div class="mt-2 text-xs leading-relaxed text-slate-500">
              Het bovenste resultaatblok toont deze allergie als hoofdcheck.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="min-h-[100svh] bg-slate-950 text-slate-100">
    <div class="mx-auto w-full max-w-xl px-4 py-5 sm:py-6">
      <div class="mb-4">
        <h1 class="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <font-awesome-icon icon="barcode" class="text-slate-200" />
          Barcode scanner
        </h1>
        <p class="mt-1 text-sm text-slate-300">
          Richt de camera op de barcode.
        </p>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
        <div class="relative">
          <video
            ref="video"
            class="aspect-video w-full bg-black object-cover"
            autoplay
            muted
            playsinline
            webkit-playsinline
            preload="metadata"
          ></video>

          <div class="pointer-events-none absolute inset-0">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>

            <div
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200/30 w-[min(18rem,80vw)] h-[min(11rem,38vw)]"
            ></div>
          </div>

          <div class="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-2 sm:left-3 sm:top-3">
            <span class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-200">
              <font-awesome-icon icon="camera" class="text-slate-300" />
              <span class="truncate">{{ cameraState }}</span>
            </span>

            <span
              v-if="loading"
              class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-200"
            >
              <font-awesome-icon icon="circle-notch" spin class="text-slate-300" />
              Laden
            </span>

            <span
              v-if="lastBarcode"
              class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-200"
            >
              <font-awesome-icon icon="hashtag" class="text-slate-300" />
              <span class="break-all">{{ lastBarcode }}</span>
            </span>
          </div>
        </div>

        <div class="p-4">
          <div
            v-if="cameraState === 'Camera error'"
            class="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3"
          >
            <div class="flex items-center gap-2 text-sm font-medium text-rose-200">
              <font-awesome-icon icon="triangle-exclamation" class="text-rose-200" />
              Er ging iets mis
            </div>
            <div class="mt-1 text-xs leading-relaxed text-rose-200/80">
              Camera kon niet starten. Draai op https of localhost en geef camera-permissie.
            </div>
          </div>

          <div
            v-else-if="error"
            class="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3"
          >
            <div class="flex items-center gap-2 text-sm font-medium text-rose-200">
              <font-awesome-icon icon="triangle-exclamation" class="text-rose-200" />
              Er ging iets mis
            </div>
            <div class="mt-1 break-words text-xs leading-relaxed text-rose-200/80">{{ error }}</div>
          </div>

          <div v-else-if="product" class="space-y-3">
            <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div class="text-xs text-slate-300">Product</div>
              <h2 class="mt-1 break-words text-base font-semibold leading-snug text-slate-100">
                {{ product.product_name || 'Onbekend product' }}
              </h2>
              <div v-if="dataSource" class="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <font-awesome-icon icon="database" class="text-slate-400" />
                <span class="break-words">{{ dataSource }}</span>
              </div>
            </div>

            <div class="rounded-xl border p-3" :class="primaryBoxClass">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-xs text-slate-200/80">
                  <font-awesome-icon icon="clipboard-check" class="text-slate-200/70" />
                  Resultaat ({{ primaryAllergenName }})
                </div>

                <span
                  class="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  :class="primaryBadgeClass"
                >
                  <span class="inline-block h-2 w-2 rounded-full" :class="primaryDotClass"></span>
                  {{ levelLabel(primaryLevel) }}
                </span>
              </div>

              <p class="mt-2 flex items-center gap-2 text-sm font-semibold" :class="primaryTextClass">
                <font-awesome-icon :icon="primaryIcon" :class="primaryIconClass" />
                <span class="break-words">{{ primaryTitle }}</span>
              </p>

              <div v-if="primaryReasons.length" class="mt-3 space-y-1 text-xs text-slate-200/90">
                <div v-for="(r, i) in primaryReasons" :key="i" class="flex gap-2">
                  <font-awesome-icon icon="circle-info" class="mt-0.5 text-slate-400" />
                  <span class="break-words leading-relaxed">{{ r }}</span>
                </div>

                <div v-if="primaryMatched.length" class="pt-1 text-slate-400 break-words">
                  Gevonden: {{ primaryMatched.join(', ') }}
                </div>
              </div>

              <div class="mt-3 rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs text-slate-300 leading-relaxed">
                Bij twijfel altijd de verpakking controleren.
              </div>
            </div>

            <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-xs text-slate-300">
                  <font-awesome-icon icon="shield-heart" class="text-slate-300" />
                  Allergenen check
                </div>

                <span class="text-[11px] text-slate-500">
                  Per allergeen
                </span>
              </div>

              <div v-if="allergenResults?.length" class="mt-3 space-y-2">
                <div
                  v-for="a in allergenResults"
                  :key="a.key"
                  class="rounded-xl border border-slate-800 bg-slate-950/30 p-3"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="text-xs text-slate-300">{{ a.name }}</div>
                      <div class="mt-1 text-sm font-semibold break-words" :class="levelTextClass(a.level)">
                        {{ a.title }}
                      </div>
                    </div>

                    <span
                      class="shrink-0 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                      :class="levelBadgeClass(a.level)"
                    >
                      <span class="inline-block h-2 w-2 rounded-full" :class="levelDotClass(a.level)"></span>
                      {{ levelLabel(a.level) }}
                    </span>
                  </div>

                  <div v-if="a.reasons?.length" class="mt-2 space-y-1 text-xs text-slate-300">
                    <div v-for="(r, idx) in a.reasons" :key="idx" class="flex gap-2">
                      <font-awesome-icon icon="circle-info" class="mt-0.5 text-slate-500" />
                      <span class="leading-relaxed break-words">{{ r }}</span>
                    </div>
                  </div>

                  <div v-if="a.matched?.length" class="mt-2 text-xs text-slate-500 break-words">
                    Gevonden: {{ a.matched.join(', ') }}
                  </div>
                </div>
              </div>

              <div v-else class="mt-2 text-xs text-slate-500 leading-relaxed">
                Geen allergenen-informatie beschikbaar.
              </div>
            </div>

            <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-xs text-slate-300">
                  <font-awesome-icon icon="wand-magic-sparkles" class="text-slate-400" />
                  AI uitleg
                </div>

                <span class="inline-flex items-center gap-2 rounded-full border border-gray-700 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                  <span class="inline-block h-2 w-2 rounded-full bg-gray-700"></span>
                  Coming Soon
                </span>
              </div>

              <div class="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-400 cursor-not-allowed sm:w-auto"
                >
                  <font-awesome-icon icon="wand-magic-sparkles" />
                  Genereer
                </button>

                <button
                  type="button"
                  disabled
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs text-slate-500 cursor-not-allowed sm:w-auto"
                >
                  <font-awesome-icon icon="broom" />
                  Wis
                </button>
              </div>

              <div class="mt-2 text-xs text-slate-500 leading-relaxed">
                AI-uitleg wordt binnenkort toegevoegd.
              </div>
            </div>

            <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div class="flex items-center gap-2 text-xs text-slate-300">
                <font-awesome-icon icon="list" class="text-slate-300" />
                Ingrediënten
              </div>

              <div v-if="ingredientsList.length" class="mt-2">
                <ul class="space-y-2">
                  <li
                    v-for="(ing, idx) in ingredientsList"
                    :key="idx"
                    class="flex items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs text-slate-200"
                  >
                    <font-awesome-icon icon="leaf" class="mt-0.5 text-emerald-300/80" />
                    <span class="leading-relaxed break-words">{{ ing }}</span>
                  </li>
                </ul>
              </div>

              <div v-else class="mt-2 text-xs text-slate-400">
                Geen ingrediënten gevonden.
              </div>
            </div>
          </div>

          <div v-else class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div class="flex items-center gap-2 text-sm font-medium text-slate-100">
              <font-awesome-icon icon="crosshairs" class="text-slate-200" />
              Klaar om te scannen
            </div>
            <div class="mt-1 text-xs text-slate-300 leading-relaxed">
              Zorg voor genoeg licht en houd de barcode stil binnen het kader.
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-950/60 sm:w-auto"
              @click="restartScanner"
            >
              <font-awesome-icon icon="rotate-right" class="text-slate-300" />
              Herstart scanner
            </button>

            <button
              type="button"
              class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-950/60 sm:w-auto"
              @click="clearResult"
            >
              <font-awesome-icon icon="broom" class="text-slate-300" />
              Wis resultaat
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 space-y-1 text-xs text-slate-400">
        <div class="flex items-center gap-2">
          <font-awesome-icon icon="lightbulb" class="text-amber-200/90" />
          Tip: check browser-permissies bij camerafouten.
        </div>
        <div class="flex items-center gap-2">
          <font-awesome-icon icon="database" class="text-slate-400" />
          Data via meerdere bronnen.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { useProductLookup } from '@/composables/useProductLookup'
import { useProductAi } from '@/composables/useProductAi'
import { useAuth } from '@/composables/useAuth'

onMounted(async () => {
  const url = new URL(window.location.href)
  const login = url.searchParams.get('login')
  if (login === 'ok') {
    await fetchMe()
    url.searchParams.delete('login')
    window.history.replaceState({}, '', url.toString())
  } else {
    await fetchMe()
  }
})

const isLoginModalOpen = ref(false)
const authError = ref('')

const { user: authUserRef, loading: authLoadingRef, fetchMe, loginWithGoogle, logout } = useAuth()

const authUser = computed(() => authUserRef.value)
const authLoading = computed(() => authLoadingRef.value)

async function openLoginModal() {
  isLoginModalOpen.value = true
  authError.value = ''
  try {
    await fetchMe()
  } catch {
    authError.value = 'Kon login status niet ophalen'
  }
}

function closeLoginModal() {
  isLoginModalOpen.value = false
}

async function refreshMe() {
  authError.value = ''
  try {
    await fetchMe()
  } catch {
    authError.value = 'Kon login status niet ophalen'
  }
}

const loginBusy = ref(false)

function loginWithGoogleNow() {
  authError.value = ''
  loginBusy.value = true
  loginWithGoogle()
}

async function doLogout() {
  authError.value = ''
  try {
    await logout()
  } catch {
    authError.value = 'Uitloggen mislukt'
  }
}


const CONSENT_KEY = 'gf_scanner_telemetry_consent'
const SESSION_KEY = 'gf_scanner_session_id'
const PRIMARY_ALLERGEN_KEY = 'gf_scanner_primary_allergen'

const ALLERGEN_OPTIONS = [
  { key: 'gluten', label: 'Gluten' },
  { key: 'milk', label: 'Melk / lactose' },
  { key: 'egg', label: 'Ei' },
  { key: 'peanuts', label: 'Pinda' },
  { key: 'nuts', label: 'Noten' },
  { key: 'soy', label: 'Soja' },
  { key: 'sesame', label: 'Sesam' },
  { key: 'fish', label: 'Vis' },
  { key: 'crustaceans', label: 'Schaaldieren' },
  { key: 'molluscs', label: 'Weekdieren' },
  { key: 'celery', label: 'Selderij' },
  { key: 'mustard', label: 'Mosterd' },
  { key: 'lupin', label: 'Lupine' },
  { key: 'sulphites', label: 'Sulfieten' }
]

const primaryAllergenKey = ref(localStorage.getItem(PRIMARY_ALLERGEN_KEY) || 'gluten')

function setPrimaryAllergen(key) {
  const v = String(key || '').trim() || 'gluten'
  primaryAllergenKey.value = v
  localStorage.setItem(PRIMARY_ALLERGEN_KEY, v)
  if (enabled.value) track('primary_allergen_set', { key: v, at: nowIso() })
}

const primaryAllergenName = computed(() => {
  const hit = ALLERGEN_OPTIONS.find(o => o.key === primaryAllergenKey.value)
  return hit?.label || 'Gluten'
})

const lastSentIndex = ref(0)
const lastSentBarcode = ref('')
const lastSentAt = ref(0)

function isNewScan(code) {
  const now = Date.now()
  const normalized = String(code || '').trim()
  if (!normalized) return false
  if (normalized === lastSentBarcode.value && now - lastSentAt.value < 15000) return false
  lastSentBarcode.value = normalized
  lastSentAt.value = now
  return true
}

async function sendNewEvents(endpoint = '/api/telemetry') {
  if (!enabled.value) return { ok: false, reason: 'consent_disabled' }
  if (sending.value) return { ok: false, reason: 'already_sending' }
  if (events.value.length <= lastSentIndex.value) return { ok: false, reason: 'no_new_events' }

  sending.value = true
  lastSendError.value = ''

  const slice = events.value.slice(lastSentIndex.value)

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sentAt: nowIso(),
        app: 'gluten-free-scanner',
        sessionId: getSessionId(),
        events: slice
      })
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      lastSendError.value = text || `HTTP ${res.status}`
      return { ok: false, reason: 'bad_response' }
    }

    lastSentIndex.value = events.value.length
    return { ok: true }
  } catch (e) {
    lastSendError.value = e?.message || 'Network error'
    return { ok: false, reason: 'network' }
  } finally {
    sending.value = false
  }
}

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const id = randomId()
  localStorage.setItem(SESSION_KEY, id)
  return id
}

function nowIso() {
  return new Date().toISOString()
}

function safeString(v, max = 180) {
  const s = String(v ?? '')
  return s.length > max ? `${s.slice(0, max)}…` : s
}

function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const out = Array.isArray(payload) ? [] : {}
  for (const [k, v] of Object.entries(payload)) {
    const key = String(k || '').toLowerCase()
    if (key.includes('token') || key.includes('apikey') || key.includes('authorization')) continue
    if (typeof v === 'string') out[k] = safeString(v, 300)
    else if (typeof v === 'number' || typeof v === 'boolean' || v === null) out[k] = v
    else if (typeof v === 'object') out[k] = sanitizePayload(v)
  }
  return out
}

function shortenBarcode(code) {
  const s = String(code || '').trim()
  if (!s) return ''
  if (s.length <= 6) return s
  return `${s.slice(0, 2)}…${s.slice(-2)}`
}

const consent = ref(localStorage.getItem(CONSENT_KEY) || 'unknown')
const isModalOpen = ref(consent.value === 'unknown')
const events = ref([])
const lastSendError = ref('')
const sending = ref(false)

const enabled = computed(() => consent.value === 'yes')

function setConsent(value) {
  consent.value = value
  localStorage.setItem(CONSENT_KEY, value)
  isModalOpen.value = false
  if (value === 'yes') track('consent_granted', { at: nowIso() })
  else track('consent_denied', { at: nowIso() })
}

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  if (consent.value === 'unknown') {
    consent.value = 'no'
    localStorage.setItem(CONSENT_KEY, 'no')
  }
}

function clearLogs() {
  events.value = []
}

function track(name, payload = {}) {
  if (!enabled.value) return
  const sessionId = getSessionId()
  events.value.push({
    t: nowIso(),
    name: safeString(name, 80),
    sessionId,
    payload: sanitizePayload(payload)
  })
  if (events.value.length > 400) events.value.splice(0, events.value.length - 400)
}

function trackBarcodeDetected(code) {
  track('barcode_detected', { code: shortenBarcode(code) })
}

const { aiLoading, aiError, aiText, generateAiSummary, clearAi } = useProductAi()
const { loading, product, error, dataSource, statusText, detailResult, allergenResults, fetchProductMulti, clearResult } = useProductLookup()

const primaryResult = computed(() => {
  const list = Array.isArray(allergenResults?.value) ? allergenResults.value : []
  const hit = list.find(x => String(x?.key || '') === String(primaryAllergenKey.value))
  if (hit) return hit
  if (String(primaryAllergenKey.value) === 'gluten') {
    const dr = detailResult?.value || {}
    return {
      key: 'gluten',
      name: 'Gluten',
      level: dr.level || 'unknown',
      title: dr.title || statusText.value || '',
      reasons: Array.isArray(dr.reasons) ? dr.reasons : [],
      matched: Array.isArray(dr.matched) ? dr.matched : []
    }
  }
  return { key: primaryAllergenKey.value, name: primaryAllergenName.value, level: 'unknown', title: 'Onbekend', reasons: [], matched: [] }
})

const primaryLevel = computed(() => primaryResult.value?.level || 'unknown')
const primaryTitle = computed(() => primaryResult.value?.title || '')
const primaryReasons = computed(() => (Array.isArray(primaryResult.value?.reasons) ? primaryResult.value.reasons : []))
const primaryMatched = computed(() => (Array.isArray(primaryResult.value?.matched) ? primaryResult.value.matched : []))

const primaryBoxClass = computed(() => {
  const lvl = primaryLevel.value
  if (lvl === 'safe') return 'border-emerald-900/60 bg-emerald-950/30'
  if (lvl === 'unsafe') return 'border-rose-900/60 bg-rose-950/30'
  if (lvl === 'caution') return 'border-amber-900/60 bg-amber-950/30'
  if (lvl === 'unknown') return 'border-indigo-900/60 bg-indigo-950/30'
  return 'border-slate-800 bg-slate-950/40'
})

const primaryTextClass = computed(() => {
  const lvl = primaryLevel.value
  if (lvl === 'safe') return 'text-emerald-200'
  if (lvl === 'unsafe') return 'text-rose-200'
  if (lvl === 'caution') return 'text-amber-200'
  if (lvl === 'unknown') return 'text-indigo-200'
  return 'text-slate-200'
})

const primaryIcon = computed(() => {
  const lvl = primaryLevel.value
  if (lvl === 'safe') return 'circle-check'
  if (lvl === 'unsafe') return 'circle-xmark'
  if (lvl === 'caution') return 'triangle-exclamation'
  return 'circle-question'
})

const primaryIconClass = computed(() => {
  const lvl = primaryLevel.value
  if (lvl === 'safe') return 'text-emerald-200'
  if (lvl === 'unsafe') return 'text-rose-200'
  if (lvl === 'caution') return 'text-amber-200'
  return 'text-indigo-200'
})

const primaryBadgeClass = computed(() => {
  const lvl = primaryLevel.value
  if (lvl === 'safe') return 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
  if (lvl === 'unsafe') return 'border-rose-900/60 bg-rose-950/40 text-rose-200'
  if (lvl === 'caution') return 'border-amber-900/60 bg-amber-950/40 text-amber-200'
  return 'border-indigo-900/60 bg-indigo-950/40 text-indigo-200'
})

const primaryDotClass = computed(() => {
  const lvl = primaryLevel.value
  if (lvl === 'safe') return 'bg-emerald-300'
  if (lvl === 'unsafe') return 'bg-rose-300'
  if (lvl === 'caution') return 'bg-amber-300'
  return 'bg-indigo-300'
})

const { video, cameraState, lastBarcode, restartScanner } = useBarcodeScanner({
  onBarcode: async (code) => {
    if (!isNewScan(code)) return

    trackBarcodeDetected(code)
    track('lookup_start', { codeLength: String(code || '').length })

    await fetchProductMulti(code)

    track('lookup_done', { ok: Boolean(product.value), hasError: Boolean(error.value) })
    await sendNewEvents('/api/telemetry')
  }
})

watch(product, (p) => {
  if (!p) return
  track('product_loaded', { source: dataSource.value || '', hasIngredients: Boolean(p.ingredients_text) })
})

watch(error, (e) => {
  if (!e) return
  track('product_error', { message: String(e) })
})

function cleanIngredientsText(input) {
  let s = String(input || '').replace(/\s+/g, ' ').trim()
  if (!s) return ''

  s = s.replace(/^\s*(ingredients?|ingrediënten|ingredienten)\s*[:\-]\s*/i, '')
  const idx = s.search(/\bingredients?\b\s*[:\-]|\bingrediënten\b\s*[:\-]|\bingredienten\b\s*[:\-]/i)
  if (idx > 0 && idx < 40) {
    s = s.slice(idx).replace(/^\s*(ingredients?|ingrediënten|ingredienten)\s*[:\-]\s*/i, '')
  }

  s = s.replace(/[•·]/g, ',')
  s = s.replace(/\s*,\s*/g, ', ')
  return s.trim()
}

function splitOutsideParens(input) {
  const s = String(input || '')
  const out = []
  let buf = ''
  let depth = 0

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (ch === '(') depth++
    if (ch === ')') depth = Math.max(0, depth - 1)

    const isSep = (ch === ',' || ch === ';') && depth === 0
    if (isSep) {
      const t = buf.trim()
      if (t) out.push(t)
      buf = ''
      continue
    }
    buf += ch
  }

  const last = buf.trim()
  if (last) out.push(last)
  return out
}

function normalizeItem(s) {
  let t = String(s || '').trim()
  if (!t) return ''
  t = t.replace(/\s+/g, ' ')
  t = t.replace(/^[\-–—]\s*/, '')
  t = t.replace(/\s*\.+\s*$/g, '')
  t = t.replace(/\s{2,}/g, ' ')
  t = t.replace(/\s*\(\s*/g, ' (')
  t = t.replace(/\s*\)\s*/g, ')')
  t = t.replace(/\s*:\s*/g, ': ')
  return t.trim()
}

function dedupeKeepOrder(list) {
  const seen = new Set()
  const out = []
  for (const x of list) {
    const key = x.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(x)
  }
  return out
}

const ingredientsList = computed(() => {
  if (!product.value) return []

  const raw =
    product.value.ingredients_text ||
    product.value.ingredients ||
    product.value.ingredients_text_nl ||
    product.value.ingredients_text_en ||
    ''

  const cleaned = cleanIngredientsText(raw)
  if (!cleaned) return []

  const parts = splitOutsideParens(cleaned)
    .map(normalizeItem)
    .filter(Boolean)

  const filtered = parts.filter(x => !/^(allerg(en|enen)|may contain|kan sporen bevatten|sporen van)\b/i.test(x))

  return dedupeKeepOrder(filtered).slice(0, 80)
})

function levelLabel(level) {
  if (level === 'safe') return 'Veilig'
  if (level === 'unsafe') return 'Niet veilig'
  if (level === 'caution') return 'Let op'
  return 'Onbekend'
}

function levelBadgeClass(level) {
  if (level === 'safe') return 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
  if (level === 'unsafe') return 'border-rose-900/60 bg-rose-950/40 text-rose-200'
  if (level === 'caution') return 'border-amber-900/60 bg-amber-950/40 text-amber-200'
  return 'border-indigo-900/60 bg-indigo-950/40 text-indigo-200'
}

function levelDotClass(level) {
  if (level === 'safe') return 'bg-emerald-300'
  if (level === 'unsafe') return 'bg-rose-300'
  if (level === 'caution') return 'bg-amber-300'
  return 'bg-indigo-300'
}

function levelTextClass(level) {
  if (level === 'safe') return 'text-emerald-200'
  if (level === 'unsafe') return 'text-rose-200'
  if (level === 'caution') return 'text-amber-200'
  return 'text-indigo-200'
}
</script>
