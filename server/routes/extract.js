// START OF FILE server/routes/extract.js (AGGIORNATO con OpenAI)

const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const dotenv = require('dotenv');
const { OpenAI } = require('openai'); // Importa la libreria OpenAI

dotenv.config(); // Carica variabili d'ambiente

// --- Configurazione OpenAI ---
const openaiApiKey = process.env.OPENAI_API_KEY;
if (!openaiApiKey) {
    console.error("ERRORE FATALE: La variabile d'ambiente OPENAI_API_KEY non è impostata.");
    // In un'app reale, potresti voler gestire questo diversamente,
    // ma per ora blocchiamo l'avvio se la chiave manca.
    // process.exit(1); // Commentato per permettere l'avvio anche senza chiave per testare altre parti
}
// Inizializza il client OpenAI solo se la chiave è presente
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

// --- Configurazione Multer ---
const upload = multer({ storage: multer.memoryStorage() });

// --- Helper per Validazione Data (opzionale, ma consigliato) ---
// Controlla se una stringa è nel formato YYYY-MM-DD e rappresenta una data valida
const isValidISODateString = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    // Ulteriore check per date invalide tipo 2023-02-31
    const timestamp = date.getTime();
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
        return false;
    }
    // Confronta se la data parsata, riconvertita in YYYY-MM-DD, corrisponde all'originale
    // Questo gestisce casi come "2023-02-30" che diventano "2023-03-02"
    return date.toISOString().startsWith(dateString);
};


// --- Funzione per Chiamare OpenAI ---
/**
 * Invia il testo della visura a OpenAI per l'estrazione dei dati.
 * @param {string} pdfText Testo estratto dal PDF.
 * @returns {Promise<object|null>} Oggetto JSON con i dati estratti o null in caso di errore.
 */
async function extractDataWithOpenAI(pdfText) {
    if (!openai) {
        console.error("OpenAI client non inizializzato (manca API key?).");
        throw new Error("Configurazione OpenAI mancante.");
    }
    if (!pdfText || pdfText.trim().length < 100) { // Controllo base sulla lunghezza del testo
        console.error("Testo PDF troppo corto o mancante per l'analisi AI.");
        throw new Error("Testo PDF insufficiente per l'analisi.");
    }

    const modelToUse = "gpt-3.5-turbo"; // Modello più economico per iniziare, considera gpt-4o o gpt-4-turbo per maggiore accuratezza
    console.log(`>>> Chiamata API OpenAI con modello: ${modelToUse}`);

    // ---- PROMPT DETTAGLIATO ----
    const promptMessages = [
        {
            role: "system",
            content: `Sei un assistente esperto nell'analisi di documenti PDF di Visure Camerali Italiane. Il tuo compito è estrarre informazioni specifiche e restituirle ESCLUSIVAMENTE come un oggetto JSON valido. Identifica i seguenti campi nel testo fornito e popola l'oggetto JSON corrispondente. Usa 'null' se un campo non è trovato o non applicabile. Assicurati che le date siano nel formato YYYY-MM-DD e i numeri siano di tipo numerico.`
        },
        {
            role: "user",
            content: `Dal seguente testo estratto da una Visura Camerale Italiana, estrai i dati richiesti e restituiscili nel formato JSON specificato:

Formato JSON Atteso:
{
  "nome": "string | null", // Denominazione o Ragione Sociale
  "codiceFiscale": "string | null", // Codice fiscale (alfanumerico)
  "partitaIva": "string | null", // Partita IVA (numerica)
  "formaGiuridica": "string | null", // Es: "societa' a responsabilita' limitata"
  "pec": "string | null", // Indirizzo PEC
  "reaNumero": "string | null", // Solo il numero REA
  "reaProvincia": "string | null", // Sigla provincia REA (es: "BA")
  "sede_via": "string | null", // Via/Piazza/Strada e numero civico
  "sede_cap": "string | null", // CAP (5 cifre)
  "sede_comune": "string | null",
  "sede_provincia": "string | null", // Sigla provincia sede (es: "BA")
  "capitaleSociale": number | null, // Valore numerico del capitale SOTTOSCRITTO
  "statoAttivita": "string | null", // Es: "attiva", "cessata"
  "dataCostituzione": "string YYYY-MM-DD | null",
  "dataIscrizioneRI": "string YYYY-MM-DD | null", // Data iscrizione Registro Imprese
  "dataInizioAttivita": "string YYYY-MM-DD | null",
  "atecoPrimario": "string | null", // Codice numerico ATECO primario
  "attivitaPrevalente": "string | null", // Descrizione testuale attività
  "numeroAddetti": number | null,
  "dataRiferimentoAddetti": "string YYYY-MM-DD | null",
  "numeroAmministratori": number | null,
  "sistemaAmministrazione": "string | null", // Es: "consiglio di amministrazione"
  "organoControlloPresente": boolean | null,
  "tipoOrganoControllo": "string | null", // Es: "Sindaco Unico"
  "numeroUnitaLocali": number | null,
  "partecipazioni": boolean | null // true se 'sì', false se 'no' o non specificato
}

Testo della Visura:
"""
${pdfText}
"""

Restituisci SOLO l'oggetto JSON richiesto, senza alcun testo aggiuntivo prima o dopo.`
        }
    ];
    // ---- FINE PROMPT ----

    try {
        const completion = await openai.chat.completions.create({
            model: modelToUse,
            messages: promptMessages,
            temperature: 0.2, // Bassa temperatura per output più fattuale
            // Potresti aggiungere response_format se usi modelli compatibili:
            // response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0]?.message?.content;
        if (!responseContent) {
            throw new Error("Risposta vuota dall'API OpenAI.");
        }

        console.log(">>> Risposta grezza da OpenAI:", responseContent);

        // Tenta di pulire la risposta se contiene markdown ```json ... ```
        const cleanedResponse = responseContent.replace(/^```json\s*|```$/g, '').trim();

        // Parsa la risposta JSON
        let extractedJson;
        try {
            extractedJson = JSON.parse(cleanedResponse);
            console.log(">>> JSON Parsato con successo:", extractedJson);
            return extractedJson; // Restituisce l'oggetto JSON parsato
        } catch (parseError) {
            console.error(">>> ERRORE: Impossibile parsare il JSON dalla risposta OpenAI:", parseError);
            console.error(">>> Risposta ricevuta che ha causato l'errore:", cleanedResponse);
            throw new Error("Formato JSON non valido ricevuto dall'AI.");
        }

    } catch (error) {
        console.error(">>> ERRORE durante la chiamata API OpenAI:", error);
        // Controlla se l'errore è specifico dell'API OpenAI (es. chiave errata, quota superata)
        if (error.response) {
            console.error(">>> Dettagli Errore API OpenAI:", error.response.data);
            throw new Error(`Errore API OpenAI: ${error.response.data?.error?.message || error.message}`);
        } else {
            throw new Error(`Errore durante la comunicazione con OpenAI: ${error.message}`);
        }
    }
}

// --- Route POST /api/extract/visura ---
router.post('/visura', upload.single('visuraPdf'), async (req, res) => {
    console.log(">>> Ricevuta richiesta POST /api/extract/visura (con AI)");
    if (!openai) {
         return res.status(503).json({ message: "Servizio di estrazione AI non configurato correttamente (manca API Key)." });
    }
    if (!req.file) {
        return res.status(400).json({ message: 'Nessun file PDF caricato.' });
    }

    try {
        console.log(">>> Parsing PDF...");
        const pdfData = await pdf(req.file.buffer);
        const text = pdfData.text;
        console.log(`>>> PDF Parsato. Lunghezza testo: ${text.length} caratteri.`);

        // Chiama la funzione che usa OpenAI
        const extractedData = await extractDataWithOpenAI(text);

        // --- VALIDAZIONE OPZIONALE POST-AI ---
        // Esempio: valida le date e converti eventuali numeri stringa
        const validatedData = { ...extractedData };
        const dateFields = ['dataCostituzione', 'dataIscrizioneRI', 'dataInizioAttivita', 'dataRiferimentoAddetti'];
        dateFields.forEach(field => {
            if (validatedData[field] && !isValidISODateString(validatedData[field])) {
                console.warn(`AI ha restituito una data non valida per ${field}: ${validatedData[field]}. Impostato a null.`);
                validatedData[field] = null;
            }
        });
        // Esempio validazione/conversione numeri (se l'AI restituisse stringhe)
        const numericFields = ['capitaleSociale', 'numeroAddetti', 'numeroAmministratori', 'numeroUnitaLocali'];
        numericFields.forEach(field => {
             if (validatedData[field] !== null && typeof validatedData[field] !== 'number') {
                 const num = Number(validatedData[field]);
                 validatedData[field] = isNaN(num) ? null : num;
                 if(isNaN(num)) console.warn(`AI ha restituito un valore non numerico per ${field}: ${validatedData[field]}. Impostato a null.`);
             }
        });
        // --- FINE VALIDAZIONE OPZIONALE ---

        console.log(">>> Dati Finali (da AI, validati) da inviare:", validatedData);

        res.json({ message: 'Dati estratti con successo tramite AI.', data: validatedData });

    } catch (error) {
        console.error('Errore nel processo di estrazione AI:', error);
        res.status(500).json({ message: `Errore durante l'estrazione AI: ${error.message}` });
    }
});

module.exports = router;

// END OF FILE server/routes/extract.js (AGGIORNATO con OpenAI)