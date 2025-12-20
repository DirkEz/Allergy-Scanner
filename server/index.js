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

const webhookUrl = process.env.DISCORD_WEBHOOK_URL || ''

function safeString(v, max = 180) {
  const s = String(v ?? '')
  return s.length > max ? `${s.slice(0, max)}…` : s
}

function pickStats(events = []) {
  const total = Array.isArray(events) ? events.length : 0
  const byName = {}
  if (Array.isArray(events)) {
    for (const e of events) {
      const n = safeString(e?.name || 'unknown', 60)
      byName[n] = (byName[n] || 0) + 1
    }
  }
  const top = Object.entries(byName)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  return { total, top }
}

async function postToDiscordWebhook({ webhookUrl, payload, fileName, fileContent }) {
  const form = new FormData()
  form.append('payload_json', JSON.stringify(payload))

  if (fileContent) {
    const blob = new Blob([fileContent], { type: 'application/json' })
    form.append('files[0]', blob, fileName || 'telemetry.json')
  }

  const r = await fetch(webhookUrl, { method: 'POST', body: form })
  if (!r.ok) {
    const t = await r.text().catch(() => '')
    throw new Error(t || `Discord webhook error ${r.status}`)
  }
}

app.post('/api/telemetry', async (req, res) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL || ''
    if (!webhookUrl) return res.status(500).json({ ok: false, error: 'Missing DISCORD_WEBHOOK_URL' })

    const body = req.body || {}
    const events = Array.isArray(body.events) ? body.events : []
    const sessionId = String(body.sessionId || 'unknown')
    const appName = String(body.app || 'app')
    const sentAt = String(body.sentAt || new Date().toISOString())

    const byName = {}
    for (const e of events) {
      const n = String(e?.name || 'unknown')
      byName[n] = (byName[n] || 0) + 1
    }

    const top = Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const topLines = top.map(([n, c]) => `• ${n}: ${c}`).join('\n') || '• (geen)'

    const json = JSON.stringify({ sentAt, app: appName, sessionId, events }, null, 2)

    const form = new FormData()
    form.append('payload_json', JSON.stringify({
      content:
        `**Telemetry ontvangen**\n` +
        `App: \`${appName}\`\n` +
        `Session: \`${sessionId}\`\n` +
        `Events: \`${events.length}\`\n` +
        `Tijd: \`${sentAt}\``,
      embeds: [{ title: 'Top events', description: topLines, color: 0x5865f2 }]
    }))

    form.append('files[0]', new Blob([json], { type: 'application/json' }), `telemetry-${sessionId}-${Date.now()}.json`)

    const r = await fetch(webhookUrl, { method: 'POST', body: form })
    if (!r.ok) {
      const t = await r.text().catch(() => '')
      return res.status(500).json({ ok: false, error: t || `Discord webhook error ${r.status}` })
    }

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || 'telemetry_failed' })
  }
})


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
