const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

const tables = { bills: "ledger_bills", travelers: "ledger_travelers", todos: "trip_todos", tickets: "trip_tickets" };
const safeId = (value) => String(value || "").trim().slice(0, 160);

async function ensureSchema(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS ledger_bills (id TEXT NOT NULL, trip_id TEXT NOT NULL, payer TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT NOT NULL, category TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', participants TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (trip_id, id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS ledger_travelers (id TEXT NOT NULL, trip_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (trip_id, id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS trip_todos (id TEXT NOT NULL, trip_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (trip_id, id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS trip_tickets (id TEXT NOT NULL, trip_id TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (trip_id, id))"),
    db.prepare("CREATE TABLE IF NOT EXISTS trip_workspace (trip_id TEXT PRIMARY KEY, updated_at TEXT NOT NULL, payload TEXT NOT NULL)")
  ]);
}

async function readSnapshot(db, tripId, collections) {
  const snapshot = { version: 1, settings: null, bills: [], travelers: [], todos: [], tickets: [], updatedAt: new Date().toISOString() };
  await Promise.all(collections.map(async (collection) => {
    const result = await db.prepare(`SELECT payload FROM ${tables[collection]} WHERE trip_id = ? ORDER BY created_at, id`).bind(tripId).all();
    snapshot[collection] = result.results.map((row) => JSON.parse(row.payload));
  }));
  return snapshot;
}

async function handleWorkspace(request, db, tripId) {
  if (request.method === "GET") {
    const row = await db.prepare("SELECT payload, updated_at FROM trip_workspace WHERE trip_id = ?").bind(tripId).first();
    return json(row ? { payload: JSON.parse(row.payload), updatedAt: row.updated_at } : { payload: null, updatedAt: null });
  }
  if (request.method !== "POST") return json({ error: "method not allowed" }, 405);
  const body = await request.json();
  if (!body?.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) return json({ error: "payload must be an object" }, 400);
  const payload = JSON.stringify(body.payload);
  const updatedAt = new Date().toISOString();
  await db.prepare("INSERT INTO trip_workspace (trip_id, updated_at, payload) VALUES (?, ?, ?) ON CONFLICT(trip_id) DO UPDATE SET updated_at=excluded.updated_at, payload=excluded.payload")
    .bind(tripId, updatedAt, payload).run();
  return json({ payload: body.payload, updatedAt });
}

export async function onRequest(context) {
  const tripId = safeId(context.params.tripId);
  if (!tripId) return json({ error: "trip_id is required" }, 400);
  if (!context.env.DB) return json({ error: "D1 binding DB is missing" }, 503);
  try {
    await ensureSchema(context.env.DB);
    const url = new URL(context.request.url);
    if (url.searchParams.get("workspace") === "1") return handleWorkspace(context.request, context.env.DB, tripId);
    const requested = url.searchParams.get("collections");
    const collections = [...new Set(String(requested || Object.keys(tables).join(",")).split(",").filter((name) => tables[name]))];
    if (!collections.length) return json({ error: "at least one valid collection is required" }, 400);
    if (context.request.method === "GET") return json(await readSnapshot(context.env.DB, tripId, collections));
    if (context.request.method !== "POST") return json({ error: "method not allowed" }, 405);
    const body = await context.request.json();
    if (!Array.isArray(body.changes)) return json({ error: "changes must be an array" }, 400);
    const statements = [];
    for (const change of body.changes) {
      const table = tables[change.collection];
      const id = safeId(change.id);
      if (!table || !collections.includes(change.collection) || !id || !["upsert", "delete"].includes(change.op)) return json({ error: "invalid change" }, 400);
      if (change.op === "delete") {
        statements.push(context.env.DB.prepare(`DELETE FROM ${table} WHERE trip_id = ? AND id = ?`).bind(tripId, id));
        continue;
      }
      const value = change.value || {};
      const payload = JSON.stringify(value);
      const now = new Date().toISOString();
      if (change.collection === "bills") {
        statements.push(context.env.DB.prepare("INSERT INTO ledger_bills (id, trip_id, payer, amount, currency, category, note, participants, created_at, updated_at, payload) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(trip_id, id) DO UPDATE SET payer=excluded.payer, amount=excluded.amount, currency=excluded.currency, category=excluded.category, note=excluded.note, participants=excluded.participants, updated_at=excluded.updated_at, payload=excluded.payload")
          .bind(id, tripId, value.payerId || value.payer || "", Number(value.baseAmountCents ?? value.amount ?? 0), value.currency || "CNY", value.category || "Other", typeof value.note === "string" ? value.note.trim().slice(0, 160) : "", JSON.stringify(value.participantIds || value.participants || []), value.createdAt || now, value.updatedAt || now, payload));
      } else {
        statements.push(context.env.DB.prepare(`INSERT INTO ${table} (id, trip_id, created_at, updated_at, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(trip_id, id) DO UPDATE SET updated_at=excluded.updated_at, payload=excluded.payload`)
          .bind(id, tripId, value.createdAt || now, value.updatedAt || now, payload));
      }
    }
    if (statements.length) await context.env.DB.batch(statements);
    return json(await readSnapshot(context.env.DB, tripId, collections));
  } catch (error) {
    return json({ error: "database operation failed", detail: error.message }, 500);
  }
}
