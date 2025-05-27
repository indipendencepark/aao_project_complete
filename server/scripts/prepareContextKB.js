
const fs = require("fs").promises;

const path = require("path");

const pdfParse = require("pdf-parse");

const PDF_SOURCE_DIR = path.join(__dirname, "../docs_kb");

const OUTPUT_TEXT_FILE = path.join(__dirname, "../knowledge/concatenated_kb.txt");

const MAX_TOKENS = 9e5;

const DOCUMENT_FILES = [ "2023_07_25_Assetti-organizzativi-amministrativi-e-contabili-check-list-operative_.pdf", "linee guida eba - rapporto finale concessione dei prestiti.pdf", "linee-guida-visto-di-conformita-e-congruita-update-1142021 (1)_210421_080610 (1).pdf", "n-71---sistemi-di-allerta-interna-3.pdf", "SSM Quaderno 18 impag con segnalibri.pdf", "web-guida-redazione-business-plan_210508_204717.pdf", "Osservazione sul documento in pubblica consultazione “Linee Guida per il rilascio del Visto di Conformità e del Visto di Congruità sull’informativa finanziaria aziendale da parte dei commercialisti” firmato.pdf" ];

const estimateTokens = text => Math.ceil(text.length / 3.5);

const cleanHeadersFooters = (text, fileName) => {
  const lines = text.split("\n");
  const lineCounts = {};
  lines.forEach((line => {
    const trimmed = line.trim();
    if (trimmed.length > 5) {

      lineCounts[trimmed] = (lineCounts[trimmed] || 0) + 1;
    }
  }));
  const cleanedLines = lines.filter((line => {
    const trimmed = line.trim();
    const isLikelyHeaderFooter = lineCounts[trimmed] > 3 || // Righe molto ripetute
    /^\s*pagina \d+/i.test(trimmed) || // Contiene "Pagina X"
    /^\s*\d+ di \d+\s*$/i.test(trimmed) || // Contiene "X di Y"
    trimmed.toLowerCase().includes(fileName.split(".")[0].toLowerCase().substring(0, 5));

        return !isLikelyHeaderFooter;
  }));
  return cleanedLines.join("\n");
};

const joinSplitLines = text => text.replace(/([a-zà-ù])-\n([a-zà-ù])/g, "$1$2").replace(/([^\.\?\!])\n([a-zà-ù])/g, "$1 $2")

;

const generalCleanup = text => text.replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n")

;

async function processPDFs() {
  let concatenatedText = "";
  let totalTokens = 0;
  console.log("Avvio processamento PDF per KB...");
  for (const fileName of DOCUMENT_FILES) {
    const filePath = path.join(PDF_SOURCE_DIR, fileName);
    console.log(`--- Processo: ${fileName} ---`);
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdfParse(dataBuffer);
      let text = data.text;

            console.log(`   Testo estratto: ${text.substring(0, 100)}... (Lunghezza: ${text.length})`);

            console.log(`   Applico pulizia...`);
      text = cleanHeadersFooters(text, fileName);
      text = joinSplitLines(text);
      text = generalCleanup(text);
      console.log(`   Pulizia completata. Nuova lunghezza: ${text.length}`);
      const docTokens = estimateTokens(text);
      if (totalTokens + docTokens > MAX_TOKENS) {
        console.warn(`   ATTENZIONE: Aggiungere ${fileName} (${docTokens} token stimati) supererebbe il limite di ${MAX_TOKENS}. Documento saltato.`);
        continue;

            }

            concatenatedText += `--- START DOCUMENT ${fileName} ---\n\n`;
      concatenatedText += text.trim();

            concatenatedText += `\n\n--- END DOCUMENT ${fileName} ---\n\n`;
      totalTokens += docTokens;
      console.log(`   Aggiunto a KB. Token totali stimati: ${totalTokens}`);
    } catch (error) {
      console.error(`!!! ERRORE durante processamento di ${fileName}:`, error.message);
    }
  }

    try {
    await fs.writeFile(OUTPUT_TEXT_FILE, concatenatedText, "utf8");
    console.log(`\nKB concatenata salvata con successo in: ${OUTPUT_TEXT_FILE}`);
    console.log(`Token totali stimati nel file finale: ${totalTokens}`);
  } catch (error) {
    console.error(`!!! ERRORE durante il salvataggio del file ${OUTPUT_TEXT_FILE}:`, error.message);
  }
}

processPDFs();