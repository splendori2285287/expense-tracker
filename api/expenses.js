// Questa variabile vive nella memoria del server.
// ATTENZIONE: In ambiente Serverless (Vercel), questi dati vengono persi
// quando la funzione va in "sleep" o viene ridistribuita.
let memoryExpenses = [
    { id: 1, description: "Spesa Demo Iniziale", amount: 0, date: new Date().toISOString() }
];

export default function handler(req, res) {
    // 1. Gestione richieste GET (Recupera tutte le spese)
    if (req.method === 'GET') {
        return res.status(200).json(memoryExpenses);
    }

    // 2. Gestione richieste POST (Aggiungi nuova spesa)
    if (req.method === 'POST') {
        try {
            const { description, amount } = req.body;

            // Validazione base
            if (!description || amount === undefined) {
                return res.status(400).json({ error: 'Descrizione e importo sono richiesti' });
            }

            const newExpense = {
                id: Date.now(), // Generazione ID semplice
                description,
                amount: parseFloat(amount),
                date: new Date().toISOString()
            };

            // Aggiungi all'array in memoria
            memoryExpenses.push(newExpense);

            return res.status(201).json(newExpense);
        } catch (error) {
            return res.status(500).json({ error: 'Errore nel processare i dati' });
        }
    }

    // 3. Metodo non supportato
    return res.status(405).json({ error: `Metodo ${req.method} non consentito` });
}
