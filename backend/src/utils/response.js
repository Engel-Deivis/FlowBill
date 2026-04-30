const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data })
const fail = (res, message, status = 400) => res.status(status).json({ ok: false, message })

module.exports = { ok, fail }