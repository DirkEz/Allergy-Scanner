import { ref } from 'vue'

export function useProductAi() {
  const aiLoading = ref(false)
  const aiError = ref(null)
  const aiText = ref('')

  async function generateAiSummary({ product, detailResult, dataSource }) {
    aiLoading.value = true
    aiError.value = null
    aiText.value = ''

    try {
      const payload = {
        product: {
          product_name: product?.product_name || '',
          ingredients_text: product?.ingredients_text || '',
          labels: product?.labels || '',
          allergens: product?.allergens || '',
          source: dataSource || ''
        },
        result: {
          level: detailResult?.level || 'unknown',
          title: detailResult?.title || '',
          reasons: Array.isArray(detailResult?.reasons)
            ? detailResult.reasons
            : [],
          matched: Array.isArray(detailResult?.matched)
            ? detailResult.matched
            : []
        }
      }

      const res = await fetch('/api/ai/product-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        throw new Error('AI_BACKEND_ERROR')
      }

      const data = await res.json()

      const text = String(data?.text || '').trim()

      if (!text) {
        aiError.value = 'Geen AI antwoord ontvangen'
      } else {
        aiText.value = text
      }
    } catch (e) {
      aiError.value = 'AI ophalen mislukt'
    } finally {
      aiLoading.value = false
    }
  }

  function clearAi() {
    aiText.value = ''
    aiError.value = null
  }

  return {
    aiLoading,
    aiError,
    aiText,
    generateAiSummary,
    clearAi
  }
}
