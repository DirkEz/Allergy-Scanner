import 'dotenv/config'
import express from 'express'
import OpenAI from 'openai'

const app = express()
app.use(express.json({ limit: '1mb' }))

const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) {
  console.log('OPENAI_API_KEY: MISSING')
} else {
  console.log('OPENAI_API_KEY: LOADED')
}

const client = new OpenAI({ apiKey })

app.post('/api/ai/product-summary', async (req, res) => {
  try {
    const { product, result } = req.body || {}

    if (!product) {
      return res.status(400).json({ error: 'Missing product' })
    }

    const productName = product.product_name || 'Onbekend product'
    const ingredients = product.ingredients_text || ''
    const labels = product.labels || ''
    const allergens = product.allergens || ''
    const source = product.source || ''

    const level = result?.level || 'unknown'
    const title = result?.title || ''
    const reasons = Array.isArray(result?.reasons) ? result.reasons : []
    const matched = Array.isArray(result?.matched) ? result.matched : []

    const instructions =
      'Je bent een food-safety assistent. Schrijf in het Nederlands. ' +
      'Geef een korte uitleg op basis van de productdata. ' +
      'Wees voorzichtig: als info ontbreekt, zeg dat expliciet. ' +
      'Gebruik dit format:\n' +
      '1) Samenvatting (1-2 zinnen)\n' +
      '2) Gluten-inschatting (veilig / niet veilig / let op / onbekend)\n' +
      '3) Waarom (max 4 bullets)\n' +
      '4) Actie (1 zin: wat checken op verpakking)'

    const input =
      `Productnaam: ${productName}\n` +
      `Bron: ${source}\n` +
      `Labels: ${labels}\n` +
      `Allergenen: ${allergens}\n` +
      `Ingrediënten: ${ingredients}\n` +
      `App-inschatting level: ${level}\n` +
      `App-titel: ${title}\n` +
      `Redenen: ${reasons.join(' | ')}\n` +
      `Matches: ${matched.join(', ')}`

    const response = await client.responses.create({
      model: 'gpt-5',
      instructions,
      input
    })

    res.json({ text: response.output_text || '' })
  } catch (e) {
    const status = e?.status || e?.response?.status || 500
    const message =
      e?.error?.message ||
      e?.response?.data?.error?.message ||
      e?.message ||
      'Unknown error'

    console.log('AI ERROR STATUS:', status)
    console.log('AI ERROR MESSAGE:', message)
    console.log('AI ERROR RAW:', e)

    res.status(500).json({
      error: 'AI request failed',
      status,
      message
    })
  }
})

const port = Number(process.env.PORT || 8787)
app.listen(port, () => {
  console.log(`AI backend listening on http://localhost:${port}`)
})
