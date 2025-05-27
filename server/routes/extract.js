
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
  const {contesto: contesto, tipoOutputAtteso: tipoOutputAtteso, istruzioniSpecifiche: istruzioniSpecifiche} = req.body;
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
    const systemPrompt = `Sei un assistente AI avanzato specializzato nell'estrazione di informazioni strutturate da testi non strutturati. L'utente fornirà un testo e delle istruzioni su cosa estrarre. Devi seguire le istruzioni il più fedelmente possibile e restituire l'output nel formato richiesto (preferibilmente JSON se non specificato diversamente).`;
    let userPrompt = `**CONTESTO DELL'ESTRAZIONE:**\n${contesto || "Non specificato."}\n\n`;
    userPrompt += `**TESTO DA CUI ESTRARRE LE INFORMAZIONI:**\n---\n${extractedText}\n---\n\n`;
    userPrompt += `**ISTRUZIONI SPECIFICHE PER L'ESTRAZIONE:**\n${istruzioniSpecifiche || "Estrai le informazioni chiave in modo strutturato."}\n\n`;
    userPrompt += `**TIPO DI OUTPUT ATTESO:** ${tipoOutputAtteso || "JSON contenente i dati estratti."}\n`;
    userPrompt += `Assicurati che l'output sia direttamente utilizzabile e ben formattato secondo il tipo richiesto.`;
    if (tipoOutputAtteso && tipoOutputAtteso.toLowerCase().includes("json")) {
      userPrompt += ` Se l'output richiesto è JSON, fornisci solo l'oggetto JSON valido, senza testo o spiegazioni aggiuntive prima o dopo di esso. Se l'estrazione produce una lista di oggetti, restituisci un array JSON. Se non ci sono dati da estrarre coerenti con le istruzioni, restituisci un oggetto JSON vuoto {} o un array JSON vuoto [].`;
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
      temperature: .2,
      response_format: tipoOutputAtteso && tipoOutputAtteso.toLowerCase().includes("json") ? {
        type: "json_object"
      } : undefined
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
