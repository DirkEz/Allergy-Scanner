import { computed, ref } from 'vue'

export function useProductLookup() {
  const loading = ref(false)
  const product = ref(null)
  const error = ref(null)
  const dataSource = ref('')

  function normalizeText(v) {
    return String(v || '').toLowerCase()
  }

  function getAllergenText(p) {
    const a1 = normalizeText(p?.allergens)
    const a2 = Array.isArray(p?.allergens_tags) ? p.allergens_tags.map(x => String(x || '')).join(',') : ''
    const a3 = Array.isArray(p?.allergens_hierarchy) ? p.allergens_hierarchy.map(x => String(x || '')).join(',') : ''
    return [a1, normalizeText(a2), normalizeText(a3)].filter(Boolean).join(', ')
  }

  function getLabelText(p) {
    const l1 = normalizeText(p?.labels)
    const l2 = Array.isArray(p?.labels_tags) ? p.labels_tags.map(x => String(x || '')).join(',') : ''
    return [l1, normalizeText(l2)].filter(Boolean).join(', ')
  }

  function getIngredientText(p) {
    return [
      normalizeText(p?.ingredients_text),
      normalizeText(p?.ingredients_text_nl),
      normalizeText(p?.ingredients_text_en)
    ].filter(Boolean).join(' ')
  }

  const ALLERGENS = [
    {
      key: 'gluten',
      name: 'Gluten',
      freeLabels: ['gluten-free', 'glutenvrij', 'sans gluten', 'senza glutine'],
      allergenTokens: ['gluten'],
      ingredientStrong: [
        'tarwe', 'wheat', 'gerst', 'barley', 'rogge', 'rye', 'spelt', 'spelta', 'farro', 'kamut',
        'bulgur', 'couscous', 'seitan', 'mout', 'malt', 'mout-extract', 'moutextract',
        'tarwebloem', 'wheat flour', 'paneermeel', 'breadcrumbs'
      ],
      mayContainRefs: ['gluten', 'tarwe', 'wheat', 'gerst', 'barley', 'rogge', 'rye', 'spelt', 'mout', 'malt']
    },
    {
      key: 'milk',
      name: 'Melk / Lactose',
      freeLabels: ['lactosevrij', 'lactose-free', 'lactosefrei', 'sans lactose', 'senza lattosio', 'dairy-free', 'melkvrij'],
      allergenTokens: ['milk', 'melk', 'lactose'],
      ingredientStrong: [
        'melk', 'milk', 'lactose', 'wei', 'whey', 'caseïne', 'casein', 'boter', 'butter',
        'room', 'cream', 'kaas', 'cheese', 'yoghurt', 'yogurt', 'melkpoeder', 'milk powder'
      ],
      mayContainRefs: ['melk', 'milk', 'lactose', 'wei', 'whey', 'casein', 'caseïne']
    },
    {
      key: 'egg',
      name: 'Ei',
      freeLabels: ['egg-free', 'eivrij'],
      allergenTokens: ['egg', 'ei', 'eieren'],
      ingredientStrong: ['ei', 'eieren', 'egg', 'egg white', 'egg yolk', 'albumine', 'albumin'],
      mayContainRefs: ['ei', 'egg', 'eieren']
    },
    {
      key: 'peanut',
      name: 'Pinda',
      freeLabels: ['peanut-free', 'pindavrij'],
      allergenTokens: ['peanut', 'pinda', 'aardnoot', 'arachide'],
      ingredientStrong: ['pinda', 'pinda’s', 'peanut', 'peanuts', 'aardnoot', 'arachide'],
      mayContainRefs: ['pinda', 'peanut', 'aardnoot', 'arachide']
    },
    {
      key: 'nuts',
      name: 'Noten',
      freeLabels: ['nut-free', 'notenvrij'],
      allergenTokens: ['nuts', 'noten', 'tree nuts', 'hazelnut', 'almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'macadamia'],
      ingredientStrong: [
        'noten', 'nuts', 'hazelnoot', 'hazelnut', 'amandel', 'almond', 'walnoot', 'walnut',
        'cashew', 'pecan', 'pistache', 'pistachio', 'macadamia'
      ],
      mayContainRefs: ['noten', 'nuts', 'hazelnut', 'almond', 'walnut', 'cashew', 'pecan', 'pistachio', 'macadamia']
    },
    {
      key: 'soy',
      name: 'Soja',
      freeLabels: ['soy-free', 'sojavrij'],
      allergenTokens: ['soy', 'soja'],
      ingredientStrong: ['soja', 'soy', 'sojaboon', 'soybean', 'lecithine (soja)', 'sojalecithine', 'soya lecithin'],
      mayContainRefs: ['soja', 'soy', 'soya', 'soybean']
    },
    {
      key: 'fish',
      name: 'Vis',
      freeLabels: ['fish-free', 'visvrij'],
      allergenTokens: ['fish', 'vis'],
      ingredientStrong: ['vis', 'fish', 'ansjovis', 'anchovy', 'tonijn', 'tuna', 'zalm', 'salmon'],
      mayContainRefs: ['vis', 'fish', 'salmon', 'tuna', 'anchovy']
    },
    {
      key: 'crustaceans',
      name: 'Schaaldieren',
      freeLabels: ['crustacean-free', 'schaaldierenvrij'],
      allergenTokens: ['crustaceans', 'schaaldieren', 'shrimp', 'prawn', 'crab', 'lobster'],
      ingredientStrong: ['garnaal', 'garnalen', 'shrimp', 'prawn', 'krab', 'crab', 'kreeft', 'lobster'],
      mayContainRefs: ['shrimp', 'prawn', 'crab', 'lobster', 'garnaal', 'krab', 'kreeft']
    },
    {
      key: 'sesame',
      name: 'Sesam',
      freeLabels: ['sesame-free', 'sesamvrij'],
      allergenTokens: ['sesame', 'sesam'],
      ingredientStrong: ['sesam', 'sesame', 'tahin', 'tahini'],
      mayContainRefs: ['sesam', 'sesame', 'tahini', 'tahin']
    },
    {
      key: 'mustard',
      name: 'Mosterd',
      freeLabels: ['mustard-free', 'mosterdvrij'],
      allergenTokens: ['mustard', 'mosterd'],
      ingredientStrong: ['mosterd', 'mustard'],
      mayContainRefs: ['mosterd', 'mustard']
    },
    {
      key: 'celery',
      name: 'Selderij',
      freeLabels: ['celery-free', 'selderijvrij'],
      allergenTokens: ['celery', 'selderij'],
      ingredientStrong: ['selderij', 'celery'],
      mayContainRefs: ['selderij', 'celery']
    },
    {
      key: 'lupin',
      name: 'Lupine',
      freeLabels: ['lupin-free', 'lupinevrij'],
      allergenTokens: ['lupin', 'lupine'],
      ingredientStrong: ['lupine', 'lupin'],
      mayContainRefs: ['lupine', 'lupin']
    },
    {
      key: 'sulphites',
      name: 'Sulfieten',
      freeLabels: ['sulphite-free', 'sulfietvrij'],
      allergenTokens: ['sulphites', 'sulfieten', 'sulphur dioxide', 'zwaveldioxide', 'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228'],
      ingredientStrong: ['sulfiet', 'sulfieten', 'sulphite', 'sulphites', 'zwaveldioxide', 'sulphur dioxide', 'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228'],
      mayContainRefs: ['sulfiet', 'sulphite', 'sulphites', 'e220', 'e221', 'e222', 'e223', 'e224', 'e225', 'e226', 'e227', 'e228']
    }
  ]

  function hasFreeLabel(labelText, patterns) {
    if (!labelText) return false
    return patterns.some(x => labelText.includes(x))
  }

  function containsAllergen(allergenText, tokens) {
    if (!allergenText) return false
    return tokens.some(t => allergenText.includes(t))
  }

  function mayContain(allergenText, ingredientText, refs) {
    const txt = `${allergenText} ${ingredientText}`

    const patterns = [
      'kan sporen bevatten',
      'kan sporen bevatten van',
      'may contain',
      'traces of',
      'sporen van',
      'verwerkt in een fabriek waar',
      'geproduceerd in een fabriek waar'
    ]

    const hasMayContain = patterns.some(p => txt.includes(p))
    const hasRef = refs.some(r => txt.includes(r))
    return hasMayContain && hasRef
  }

  function ingredientsSuggest(ingredientText, strong) {
    const hits = strong.filter(w => ingredientText.includes(w))
    const uniq = []
    const seen = new Set()
    for (const h of hits) {
      const k = h.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      uniq.push(h)
    }
    return uniq
  }

  function analyzeAllergen(def, allergenText, labelText, ingredientText) {
    const reasons = []
    const matched = []

    if (hasFreeLabel(labelText, def.freeLabels)) {
      reasons.push(`${def.name}-vrij label gevonden`)
      matched.push('label')
      return { level: 'safe', title: `${def.name}: vrij (label)`, reasons, matched }
    }

    if (containsAllergen(allergenText, def.allergenTokens)) {
      reasons.push(`${def.name} staat vermeld bij allergenen`)
      matched.push('allergenen')
      return { level: 'unsafe', title: `${def.name}: bevat (allergeen)`, reasons, matched }
    }

    if (mayContain(allergenText, ingredientText, def.mayContainRefs)) {
      reasons.push(`Waarschuwing voor sporen / kruisbesmetting met ${def.name}`)
      matched.push('sporen/may contain')
      return { level: 'caution', title: `${def.name}: kan sporen bevatten`, reasons, matched }
    }

    const ingHits = ingredientsSuggest(ingredientText, def.ingredientStrong)
    if (ingHits.length) {
      reasons.push(`Ingrediënten bevatten verdachte termen voor ${def.name}`)
      matched.push(...ingHits.slice(0, 6))
      return { level: 'caution', title: `${def.name}: waarschijnlijk (ingrediënten)`, reasons, matched }
    }

    if (ingredientText.length < 10 && allergenText.length < 3 && labelText.length < 3) {
      reasons.push('Te weinig productinformatie aanwezig')
      return { level: 'unknown', title: `${def.name}: onvoldoende info`, reasons, matched }
    }

    reasons.push(`Geen duidelijke ${def.name}-info gevonden`)
    return { level: 'unknown', title: `${def.name}: onbekend`, reasons, matched }
  }

  const allergenResults = computed(() => {
    if (!product.value) return []

    const p = product.value
    const allergenText = getAllergenText(p)
    const labelText = getLabelText(p)
    const ingredientText = getIngredientText(p)

    return ALLERGENS.map(def => {
      const r = analyzeAllergen(def, allergenText, labelText, ingredientText)
      return { key: def.key, name: def.name, ...r }
    })
  })

  const detailResult = computed(() => {
    const list = allergenResults.value
    const gluten = list.find(x => x.key === 'gluten')
    if (gluten) return { level: gluten.level, title: gluten.title, reasons: gluten.reasons, matched: gluten.matched }
    return { level: 'unknown', title: 'Onvoldoende informatie', reasons: [], matched: [] }
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
    allergenResults,
    fetchProductMulti,
    clearResult
  }
}
