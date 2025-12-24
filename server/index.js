import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import OpenAI from 'openai'
import mysql from 'mysql2/promise'

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))

app.use((req, res, next) => {
  console.log(req.method, req.url)
  next()
})

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
)

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  })
)

app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => done(null, user))
passport.deserializeUser((user, done) => done(null, user))

const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim()
const GOOGLE_CLIENT_SECRET = String(process.env.GOOGLE_CLIENT_SECRET || '').trim()

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${FRONTEND_URL}/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      const user = {
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || '',
        avatar: profile.photos?.[0]?.value || ''
      }
      done(null, user)
    }
  )
)

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
})

try {
  const conn = await db.getConnection()
  await conn.ping()
  conn.release()
  console.log('MySQL connected')
} catch (e) {
  console.error('MySQL connection failed')
  console.error(e)
  process.exit(1)
}

async function query(sql, params = []) {
  const [rows] = await db.execute(sql, params)
  return rows
}

function requireAuth(req, res, next) {
  if (req.user) return next()
  res.status(401).json({ error: 'Unauthorized' })
}

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}/?login=failed` }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}/?login=ok`)
  }
)

app.get('/api/me', (req, res) => {
  res.json({ user: req.user || null })
})

app.post('/api/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid')
      res.json({ ok: true })
    })
  })
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.post('/api/telemetry', async (req, res) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL
    if (!webhookUrl) return res.status(500).json({ ok: false })

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

    const top = Object.entries(byName).slice(0, 6)
    const topLines = top.map(([n, c]) => `• ${n}: ${c}`).join('\n') || '• (geen)'

    const json = JSON.stringify({ sentAt, app: appName, sessionId, events }, null, 2)

    const form = new FormData()
    form.append(
      'payload_json',
      JSON.stringify({
        content:
          `**Telemetry ontvangen**\n` +
          `App: \`${appName}\`\n` +
          `Session: \`${sessionId}\`\n` +
          `Events: \`${events.length}\`\n` +
          `Tijd: \`${sentAt}\``,
        embeds: [{ title: 'Top events', description: topLines, color: 0x5865f2 }]
      })
    )

    form.append(
      'files[0]',
      new Blob([json], { type: 'application/json' }),
      `telemetry-${sessionId}-${Date.now()}.json`
    )

    const r = await fetch(webhookUrl, { method: 'POST', body: form })
    if (!r.ok) throw new Error('Discord webhook failed')

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false })
  }
})

app.post('/api/ai/product-summary', async (req, res) => {
  try {
    const { product, result } = req.body || {}
    if (!product) return res.status(400).json({ error: 'Missing product' })

    const response = await openai.responses.create({
      model: 'gpt-5',
      instructions: 'Je bent een food-safety assistent. Schrijf in het Nederlands.',
      input: JSON.stringify({ product, result })
    })

    res.json({ text: response.output_text || '' })
  } catch (e) {
    res.status(500).json({ error: 'AI request failed' })
  }
})

app.post('/api/products', requireAuth, async (req, res) => {
  try {
    const user = req.user
    const body = req.body || {}

    const barcode = normBarcode(body.barcode)
    if (!barcode) return res.status(400).json({ error: 'Missing barcode' })

    const name = String(body.name || 'Onbekend').trim() || 'Onbekend'
    const ingredientsText = String(body.ingredients_text ?? 'Onbekend').trim() || 'Onbekend'
    const allergenKeys = uniq(toAllergenKeys(body.allergenKeys))

    const conn = await db.getConnection()
    try {
      await conn.beginTransaction()

      const [existing] = await conn.execute(
        `SELECT id FROM products WHERE barcode = ? LIMIT 1`,
        [barcode]
      )

      let productId = existing?.[0]?.id

      if (!productId) {
        const [ins] = await conn.execute(
          `INSERT INTO products (barcode, name, ingredients_text, created_by_email)
           VALUES (?, ?, ?, ?)`,
          [barcode, name, ingredientsText, user?.email || '']
        )
        productId = ins.insertId
      } else {
        await conn.execute(
          `UPDATE products
           SET name = ?, ingredients_text = ?
           WHERE id = ?`,
          [name, ingredientsText, productId]
        )
        await conn.execute(`DELETE FROM product_allergens WHERE product_id = ?`, [productId])
      }

      if (allergenKeys.length) {
        const placeholders = allergenKeys.map(() => '?').join(',')
        const [aRows] = await conn.execute(
          `SELECT id, allergen_key FROM allergens WHERE allergen_key IN (${placeholders})`,
          allergenKeys
        )

        const keyToId = new Map(aRows.map(r => [r.allergen_key, r.id]))
        const pairs = allergenKeys
          .map(k => keyToId.get(k))
          .filter(Boolean)
          .map(allergenId => [productId, allergenId])

        if (pairs.length) {
          const valuesSql = pairs.map(() => '(?, ?)').join(',')
          const flat = pairs.flat()
          await conn.execute(
            `INSERT IGNORE INTO product_allergens (product_id, allergen_id)
             VALUES ${valuesSql}`,
            flat
          )
        }
      }

      await conn.commit()

      res.json({
        ok: true,
        barcode,
        id: productId
      })
    } catch (e) {
      await conn.rollback()
      res.status(500).json({ error: 'DB error' })
    } finally {
      conn.release()
    }
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})


app.get('/api/products/:barcode', async (req, res) => {
  try {
    const barcode = normBarcode(req.params.barcode)
    if (!barcode) return res.status(400).json({ error: 'Missing barcode' })

    const rows = await query(
      `SELECT id, barcode, name, ingredients_text, created_at, updated_at
       FROM products
       WHERE barcode = ?
       LIMIT 1`,
      [barcode]
    )

    const p = rows[0]
    if (!p) return res.status(404).json({ error: 'Not found' })

    const allergenRows = await query(
      `SELECT a.allergen_key AS key, a.allergen_name AS name
       FROM product_allergens pa
       JOIN allergens a ON a.id = pa.allergen_id
       WHERE pa.product_id = ?
       ORDER BY a.allergen_name`,
      [p.id]
    )

    res.json({
      product: {
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        ingredients_text: p.ingredients_text,
        allergens: allergenRows
      }
    })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})


const port = Number(process.env.PORT || 8787)
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
