const fs = require('fs').promises;
const path = require('path');

const KB_TEXT_FILE_PATH = path.join(__dirname, '../knowledge/concatenated_kb.txt');
let fullKnowledgeBaseContent = null;
let kbLoadingPromise = null;

async function getFullKnowledgeBase() {
    if (fullKnowledgeBaseContent !== null) {
        return fullKnowledgeBaseContent;
    }

    if (kbLoadingPromise) {
        return kbLoadingPromise;
    }

    kbLoadingPromise = (async () => {
        try {
            console.log(`>>> Caricamento FULL Knowledge Base da: ${KB_TEXT_FILE_PATH}`);
            const content = await fs.readFile(KB_TEXT_FILE_PATH, 'utf8');
            fullKnowledgeBaseContent = content; // Cache il contenuto
            console.log(`>>> FULL Knowledge Base caricata (${fullKnowledgeBaseContent.length} caratteri).`);
            return fullKnowledgeBaseContent;
        } catch (error) {
            console.error(`!!! ERRORE CRITICO: Impossibile caricare FULL Knowledge Base da ${KB_TEXT_FILE_PATH}`, error);
            fullKnowledgeBaseContent = "ERRORE_CARICAMENTO_KB_COMPLETA"; // Segnaposto
            return fullKnowledgeBaseContent; // Restituisce il segnaposto
        } finally {
            kbLoadingPromise = null; // Resetta la promise dopo il completamento
        }
    })();
    return kbLoadingPromise;
}

module.exports = { getFullKnowledgeBase }; 