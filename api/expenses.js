// api/expenses.js (Con Log di Debug)

// Persistent expenses storage via Vercel KV
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

// Aggiungi un controllo per le variabili d'ambiente
if (!KV_URL || !KV_TOKEN) {
    console.error("ERRORE: Variabili Vercel KV mancanti!");
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

    if (method === "GET") {
        return res.status(200).json({ success: true, expenses });
    }

    if (method === "POST") {
        const { description, amount, category, date } = req.body || {};
        // ... (Validazione omessa per brevità) ...

        const newExpense = {
            id: Date.now().toString(),
            description,
            amount: parseFloat(amount),
            category,
            date
        };

        expenses.push(newExpense);

        // Verifica se l'operazione di SET è riuscita
        await kvSet("expenses", JSON.stringify(expenses));
        console.log(`[POST] Spesa aggiunta e tentativo di salvataggio. Nuova dimensione: ${expenses.length}`);

        return res
            .status(201)
            .json({ success: true, expense: newExpense, expenses });
    }

    if (method === "PUT") {
        // ... (Logica PUT omessa per brevità) ...

        await kvSet("expenses", JSON.stringify(expenses));

        return res.status(200).json({ success: true, expenses });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
}
