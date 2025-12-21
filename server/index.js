import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import OpenAI from 'openai'

const app = express()
app.set('trust proxy', 1)
app.use(express.json({ limit: '1mb' }))

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

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback'
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
      instructions:
        'Je bent een food-safety assistent. Schrijf in het Nederlands.',
      input: JSON.stringify({ product, result })
    })

    res.json({ text: response.output_text || '' })
  } catch (e) {
    res.status(500).json({ error: 'AI request failed' })
  }
})

app.post('/api/products', requireAuth, async (req, res) => {
  const user = req.user
  const product = req.body || {}
  res.json({ ok: true, createdBy: user.email, product })
})

const port = Number(process.env.PORT || 8787)
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`)
})
