// api/expenses.js

// Persistent expenses storage via Vercel KV
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// Aggiungi un controllo per le variabili d'ambiente
if (!KV_URL || !KV_TOKEN) {
    console.error("ERRORE: Variabili Vercel KV mancanti! Impossibile connettersi al database.");
}

async function kvGet(key) {
    try {
        const res = await fetch(`${KV_URL}/get/${key}`, {
            headers: { Authorization: `Bearer ${KV_TOKEN}` }
        });
        console.log(`[KV GET] Status: ${res.status}`);
        return res.json();
    } catch (e) {
        console.error("[KV GET] Errore durante la fetch:", e.message);
        return { result: null };
    }
}

async function kvSet(key, value) {
    try {
        const res = await fetch(`${KV_URL}/set/${key}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${KV_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ value })
        });
        console.log(`[KV SET] Status: ${res.status}`);
    } catch (e) {
        console.error("[KV SET] Errore durante la fetch:", e.message);
    }
}

export default async function handler(req, res) {
    const method = req.method;

    // always load stored expenses
    let store = await kvGet("expenses");
    let expenses = store?.result ? JSON.parse(store.result) : [];
    console.log(`[${method}] Spese caricate: ${expenses.length}`);

    // GET: Recupera tutte le spese
    if (method === "GET") {
        return res.status(200).json({ success: true, expenses });
    }

    // POST: Aggiunge una nuova spesa
    if (method === "POST") {
        const { description, amount, category, date } = req.body || {};

        if (!description || !amount || !category || !date) {
            return res.status(400).json({
                success: false,
                error: "Missing fields"
            });
        }

        const newExpense = {
            id: Date.now().toString(),
            description,
            amount: parseFloat(amount),
            category,
            date
        };

        expenses.push(newExpense);

        await kvSet("expenses", JSON.stringify(expenses));
        console.log(`[POST] Spesa aggiunta e salvata. Nuova dimensione: ${expenses.length}`);

        return res
            .status(201)
            .json({ success: true, expense: newExpense, expenses });
    }

    // PUT: Modifica una spesa esistente
    if (method === "PUT") {
        const { id } = req.query;
        const { description, amount, category, date } = req.body || {};

        const index = expenses.findIndex((e) => e.id === id);
        if (index === -1)
            return res
                .status(404)
                .json({ success: false, error: "Expense not found" });

        expenses[index] = {
            ...expenses[index],
            description: description ?? expenses[index].description,
            amount: amount ? parseFloat(amount) : expenses[index].amount,
            category: category ?? expenses[index].category,
            date: date ?? expenses[index].date
        };

        await kvSet("expenses", JSON.stringify(expenses));

        return res.status(200).json({ success: true, expenses });
    }
    
    // DELETE: Cancella una spesa esistente
    if (method === "DELETE") {
        const { id } = req.query;

        const initialLength = expenses.length;
        expenses = expenses.filter((e) => e.id !== id);

        if (expenses.length === initialLength) {
            return res
                .status(404)
                .json({ success: false, error: "Expense not found" });
        }

        await kvSet("expenses", JSON.stringify(expenses));

        return res.status(200).json({ success: true, expenses });
    }

    // Method not allowed
    return res.status(405).json({ success: false, error: "Method not allowed" });
}
