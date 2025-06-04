const express = require("express");

const router = express.Router();

const multer = require("multer"); 

const pdf = require("pdf-parse");

const mammoth = require("mammoth");

const xlsx = require("xlsx");

const {OpenAI: OpenAI} = require("openai");

const dotenv = require("dotenv");

const path = require("path");

dotenv.config({
  path: path.join(__dirname, "../../../.env")
});

const openaiApiKey = process.env.OPENAI_API_KEY;

const modelToUseForExtraction = process.env.OPENAI_MODEL_FOR_EXTRACTION || "gpt-4.1-nano";

const openai = openaiApiKey ? new OpenAI({
  apiKey: openaiApiKey
}) : null;

const upload = multer({
  storage: multer.memoryStorage()
});

async function extractTextFromPdf(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error("Errore estrazione testo da PDF:", error);
    throw new Error("Impossibile estrarre testo da PDF.");
  }
}

async function extractTextFromDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({
      buffer: buffer
    });
    return result.value;
  } catch (error) {
    console.error("Errore estrazione testo da DOCX:", error);
    throw new Error("Impossibile estrarre testo da DOCX.");
  }
}

async function extractTextFromXlsx(buffer) {
  try {
    const workbook = xlsx.read(buffer, {
      type: "buffer"
    });
    let fullText = "";
    workbook.SheetNames.forEach((sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = xlsx.utils.sheet_to_json(worksheet, {
        header: 1
      });
      jsonData.forEach((row => {
        if (Array.isArray(row)) {
          fullText += row.map((cell => cell !== null && cell !== undefined ? String(cell) : "")).join("\t") + "\n";
        }
      }));
      fullText += "\n--- Nuovo Foglio ---\n";
    }));
    return fullText.trim();
  } catch (error) {
    console.error("Errore estrazione testo da XLSX:", error);
    throw new Error("Impossibile estrarre testo da XLSX.");
  }
}

router.post("/", upload.single("file"), (async (req, res) => {
  console.log(">>> Ricevuta richiesta POST /api/extract");
  if (!req.file) {
    return res.status(400).json({
      message: "Nessun file caricato."
    });
  }
  if (!openai) {
    return res.status(503).json({
      message: "Servizio AI non disponibile (OpenAI client non inizializzato)."
    });
  }
  let { contesto, tipoOutputAtteso, istruzioniSpecifiche } = req.body;
  const buffer = req.file.buffer;
  const mimetype = req.file.mimetype;
  let extractedText = "";
  try {
    console.log(`>>> Estrazione testo da file ${req.file.originalname} (MIME: ${mimetype})`);
    if (mimetype === "application/pdf") {
      extractedText = await extractTextFromPdf(buffer);
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      extractedText = await extractTextFromDocx(buffer);
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
      extractedText = await extractTextFromXlsx(buffer);
    } else if (mimetype === "text/plain" || mimetype === "text/markdown" || mimetype === "text/csv") {
      extractedText = buffer.toString("utf8");
    } else {
      return res.status(415).json({
        message: "Tipo file non supportato per estrazione testo diretta."
      });
    }
    if (!extractedText || extractedText.trim().length < 10) {
      console.warn("Testo estratto vuoto o troppo corto:", extractedText);
      return res.status(422).json({
        message: "Estrazione testo non riuscita o testo insufficiente."
      });
    }
    console.log(`>>> Testo estratto (prime 200 chars): ${extractedText.substring(0, 200)}...`);
    console.log(`>>> Testo estratto (ultime 100 chars): ...${extractedText.substring(extractedText.length - 100)}`);
    console.log(`>>> Lunghezza testo estratto: ${extractedText.length} caratteri.`);

    // --- ISTRUZIONI SPECIFICHE PER VISURA ---
    if (contesto && contesto.toLowerCase().includes("visura camerale")) {
      console.log(">>> Rilevato contesto VISURA CAMERALE. Uso prompt specifico.");
      tipoOutputAtteso = "JSON"; // Forziamo JSON per la visura
      istruzioniSpecifiche = `
        Analizza il testo seguente, estratto da una visura camerale italiana, e restituisci un oggetto JSON contenente ESATTAMENTE i seguenti campi, se presenti. Se un campo non è trovato, omettilo o impostalo a null.
        Presta attenzione ai formati (date come YYYY-MM-DD, numeri senza separatori di migliaia se possibile).
        Campi da estrarre:
        - "denominazione": (Stringa, es. "MARTINCART S.R.L.")
        - "indirizzo_sede_legale": (Stringa completa, es. "CORATO (BA) STRADA PROVINCIALE 231 KM.32,750")
        - "cap_sede_legale": (Stringa, es. "70033")
        - "comune_sede_legale": (Stringa, es. "CORATO")
        - "provincia_sede_legale": (Stringa, sigla es. "BA")
        - "pec": (Stringa email PEC)
        - "numero_rea": (Stringa, es. "BA - 156804", estrai solo il numero se possibile es. "156804" e la provincia a parte)
        - "provincia_rea": (Stringa, sigla provincia del REA, es. "BA")
        - "codice_fiscale_ri": (Stringa, codice fiscale dell'impresa)
        - "partita_iva": (Stringa, partita IVA dell'impresa)
        - "codice_lei": (Stringa, se presente)
        - "forma_giuridica": (Stringa, es. "societa' a responsabilita' limitata")
        - "data_costituzione": (Stringa Data, formato YYYY-MM-DD, es. "1972-12-22")
        - "data_iscrizione_ri": (Stringa Data, formato YYYY-MM-DD, es. "1973-02-10")
        - "capitale_sociale": (Numero, es. 249600.00)
        - "stato_attivita": (Stringa, es. "attiva")
        - "data_inizio_attivita": (Stringa Data, formato YYYY-MM-DD, es. "1972-12-22")
        - "attivita_esercitata_descr": (Stringa, descrizione dell'attività)
        - "codice_ateco": (Stringa, es. "46.49.1")
        - "numero_addetti": (Numero, es. 24)
        - "data_riferimento_addetti": (Stringa Data, formato YYYY-MM-DD, dalla riga "Addetti al GG/MM/AAAA")
        - "numero_amministratori": (Numero, es. 3)
        - "numero_organi_controllo": (Numero, es. 1)
        - "tipo_organo_controllo_descr": (Stringa, es. "Sindaco Unico", "Collegio Sindacale")
        - "numero_unita_locali": (Numero, es. 0)
        - "partecipazioni_descr": (Stringa "sì" o "no", o boolean true/false)
        - "sistema_amministrazione_statuto": (Stringa, se "consiglio di amministrazione (in carica)" estrai "consiglio_di_amministrazione"; se "amministratore unico" estrai "amministratore_unico", altrimenti il testo come appare o null)
        - "certificazioni_qualita_elenco": (Array di stringhe, se presenti più certificazioni di qualità, altrimenti stringa singola o null)

        Se trovi l'indirizzo completo, cerca di splittarlo nei campi cap, comune, provincia se non sono già espliciti.
        Per "numero_rea", se è tipo "BA - 12345", estrai "BA" come "provincia_rea" e "12345" come "numero_rea_valore".
        Per "tipo_organo_controllo_descr", se c'è un "Sindaco" e "Numero effettivi: 1" per il collegio sindacale, indica "Sindaco Unico". Se "Numero componenti: 3", indica "Collegio Sindacale".
        Se "Partecipazioni (1)" è "sì", allora "partecipazioni_descr" deve essere "sì".
        Se non riesci ad estrarre un campo specifico, omettilo completamente dalla risposta JSON o impostalo a null.
        Fornisci SOLO l'oggetto JSON valido.
      `;
    } else {
      // Mantieni le istruzioni generiche se il contesto non è visura
      contesto = contesto || "Estrazione generica di informazioni da documento.";
      tipoOutputAtteso = tipoOutputAtteso || "JSON contenente i dati chiave.";
      istruzioniSpecifiche = istruzioniSpecifiche || "Estrai le informazioni chiave in modo strutturato.";
    }
    // --- FINE ISTRUZIONI SPECIFICHE PER VISURA ---

    const systemPrompt = `Sei un assistente AI avanzato specializzato nell'estrazione di informazioni strutturate da testi. L'utente fornirà un testo e delle istruzioni su cosa estrarre. Devi seguire le istruzioni il più fedelmente possibile e restituire l'output nel formato richiesto (JSON se specificato).`;
    
    let userPrompt = `**CONTESTO DELL'ESTRAZIONE:**
${contesto}

`;
    userPrompt += `**TESTO DA CUI ESTRARRE LE INFORMAZIONI (OCR DEL DOCUMENTO):**
---
${extractedText}
---

`;
    userPrompt += `**ISTRUZIONI SPECIFICHE PER L'ESTRAZIONE:**
${istruzioniSpecifiche}

`; // L'istruzione di restituire JSON è già nel prompt specifico per la visura
    
    if (tipoOutputAtteso && tipoOutputAtteso.toLowerCase().includes("json")) {
        userPrompt += `Assicurati che l'output sia ESCLUSIVAMENTE un oggetto JSON valido, senza testo o spiegazioni aggiuntive prima o dopo di esso. Se non ci sono dati da estrarre coerenti con le istruzioni, restituisci un oggetto JSON vuoto {}.`;
    }

    console.log(`>>> Chiamata API OpenAI (${modelToUseForExtraction}) per estrazione strutturata...`);
    const completion = await openai.chat.completions.create({
      model: modelToUseForExtraction,
      messages: [ {
        role: "system",
        content: systemPrompt
      }, {
        role: "user",
        content: userPrompt
      } ],
      temperature: 0.1, // Bassa temperatura per estrazione precisa
      response_format: (tipoOutputAtteso && tipoOutputAtteso.toLowerCase().includes("json")) ? { type: "json_object" } : undefined
    });
    const extractedData = completion.choices[0]?.message?.content;
    if (!extractedData) {
      throw new Error("Risposta AI vuota o non valida per l'estrazione.");
    }
    console.log(">>> Dati estratti da AI:", extractedData);
    res.json({
      message: "Estrazione completata con successo.",
      fileName: req.file.originalname,
      extractedRawTextLength: extractedText.length,
      extractedAIOutput: extractedData
    });
  } catch (error) {
    console.error("!!! Errore durante il processo di estrazione:", error);
    res.status(500).json({
      message: error.message || "Errore del server durante l'estrazione."
    });
  }
}));

module.exports = router;
