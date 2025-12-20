<template>
    <div class="min-h-dvh bg-slate-950 text-slate-100">
        <div class="mx-auto w-full max-w-xl px-4 py-6">
            <div class="mb-4">
                <h1 class="text-xl font-semibold tracking-tight">Barcode scanner</h1>
                <p class="mt-1 text-sm text-slate-300">
                    Richt de camera op de barcode. Werkt het niet? Check of je op https of localhost draait.
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
                    ></video>

                    <div class="pointer-events-none absolute inset-0">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent"></div>
                        <div class="absolute left-1/2 top-1/2 h-44 w-72 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200/30"></div>
                    </div>

                    <div class="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span class="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-200">
                            {{ cameraState }}
                        </span>

                        <span v-if="loading" class="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-200">
                            <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></span>
                            Laden
                        </span>

                        <span v-if="lastBarcode" class="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-200">
                            {{ lastBarcode }}
                        </span>
                    </div>
                </div>

                <div class="p-4">
                    <div v-if="error" class="rounded-xl border border-rose-900/50 bg-rose-950/30 p-3">
                        <div class="text-sm font-medium text-rose-200">Er ging iets mis</div>
                        <div class="mt-1 text-xs text-rose-200/80">{{ error }}</div>
                    </div>

                    <div v-else-if="product" class="space-y-3">
                        <div class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                            <div class="text-xs text-slate-300">Product</div>
                            <h2 class="mt-1 text-base font-semibold leading-snug">
                                {{ product.product_name || 'Onbekend product' }}
                            </h2>
                            <div v-if="dataSource" class="mt-1 text-xs text-slate-400">
                                Bron: {{ dataSource }}
                            </div>
                        </div>

                        <div
                            class="rounded-xl border p-3"
                            :class="[
                                statusText.includes('✅')
                                    ? 'border-emerald-900/60 bg-emerald-950/30'
                                    : statusText.includes('❌')
                                        ? 'border-rose-900/60 bg-rose-950/30'
                                        : 'border-amber-900/60 bg-amber-950/30'
                            ]"
                        >
                            <div class="text-xs text-slate-300">Resultaat</div>
                            <p
                                class="mt-1 text-sm font-medium"
                                :class="[
                                    statusText.includes('✅')
                                        ? 'text-emerald-200'
                                        : statusText.includes('❌')
                                            ? 'text-rose-200'
                                            : 'text-amber-200'
                                ]"
                            >
                                {{ statusText }}
                            </p>
                            <p class="mt-2 text-xs text-slate-300">
                                Bij twijfel altijd de verpakking controleren.
                            </p>
                        </div>
                    </div>

                    <div v-else class="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
                        <div class="text-sm font-medium">Klaar om te scannen</div>
                        <div class="mt-1 text-xs text-slate-300">
                            Zorg voor genoeg licht en houd de barcode stil binnen het kader.
                        </div>
                    </div>

                    <div class="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            class="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-950/60"
                            @click="restartScanner"
                        >
                            Herstart scanner
                        </button>

                        <button
                            type="button"
                            class="rounded-xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-200 hover:bg-slate-950/60"
                            @click="clearResult"
                        >
                            Wis resultaat
                        </button>
                    </div>
                </div>
            </div>

            <div class="mt-4 space-y-1 text-xs text-slate-400">
                <div>Tip: werkt de camera niet, check browser-permissies.</div>
                <div>Data via meerdere bronnen.</div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'

const video = ref(null)
const loading = ref(false)
const product = ref(null)
const error = ref(null)
const lastBarcode = ref('')
const cameraState = ref('Camera starten...')
const dataSource = ref('')

const reader = new BrowserMultiFormatReader()

let activeControls = null
let lastFetchedBarcode = ''
let lastFetchAt = 0

const statusText = computed(() => {
    if (!product.value) return ''

    const allergens = (product.value.allergens || '').toLowerCase()
    const labels = (product.value.labels || '').toLowerCase()

    if (labels.includes('gluten-free') || labels.includes('glutenvrij')) return '✅ Glutenvrij'
    if (allergens.includes('gluten')) return '❌ Bevat gluten'
    return '⚠️ Geen duidelijke informatie'
})

async function startScanner() {
    error.value = null
    cameraState.value = 'Camera toestemming vragen...'

    try {
        activeControls?.stop()
        activeControls = await reader.decodeFromConstraints(
            { video: { facingMode: { ideal: 'environment' } } },
            video.value,
            (result, err) => {
                if (result) {
                    const code = String(result.getText() || '').trim()
                    if (!code) return

                    lastBarcode.value = code
                    cameraState.value = 'Barcode gedetecteerd'
                    handleBarcode(code)
                } else if (err) {
                    cameraState.value = 'Zoeken naar barcode...'
                }
            }
        )

        cameraState.value = 'Zoeken naar barcode...'
    } catch {
        cameraState.value = 'Camera error'
        error.value = 'Camera kon niet starten. Draai op https of localhost en geef camera-permissie.'
    }
}

async function handleBarcode(code) {
    const now = Date.now()
    if (code === lastFetchedBarcode && now - lastFetchAt < 1500) return

    lastFetchedBarcode = code
    lastFetchAt = now
    await fetchProductMulti(code)
}

function normalizeOffProduct(p) {
    if (!p) return null
    const product_name = p.product_name || p.product_name_nl || p.generic_name || ''
    const allergens = p.allergens || p.allergens_tags?.join(',') || ''
    const labels = p.labels || p.labels_tags?.join(',') || ''
    const ingredients_text = p.ingredients_text || p.ingredients_text_nl || ''
    return { product_name, allergens, labels, ingredients_text, raw: p }
}

async function fetchJson(url, options) {
    const res = await fetch(url, options)
    if (!res.ok) throw new Error(String(res.status))
    return await res.json()
}

async function tryProvider(name, fn) {
    try {
        const out = await fn()
        if (!out) return null
        dataSource.value = name
        return out
    } catch {
        return null
    }
}

async function fetchProductMulti(barcode) {
    loading.value = true
    product.value = null
    error.value = null
    dataSource.value = ''

    const code = encodeURIComponent(barcode)

    const providers = [
        () =>
            tryProvider('Open Food Facts (v2 world)', async () => {
                const data = await fetchJson(`https://world.openfoodfacts.org/api/v2/product/${code}.json`)
                if (!data || data.status !== 1) return null
                return normalizeOffProduct(data.product)
            }),
        () =>
            tryProvider('Open Food Facts (v0 world)', async () => {
                const data = await fetchJson(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
                if (!data || data.status !== 1) return null
                return normalizeOffProduct(data.product)
            }),
        () =>
            tryProvider('Open Food Facts (v0 NL)', async () => {
                const data = await fetchJson(`https://nl.openfoodfacts.org/api/v0/product/${code}.json`)
                if (!data || data.status !== 1) return null
                return normalizeOffProduct(data.product)
            })
    ]

    const goUpcToken = import.meta.env.VITE_GO_UPC_TOKEN
    if (goUpcToken) {
        providers.push(() =>
            tryProvider('Go-UPC', async () => {
                const data = await fetchJson(`https://go-upc.com/api/v1/code/${code}`, {
                    headers: { Authorization: `Bearer ${goUpcToken}` }
                })
                const item = Array.isArray(data?.product) ? data.product[0] : null
                if (!item) return null
                const mapped = {
                    product_name: item.name || '',
                    allergens: '',
                    labels: '',
                    ingredients_text: item.ingredients || ''
                }
                return mapped
            })
        )
    }

    const barcodeLookupKey = import.meta.env.VITE_BARCODELOOKUP_KEY
    if (barcodeLookupKey) {
        providers.push(() =>
            tryProvider('Barcode Lookup', async () => {
                const data = await fetchJson(`https://api.barcodelookup.com/v3/products?barcode=${code}&key=${encodeURIComponent(barcodeLookupKey)}`)
                const item = Array.isArray(data?.products) ? data.products[0] : null
                if (!item) return null
                const mapped = {
                    product_name: item.title || item.product_name || '',
                    allergens: '',
                    labels: '',
                    ingredients_text: item.ingredients || ''
                }
                return mapped
            })
        )
    }

    let found = null
    for (const p of providers) {
        found = await p()
        if (found) break
    }

    if (!found) {
        error.value = 'Product niet gevonden in de beschikbare bronnen'
    } else {
        product.value = found
    }

    loading.value = false
}

function restartScanner() {
    lastBarcode.value = ''
    cameraState.value = 'Herstarten...'
    startScanner()
}

function clearResult() {
    product.value = null
    error.value = null
    lastBarcode.value = ''
    dataSource.value = ''
}

onMounted(() => {
    startScanner()
})

onUnmounted(() => {
    try {
        activeControls?.stop()
    } catch {}
    try {
        reader.reset()
    } catch {}
})
</script>
