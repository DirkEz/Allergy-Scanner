import { computed, ref } from 'vue'

export function useProductLookup() {
    const loading = ref(false)
    const product = ref(null)
    const error = ref(null)
    const dataSource = ref('')

    function normalizeText(v) {
        return String(v || '').toLowerCase()
    }

    function splitList(v) {
        return normalizeText(v)
            .split(/[,;|]/g)
            .map(s => s.trim())
            .filter(Boolean)
    }

    function getAllergenText(p) {
        const a1 = normalizeText(p?.allergens)
        const a2 = Array.isArray(p?.allergens_tags) ? p.allergens_tags.map(x => String(x || '')).join(',') : ''
        return [a1, normalizeText(a2)].filter(Boolean).join(',')
    }

    function getLabelText(p) {
        const l1 = normalizeText(p?.labels)
        const l2 = Array.isArray(p?.labels_tags) ? p.labels_tags.map(x => String(x || '')).join(',') : ''
        return [l1, normalizeText(l2)].filter(Boolean).join(',')
    }

    function getIngredientText(p) {
        return [
            normalizeText(p?.ingredients_text),
            normalizeText(p?.ingredients_text_nl),
            normalizeText(p?.ingredients_text_en)
        ].filter(Boolean).join(' ')
    }

    function hasGlutenFreeLabel(labelText) {
        const labels = labelText
        const patterns = [
            'gluten-free',
            'glutenvrij',
            'sans gluten',
            'senza glutine'
        ]
        return patterns.some(x => labels.includes(x))
    }

    function containsGlutenAllergen(allergenText) {
        return allergenText.includes('gluten')
    }

    function mayContainGluten(allergenText, ingredientText) {
        const txt = `${allergenText} ${ingredientText}`

        const patterns = [
            'kan sporen bevatten van gluten',
            'kan sporen bevatten',
            'may contain',
            'traces of',
            'sporen van',
            'verwerkt in een fabriek waar',
            'geproduceerd in een fabriek waar'
        ]

        const glutenRefs = [
            'gluten',
            'tarwe',
            'wheat',
            'gerst',
            'barley',
            'rogge',
            'rye'
        ]

        const hasMayContain = patterns.some(p => txt.includes(p))
        const hasGlutenRef = glutenRefs.some(g => txt.includes(g))

        return hasMayContain && hasGlutenRef
    }

    function ingredientsSuggestGluten(ingredientText) {
        const txt = ingredientText

        const strong = [
            'tarwe',
            'wheat',
            'gerst',
            'barley',
            'rogge',
            'rye',
            'spelt',
            'spelta',
            'farro',
            'kamut',
            'bulgur',
            'couscous',
            'seitan',
            'mout',
            'malt',
            'mout-extract',
            'moutextract',
            'tarwebloem',
            'wheat flour',
            'paneermeel',
            'breadcrumbs'
        ]

        const hits = strong.filter(w => txt.includes(w))
        return hits
    }

    const detailResult = computed(() => {
    if (!product.value) {
        return { level: 'unknown', title: '', reasons: [], matched: [] }
    }

    const p = product.value
    const allergenText = getAllergenText(p)
    const labelText = getLabelText(p)
    const ingredientText = getIngredientText(p)

    const reasons = []
    const matched = []

    if (hasGlutenFreeLabel(labelText)) {
        reasons.push('Glutenvrij-label gevonden')
        matched.push('label: glutenvrij')
        return { level: 'safe', title: 'Glutenvrij (label bevestigd)', reasons, matched }
    }

    if (containsGlutenAllergen(allergenText)) {
        reasons.push('Allergeen “gluten” staat vermeld')
        matched.push('allergenen: gluten')
        return { level: 'unsafe', title: 'Bevat gluten (allergeen)', reasons, matched }
    }

    if (mayContainGluten(allergenText, ingredientText)) {
        reasons.push('Waarschuwing voor sporen / kruisbesmetting met gluten')
        matched.push('sporen/may contain')
        return { level: 'caution', title: 'Kan gluten bevatten (sporen)', reasons, matched }
    }

    const ingHits = ingredientsSuggestGluten(ingredientText)
    if (ingHits.length) {
        reasons.push('Ingrediënten bevatten gluten-verdachte termen')
        matched.push(...ingHits.slice(0, 6))
        return { level: 'caution', title: 'Waarschijnlijk gluten (ingrediënten)', reasons, matched }
    }

    if (ingredientText.length < 10 && allergenText.length < 3 && labelText.length < 3) {
        reasons.push('Te weinig productinformatie aanwezig')
        return { level: 'unknown', title: 'Onvoldoende informatie', reasons, matched }
    }

    reasons.push('Geen duidelijke gluten-info gevonden')
    return { level: 'unknown', title: 'Geen duidelijke informatie', reasons, matched }
})

const statusText = computed(() => detailResult.value.title)


    function normalizeOffProduct(p) {
        if (!p) return null
        const product_name = p.product_name || p.product_name_nl || p.generic_name || ''
        const allergens = p.allergens || (Array.isArray(p.allergens_tags) ? p.allergens_tags.join(',') : '') || ''
        const labels = p.labels || (Array.isArray(p.labels_tags) ? p.labels_tags.join(',') : '') || ''
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
                    return {
                        product_name: item.name || '',
                        allergens: '',
                        labels: '',
                        ingredients_text: item.ingredients || '',
                        raw: item
                    }
                })
            )
        }

        const barcodeLookupKey = import.meta.env.VITE_BARCODELOOKUP_KEY
        if (barcodeLookupKey) {
            providers.push(() =>
                tryProvider('Barcode Lookup', async () => {
                    const data = await fetchJson(
                        `https://api.barcodelookup.com/v3/products?barcode=${code}&key=${encodeURIComponent(barcodeLookupKey)}`
                    )
                    const item = Array.isArray(data?.products) ? data.products[0] : null
                    if (!item) return null
                    return {
                        product_name: item.title || item.product_name || '',
                        allergens: '',
                        labels: '',
                        ingredients_text: item.ingredients || '',
                        raw: item
                    }
                })
            )
        }

        let found = null
        for (const p of providers) {
            found = await p()
            if (found) break
        }

        if (!found) error.value = 'Product niet gevonden in de beschikbare bronnen'
        else product.value = found

        loading.value = false
    }

    function clearResult() {
        product.value = null
        error.value = null
        dataSource.value = ''
    }

    return {
        loading,
        product,
        error,
        dataSource,
        statusText,
        detailResult,
        fetchProductMulti,
        clearResult
    }
}
