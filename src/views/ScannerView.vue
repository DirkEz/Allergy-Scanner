<template>
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
              class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200/30"
              :class="[
                'w-[min(18rem,80vw)]',
                'h-[min(11rem,38vw)]'
              ]"
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
            <div class="mt-1 text-xs leading-relaxed text-rose-200/80 break-words">{{ error }}</div>
          </div>

          <div v-else-if="product" class="space-y-3">
            <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
              <div class="text-xs text-slate-300">Product</div>
              <h2 class="mt-1 text-base font-semibold leading-snug text-slate-100 break-words">
                {{ product.product_name || 'Onbekend product' }}
              </h2>
              <div v-if="dataSource" class="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <font-awesome-icon icon="database" class="text-slate-400" />
                <span class="break-words">{{ dataSource }}</span>
              </div>
            </div>

            <div class="rounded-xl border p-3" :class="resultBoxClass">
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-2 text-xs text-slate-200/80">
                  <font-awesome-icon icon="clipboard-check" class="text-slate-200/70" />
                  Resultaat
                </div>

                <span
                  class="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                  :class="badgeClass"
                >
                  <span class="inline-block h-2 w-2 rounded-full" :class="dotClass"></span>
                  {{ badgeText }}
                </span>
              </div>

              <p class="mt-2 flex items-center gap-2 text-sm font-semibold" :class="resultTextClass">
                <font-awesome-icon :icon="resultIcon" :class="resultIconClass" />
                <span class="break-words">{{ statusText }}</span>
              </p>

              <div v-if="detailResult?.reasons?.length" class="mt-3 space-y-1 text-xs text-slate-200/90">
                <div v-for="(r, i) in detailResult.reasons" :key="i" class="flex gap-2">
                  <font-awesome-icon icon="circle-info" class="mt-0.5 text-slate-400" />
                  <span class="leading-relaxed break-words">{{ r }}</span>
                </div>

                <div v-if="detailResult?.matched?.length" class="pt-1 text-slate-400 break-words">
                  Gevonden: {{ detailResult.matched.join(', ') }}
                </div>
              </div>

              <div class="mt-3 rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2 text-xs text-slate-300 leading-relaxed">
                Bij twijfel altijd de verpakking controleren.
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
import { computed } from 'vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { useProductLookup } from '@/composables/useProductLookup'
import { useProductAi } from '@/composables/useProductAi'

const { aiLoading, aiError, aiText, generateAiSummary, clearAi } = useProductAi()


const { loading, product, error, dataSource, statusText, detailResult, fetchProductMulti, clearResult } = useProductLookup()

const { video, cameraState, lastBarcode, restartScanner } = useBarcodeScanner({
  onBarcode: async (code) => {
    await fetchProductMulti(code)
  }
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
  t = t.trim()
  return t
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

const resultLevel = computed(() => detailResult.value?.level || 'unknown')

const resultBoxClass = computed(() => {
  const lvl = resultLevel.value
  if (lvl === 'safe') return 'border-emerald-900/60 bg-emerald-950/30'
  if (lvl === 'unsafe') return 'border-rose-900/60 bg-rose-950/30'
  if (lvl === 'caution') return 'border-amber-900/60 bg-amber-950/30'
  if (lvl === 'unknown') return 'border-indigo-900/60 bg-indigo-950/30'
  return 'border-slate-800 bg-slate-950/40'
})

const resultTextClass = computed(() => {
  const lvl = resultLevel.value
  if (lvl === 'safe') return 'text-emerald-200'
  if (lvl === 'unsafe') return 'text-rose-200'
  if (lvl === 'caution') return 'text-amber-200'
  if (lvl === 'unknown') return 'text-indigo-200'
  return 'text-slate-200'
})

const resultIcon = computed(() => {
  const lvl = resultLevel.value
  if (lvl === 'safe') return 'circle-check'
  if (lvl === 'unsafe') return 'circle-xmark'
  if (lvl === 'caution') return 'triangle-exclamation'
  if (lvl === 'unknown') return 'circle-question'
  return 'circle-question'
})

const resultIconClass = computed(() => {
  const lvl = resultLevel.value
  if (lvl === 'safe') return 'text-emerald-200'
  if (lvl === 'unsafe') return 'text-rose-200'
  if (lvl === 'caution') return 'text-amber-200'
  if (lvl === 'unknown') return 'text-indigo-200'
  return 'text-slate-300'
})

const badgeText = computed(() => {
  const lvl = resultLevel.value
  if (lvl === 'safe') return 'Veilig'
  if (lvl === 'unsafe') return 'Niet veilig'
  if (lvl === 'caution') return 'Let op'
  if (lvl === 'unknown') return 'Onbekend'
  return 'Onbekend'
})

const badgeClass = computed(() => {
  const lvl = resultLevel.value
  if (lvl === 'safe') return 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
  if (lvl === 'unsafe') return 'border-rose-900/60 bg-rose-950/40 text-rose-200'
  if (lvl === 'caution') return 'border-amber-900/60 bg-amber-950/40 text-amber-200'
  if (lvl === 'unknown') return 'border-indigo-900/60 bg-indigo-950/40 text-indigo-200'
  return 'border-slate-700 bg-slate-950/40 text-slate-200'
})

const dotClass = computed(() => {
  const lvl = resultLevel.value
  if (lvl === 'safe') return 'bg-emerald-300'
  if (lvl === 'unsafe') return 'bg-rose-300'
  if (lvl === 'caution') return 'bg-amber-300'
  if (lvl === 'unknown') return 'bg-indigo-300'
  return 'bg-slate-300'
})
</script>
