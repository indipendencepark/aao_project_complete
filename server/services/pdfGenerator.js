// START OF FILE server/services/pdfGenerator.js (AGGIORNATO v3 - Pulizia HTML)

const puppeteer = require('puppeteer');

// --- FUNZIONI HELPER PER HTML ---

/**
 * Restituisce la classe CSS per il colore del giudizio.
 * @param {string} giudizio - Es. 'INADEGUATO', 'ADEGUATO'.
 * @returns {string} Classe CSS ('error', 'warning', 'success', 'info', 'default').
 */
const getGiudizioColor = (giudizio) => {
    switch (giudizio?.toUpperCase()) {
        case 'INADEGUATO': return 'error';
        case 'PARZIALMENTE ADEGUATO': return 'warning';
        case 'ADEGUATO': return 'success';
        case 'ADEGUATO (CON GAP MINORI)': return 'info';
        default: return 'default';
    }
};

/**
 * Restituisce la classe CSS per il colore/stile del rischio.
 * @param {string} level - Es. 'alto', 'medio', 'basso'.
 * @returns {string} Classe CSS ('risk-alto', 'risk-medio', 'risk-basso', 'risk-default').
 */
const getRiskColorClass = (level) => {
    switch (level) {
        case 'alto': return 'risk-alto';
        case 'medio': return 'risk-medio';
        case 'basso': return 'risk-basso';
        default: return 'risk-default';
    }
};

/**
 * Converte il codice area in un'etichetta leggibile.
 * @param {string} areaCode - Es. 'Org', 'Admin'.
 * @returns {string} Etichetta leggibile.
 */
const getAreaLabel = (areaCode) => {
     switch(areaCode){
         case 'Org': return 'Assetto Organizzativo';
         case 'Admin': return 'Assetto Amministrativo';
         case 'Acct': return 'Assetto Contabile';
         case 'Crisi': return 'Rilevazione Crisi';
         default: return areaCode || 'Altro';
     }
};

/**
 * Esegue l'escape dei caratteri HTML speciali per prevenire XSS.
 * @param {*} unsafe - Il valore da escapare. Se non è stringa, viene restituito com'è.
 * @returns {*} Valore escapato o originale.
 */
const escapeHtml = (unsafe) => {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
};

/**
 * Rimuove i commenti placeholder e applica l'escape HTML.
 * @param {string} text - Testo da pulire.
 * @returns {string} Testo pulito ed escapato.
 */
const cleanAndEscape = (text) => {
    if (typeof text !== 'string') return text;
    const cleanedText = text.replace(/\{\/\*.*?\*\/\}/g, '').trim(); // Regex più generica per rimuovere {/* commento */}
    return escapeHtml(cleanedText);
};

// *** DEFINIZIONI FUNZIONI HELPER MANCANTI/DA COMPLETARE ***

const getPlanStatusLabel = (status) => status?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || status || 'N/D';

const getPlanStatusColorClass = (status) => {
    switch (status) {
        case 'completato': return 'success';
        case 'in_corso': return 'primary';
        case 'approvato': return 'info';
        case 'annullato': return 'error';
        case 'bozza':
        default: return 'default';
    }
};

const getInterventionStatusLabel = (status) => status?.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || status || 'N/D';

const getInterventionStatusColorClass = (status) => {
    switch (status) {
        case 'completato': return 'success';
        case 'in_corso': return 'primary';
        case 'approvato': return 'info';
        case 'pianificato': return 'info'; // Aggiunto se mancava
        case 'da_approvare': return 'secondary';
        case 'annullato': return 'error';
        case 'suggerito': return 'default';
        case 'in_attesa': return 'default'; // Aggiunto se mancava
        default: return 'default';
    }
};

const getPriorityLabel = (priority) => priority?.charAt(0).toUpperCase() + priority?.slice(1) || priority || 'N/D';

const getPriorityColorClass = (priority) => {
    switch (priority) {
        case 'alta': return 'error';
        case 'media': return 'warning';
        case 'bassa': return 'success';
        default: return 'default';
    }
};

// START --- NUOVA FUNZIONE HELPER PER CLASSI RIGA CONFORMITÀ CNDCEC ---
const getConformityRowClassCss = (valutazione) => {
    switch (valutazione?.toUpperCase()) {
        case 'INADEGUATO': return 'non-conforme';
        case 'PARZIALMENTE ADEGUATO': return 'parzialmente-conforme';
        case 'ADEGUATO (CON GAP MINORI)': return 'parzialmente-conforme'; // Map to parzialmente-conforme as it has gaps
        case 'ADEGUATO': return 'conforme';
        case 'NON APPLICABILE': return 'non-applicabile';
        default: return 'default'; // Fallback class
    }
};
// END --- NUOVA FUNZIONE HELPER ---

// *** FINE DEFINIZIONI FUNZIONI HELPER ***

// --- Funzione per generare l'HTML del Report ---
const generateReportHTML = (reportData) => {
    console.log(">>> [generateReportHTML] Ricevuto sintesi_esecutiva:", reportData.sintesi_esecutiva);
    if (!reportData) return '<html><body><h1>Errore: Dati report mancanti.</h1></body></html>';

    // Funzioni helper locali per rendering (come prima)
    const renderGapList = (gaps) => {
        if (!gaps || gaps.length === 0) return '<p><i>Nessun gap rilevato.</i></p>';
        return `
            <div class="gap-list">
                ${gaps.map(gap => `
                    <div class="gap-item ${getRiskColorClass(gap.livello_rischio)}">
                        <div class="gap-header">
                            <span class="gap-risk">${gap.livello_rischio?.toUpperCase()}</span>
                            <span class="gap-id">${escapeHtml(gap.item_id)}:</span>
                            <span class="gap-desc-title">${cleanAndEscape(gap.descrizione)}</span>
                        </div>
                        <div class="gap-details">
                            <p><strong>Domanda:</strong> ${cleanAndEscape(gap.domandaText || 'N/D')}</p>
                            <p><strong>Implicazioni:</strong> ${cleanAndEscape(gap.implicazioni || 'Non specificate')}</p>
                            ${gap.suggerimenti_ai && gap.suggerimenti_ai.length > 0 ? `
                                <p><strong>Suggerimenti AI:</strong></p>
                                <ul>
                                    ${gap.suggerimenti_ai.map(s => `<li>${cleanAndEscape(s)}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const renderListItems = (items, iconClass = 'check') => {
         if (!items || items.length === 0) return '<li><i>N/D</i></li>';
         return items.map(item => `<li class="${iconClass}">${cleanAndEscape(item)}</li>`).join('');
    };

    const mapValutazioneToChipClass = (valutazione) => {
        const giudizioColor = getGiudizioColor(valutazione); // Existing helper
        switch (giudizioColor) {
            case 'success': return 'conforme';
            case 'error': return 'non-conforme';
            case 'warning': return 'parzialmente-conforme';
            case 'info': return 'migliorabile'; // Mapped to 'migliorabile' based on new CSS
            case 'default': return 'non-risposto'; // Mapped to 'non-risposto' based on new CSS
            default: return giudizioColor; // Fallback
        }
    };

    const mapRiskToChipClass = (rischioLevel) => {
        switch (rischioLevel?.toLowerCase()) {
            case 'alto': return 'non-conforme'; // red
            case 'medio': return 'parzialmente-conforme'; // orange
            case 'basso': return 'conforme'; // green
            default: return 'default'; 
        }
    };


    // --- Template HTML ---
    return `
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <title>Report Diagnostico - ${escapeHtml(reportData.clienteInfo?.nome || 'Cliente')}</title>
            <style>
                /* --- Stili CSS Esistenti --- */
                body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; margin: 0; color: #333; }
                .page-container { padding: 15mm; }
                h1, h2, h3, h4 { margin-bottom: 0.5em; margin-top: 1em; color: #1a237e; font-weight: normal; }
                h1 { font-size: 18pt; border-bottom: 2px solid #7986cb; padding-bottom: 5px; }
                h2 { font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #c5cae9; padding-bottom: 3px; color: #303f9f; }
                h3 { font-size: 12pt; margin-top: 15px; color: #3f51b5;}
                h4 { font-size: 10.5pt; margin-top: 10px; color: #3f51b5; font-weight: bold;}
                p { margin: 0.5em 0; }
                strong { font-weight: bold; }
                .header-info { font-size: 9pt; color: #555; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                .summary-box { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin-bottom: 25px; border-radius: 5px; }
                .summary-box h3 { margin-top: 0; font-size: 13pt; }
                /* ... (altri stili esistenti per summary-box, chip, area-grid, gap-list, recommendations) ... */
                .chip { display: inline-block; padding: 3px 8px; font-size: 8pt; border-radius: 10px; color: white; font-weight: bold; margin-left: 5px; }
                .chip.success { background-color: #4caf50; }
                .chip.warning { background-color: #ff9800; }
                .chip.error { background-color: #f44336; }
                .chip.info { background-color: #64b5f6; }
                .chip.default { background-color: #9e9e9e; }
                .chip-small { padding: 2px 6px; font-size: 7pt; border-radius: 8px; color: white; display: inline-block; text-transform: capitalize; }
                .chip-small.conforme { background-color: #4caf50; }
                .chip-small.non-conforme { background-color: #f44336; }
                .chip-small.parzialmente-conforme { background-color: #ff9800; }
                .chip-small.non-applicabile { background-color: #9e9e9e; }
                .chip-small.non-risposto { background-color: #bdbdbd; }
                .chip-small.da-verificare-manualmente { background-color: #757575; }
                .chip-small.adeguato-presente { background-color: #4caf50; } /* Per sistemiAllerta */
                .chip-small.carente-non-adeguato { background-color: #f44336; } /* Per sistemiAllerta */
                .chip-small.fortemente-carente { background-color: #b71c1c; color: white; } /* Rosso scuro per criticità elevate */
                .chip-small.parzialmente-adeguato { background-color: #ff9800; } /* Per sistemiAllerta */
                .chip-small.migliorabile { background-color: #ffc107; } /* Giallo per migliorabile */
                .text-danger { color: #d32f2f; font-style: italic; }
                .text-muted { color: #6c757d; } /* Un grigio standard */


                /* --- NUOVI Stili per Sezioni Conformità --- */
                .conformity-section { margin-bottom: 25px; }
                .conformity-table-container { margin-top: 10px; page-break-inside: auto; } /* Permetti split tabella se lunga */
                .conformity-table-container table { width: 100%; border-collapse: collapse; font-size: 8pt; }
                .conformity-table-container th, .conformity-table-container td { border: 1px solid #ddd; padding: 5px; text-align: left; vertical-align: top; }
                .conformity-table-container th { background-color: #eef2f7; font-weight: bold; }
                .conformity-row.non-conforme td { /* background-color: #ffebee; */ }
                .conformity-row.parzialmente-conforme td { /* background-color: #fff3e0; */ }
                .conformity-item { border: 1px solid #e0e0e0; padding: 10px; margin-bottom: 10px; border-radius: 4px; background-color: #fdfdfd; page-break-inside: avoid; }
                .conformity-item h4 { margin-top: 0; margin-bottom: 8px; font-size: 10pt; color: #303f9f;}
                .conformity-item p { margin: 4px 0; font-size: 9pt; }
                .conformity-item ul { list-style-type: disc; margin-left: 20px; padding-left: 0; font-size: 8.5pt; }
                .action-suggestions { margin-top: 15px; }
                .action-suggestions ul { list-style: none; padding-left: 0;}
                .action-suggestions li { margin-bottom: 8px; padding: 8px; border: 1px solid #eee; border-radius: 4px; background-color: #f9f9f9; page-break-inside: avoid;}
                .action-suggestions strong { display: block; margin-bottom: 3px; }


                /* Stili CSS specifici per gap-list e recommendations (mantenuti da versione precedente se non sovrascritti) */
                .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 10px; }
                .summary-grid h4 { font-size: 10pt; margin-bottom: 8px; color: #555; } /* NB: Esiste un h4 generale sopra, questo è più specifico */
                .summary-grid ul { list-style: none; padding-left: 0; margin: 0; }
                .summary-grid li { font-size: 9pt; margin-bottom: 4px; display: flex; align-items: flex-start; }
                .summary-grid li::before { content: ''; display: inline-block; width: 10px; height: 10px; margin-right: 8px; margin-top: 3px; border-radius: 50%; flex-shrink: 0; }
                .summary-grid li.check::before { background-color: #4caf50; }
                .summary-grid li.cross::before { background-color: #f44336; }
                .area-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 15px; margin-bottom: 25px; }
                .area-card { border: 1px solid #ddd; padding: 12px; text-align: center; border-radius: 4px; background-color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .area-card h4 { font-size: 10pt; margin: 0 0 8px 0; font-weight: bold; color: #3f51b5; } /* NB: Esiste un h4 generale sopra, questo è più specifico */
                .area-card .stats { font-size: 8pt; color: #666; margin-top: 5px; }
                .gap-list .gap-item { border: 1px solid #eee; margin-bottom: 12px; padding: 12px; border-radius: 4px; background-color: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05); page-break-inside: avoid; }
                .gap-list .gap-header { display: flex; align-items: center; margin-bottom: 8px; flex-wrap: wrap; border-bottom: 1px dashed #eee; padding-bottom: 5px; }
                .gap-list .gap-risk { display: inline-block; padding: 2px 7px; font-size: 8pt; border-radius: 8px; color: white; margin-right: 8px; text-transform: uppercase; font-weight: bold; }
                .gap-list .risk-alto { border-left: 3px solid #d32f2f; }
                .gap-list .risk-alto .gap-risk { background-color: #d32f2f; }
                .gap-list .risk-alto .gap-desc-title { color: #d32f2f; }
                .gap-list .risk-medio { border-left: 3px solid #ed6c02; }
                .gap-list .risk-medio .gap-risk { background-color: #ed6c02; }
                .gap-list .risk-medio .gap-desc-title { color: #ed6c02; }
                .gap-list .risk-basso { border-left: 3px solid #2e7d32; }
                .gap-list .risk-basso .gap-risk { background-color: #2e7d32; }
                .gap-list .risk-basso .gap-desc-title { color: #2e7d32; }
                .gap-list .risk-default { border-left: 3px solid #9e9e9e; }
                .gap-list .risk-default .gap-risk { background-color: #9e9e9e; }
                .gap-list .gap-id { font-weight: bold; margin-right: 5px; color: #555; }
                .gap-list .gap-desc-title { font-weight: bold; flex-grow: 1; }
                .gap-list .gap-details { font-size: 9pt; margin-top: 8px; padding-left: 10px; }
                .gap-list .gap-details p { margin: 4px 0; }
                .gap-list .gap-details ul { list-style: disc; padding-left: 25px; margin: 5px 0; }
                .gap-list .gap-details li { font-size: 9pt; }
                .recommendations ul { list-style: none; padding-left: 0; }
                .recommendations li { margin-bottom: 6px; font-size: 10pt; display: flex; align-items: flex-start; }
                .recommendations li.recommend::before { content: '•'; color: #1976d2; margin-right: 8px; font-weight: bold; font-size: 14pt; line-height: 1; }
                 /* Stili per tabelle conformità CNDCEC (mantenuti da v3 per compatibilità se non sovrascritti) */
                .conformity-table-container .conformity-row.non-conforme td { background-color: #ffebee; /* Rosso chiaro per Non Conforme */ }
                .conformity-table-container .conformity-row.parzialmente-conforme td { background-color: #fff3e0; /* Arancio chiaro per Parz. Conforme */ }
                .conformity-table-container .conformity-row.conforme td { background-color: #e8f5e9; /* Verde chiaro per Conforme */ }
                .conformity-table-container .conformity-row.non-applicabile td { background-color: #f5f5f5; color: #757575; }


                @media print {
                  body { font-size: 9pt; }
                  .page-container { padding: 0; }
                  .summary-box, .area-card, .gap-item, .conformity-item, .action-suggestions li { page-break-inside: avoid; }
                  a { text-decoration: none; color: inherit; }
                }
            </style>
        </head>
        <body>
            <div class="page-container">
                <h1>Report Diagnostico Adeguati Assetti</h1>
                <div class="header-info">
                    <p><strong>Cliente:</strong> ${escapeHtml(reportData.clienteInfo?.nome || 'N/D')}</p>
                    <p><strong>Checklist:</strong> ${escapeHtml(reportData.checklistInfo?.nome || 'N/D')} (ID: ${escapeHtml(reportData.checklistInfo?.id || 'N/D')})</p>
                    <p><strong>Data Report:</strong> ${new Date().toLocaleDateString('it-IT')}</p>
                </div>


                <h2>Executive Summary</h2>
                <div class="summary-box">
                     <p>${(reportData.sintesi_esecutiva || "ERRORE: Sintesi Esecutiva non definita in reportData.").replace(/\n/g, '<br/>')}</p>
                </div>


                <h2>Analisi per Area</h2>
                <div class="area-grid">
                     ${reportData.analisiArea ? Object.entries(reportData.analisiArea).map(([areaCode, giudizio]) => `
                        <div class="area-card">
                            <h4>${escapeHtml(getAreaLabel(areaCode))}</h4>
                            <span class="chip ${getGiudizioColor(giudizio)}">${escapeHtml(giudizio || 'N/D')}</span>
                            <div class="stats">
                                Gap: ${reportData.statisticheGap?.countByArea?.[areaCode] || 0}
                                (A:${reportData.statisticheGap?.riskCountByArea?.[areaCode]?.alto || 0},
                                M:${reportData.statisticheGap?.riskCountByArea?.[areaCode]?.medio || 0},
                                B:${reportData.statisticheGap?.riskCountByArea?.[areaCode]?.basso || 0})
                            </div>
                        </div>
                     `).join('') : '<p>N/D</p>'}
                </div>


                <h2>Elenco Gap Rilevati (${reportData.statisticheGap?.totalGaps || 0})</h2>
                ${renderGapList(reportData.elencoGapCompleto)}
                
                <!-- NUOVA SEZIONE: Conformità CNDCEC (Doc 1) -->
                <h2>Conformità Check-list CNDCEC (Doc. 1)</h2>
                <div class="conformity-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 10%;">Punto</th>
                                <th style="width: 35%;">Descrizione Punto CNDCEC</th>
                                <th style="width: 15%;">Risposta Data</th>
                                <th style="width: 15%;">Valutazione</th>
                                <th style="width: 25%;">Note / Gap Correlato</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${reportData.analisiConformita && reportData.analisiConformita.cndcec && reportData.analisiConformita.cndcec.length > 0 
                                ? reportData.analisiConformita.cndcec.map(item => {
                                    let rispostaClass = 'default';
                                    const rispostaLower = item.rispostaUtente?.toLowerCase();
                                    if (rispostaLower === 'sì' || rispostaLower === 'si') rispostaClass = 'conforme';
                                    else if (rispostaLower === 'no') rispostaClass = 'non-conforme';
                                    else if (rispostaLower === 'parziale') rispostaClass = 'parzialmente-conforme';
                                    else if (rispostaLower === 'non applicabile' || rispostaLower === 'n.a.' || rispostaLower === 'na') rispostaClass = 'non-applicabile';
                                    
                                    return `
                                    <tr class="conformity-row ${getConformityRowClassCss(item.valutazioneConformita)}">
                                        <td>${escapeHtml(item.puntoCNDCEC)}</td>
                                        <td>
                                            ${escapeHtml(item.descrizionePunto)}
                                            ${item.fonteNormativaPunto ? `<br/><small class="text-muted"><em>Fonte: ${escapeHtml(item.fonteNormativaPunto)}</em></small>` : ''}
                                        </td>
                                        <td><span class="chip-small ${rispostaClass}">${escapeHtml(item.rispostaUtente)}</span></td>
                                        <td><span class="chip-small ${mapValutazioneToChipClass(item.valutazioneConformita)}">${escapeHtml(item.valutazioneConformita)}</span></td>
                                        <td>
                                            ${item.noteGap ? `<span class="text-danger"><strong>Gap:</strong> ${escapeHtml(item.noteGap)}</span>` : ''}
                                            ${item.notaUtenteChecklist ? `${item.noteGap ? '<br/>' : ''}<span class="text-muted"><em>Nota Utente: ${escapeHtml(item.notaUtenteChecklist)}</em></span>` : ''}
                                            ${!item.noteGap && !item.notaUtenteChecklist && (item.valutazioneConformita === 'Adeguato' || item.valutazioneConformita === 'Non Applicabile') ? '<em>OK</em>' : ''}
                                            ${!item.noteGap && !item.notaUtenteChecklist && item.valutazioneConformita && item.valutazioneConformita !== 'Adeguato' && item.valutazioneConformita !== 'Non Applicabile' ? '<em>Verificare</em>' : ''}
                                        </td>
                                    </tr>
                                `}).join('')
                                : '<tr><td colspan="5" style="text-align:center;"><i>Nessun dato di conformità CNDCEC disponibile.</i></td></tr>'
                            }
                        </tbody>
                    </table>
                </div>


                <!-- NUOVA SEZIONE: Conformità Sistemi Allerta (Doc 4) -->
                <h2>Conformità Sistemi di Allerta Interna (Rif. Quaderno 71 ODCEC MI / CCII)</h2>
                <div class="conformity-section">
                    ${reportData.analisiConformita && reportData.analisiConformita.sistemiAllertaCCII && reportData.analisiConformita.sistemiAllertaCCII.length > 0
                        ? reportData.analisiConformita.sistemiAllertaCCII.map(item => `
                            <div class="conformity-item">
                                <h4>${escapeHtml(item.aspettoValutato)}</h4>
                                <p><strong>Valutazione:</strong> <span class="chip chip-small ${mapValutazioneToChipClass(item.valutazioneConformita)}">${escapeHtml(item.valutazioneConformita)}</span></p>
                                ${item.risposteRilevanti && item.risposteRilevanti.length > 0 ? `
                                    <p><strong>Risposte Checklist Rilevanti:</strong></p>
                                    <ul>
                                        ${item.risposteRilevanti.map(r => `<li>${escapeHtml(r.itemId)}: "${escapeHtml(r.domandaText)}" - Risposta: <strong>${escapeHtml(r.risposta)}</strong></li>`).join('')}
                                    </ul>
                                ` : ''}
                                ${item.noteOsservazioni ? `<p><strong>Osservazioni Dettagliate:</strong> ${escapeHtml(item.noteOsservazioni)}</p>`: ''}
                                ${item.implicazioniNonConformitaTestuali ? `<p><strong>Possibili Implicazioni (CCII):</strong> <span class="text-danger">${escapeHtml(item.implicazioniNonConformitaTestuali)}</span></p>`: ''}
                            </div>
                        `).join('<hr style="border:0; border-top: 1px dashed #eee; margin: 10px 0;"/>')
                        : '<p><i>Nessun dato di conformità per i sistemi di allerta disponibile.</i></p>'
                    }
                </div>

                <!-- NUOVA SEZIONE: Conformità Linee Guida EBA (Doc 3) -->
                <h2>Valutazione Rispetto Linee Guida EBA (Doc. 3)</h2>
                <div class="conformity-section">
                    ${reportData.analisiConformita && reportData.analisiConformita.eba && reportData.analisiConformita.eba.length > 0
                        ? reportData.analisiConformita.eba.map(item => `
                            <div class="conformity-item">
                                <h4>${escapeHtml(item.principioEBA)}</h4>
                                <p><strong>Valutazione AI:</strong> ${escapeHtml(item.valutazioneAI)}</p>
                                <!-- Opzionale: mostrare domande correlate se le popoli -->
                            </div>
                        `).join('<hr style="border:0; border-top: 1px dashed #eee; margin: 10px 0;"/>')
                        : '<p><i>Nessun dato di conformità EBA disponibile.</i></p>'
                    }
                </div>

                <!-- NUOVA SEZIONE: Aderenza Art. 2086 c.c. (Doc 5 - SSM) -->
                <h2>Considerazioni sull'Art. 2086 c.c. (Rif. Quaderno 18 SSM)</h2>
                <div class="conformity-section">
                     ${reportData.valutazioneQualitativaAAO && reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM // Modificato per matchare la struttura dati
                        ? `
                            <div class="conformity-item">
                                <h4>Aderenza ai Doveri ex Art. 2086 c.c.</h4>
                                <p><strong>Commento AI:</strong> ${escapeHtml(reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM.valutazioneTestuale)}</p>
                                ${reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM.gapCriticiRilevantiArt2086 && reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM.gapCriticiRilevantiArt2086.length > 0 ?
                                    `<p><small><em>Riferimento a Gap IDs critici: ${reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM.gapCriticiRilevantiArt2086.join(', ')}</em></small></p>` : ''
                                }
                            </div>
                        `
                        : (reportData.analisiConformita && reportData.analisiConformita.ssmArt2086 && reportData.analisiConformita.ssmArt2086.length > 0
                            ? reportData.analisiConformita.ssmArt2086.map(item => `
                                <div class="conformity-item">
                                    <h4>${escapeHtml(item.aspettoSSM)}</h4>
                                    <p><strong>Commento AI:</strong> ${escapeHtml(item.commentoAI)}</p>
                                </div>
                            `).join('')
                            : '<p><i>Nessun commento sull\'aderenza all\'art. 2086 c.c. (SSM) disponibile.</i></p>')
                    }
                </div>

                <!-- NUOVA SEZIONE: Predisposizione Visti CNDCEC (Doc 8) -->
                <h2>Predisposizione per Visti di Conformità/Congruità (Rif. LG CNDCEC 2021)</h2>
                <div class="conformity-section">
                    ${reportData.analisiConformita && reportData.analisiConformita.predisposizioneVistiCNDCEC && reportData.analisiConformita.predisposizioneVistiCNDCEC.length > 0
                        ? reportData.analisiConformita.predisposizioneVistiCNDCEC.map(item => `
                            <div class="conformity-item">
                                <h4>${escapeHtml(item.requisitoVisto)}</h4>
                                <p><strong>Parere Preliminare AI:</strong> ${escapeHtml(item.parerePreliminareAI)}</p>
                            </div>
                        `).join('<hr style="border:0; border-top: 1px dashed #eee; margin: 10px 0;"/>')
                        : '<p><i>Nessuna analisi sulla predisposizione per i Visti CNDCEC disponibile.</i></p>'
                    }
                </div>

                <!-- NUOVA SEZIONE: Suggerimenti Piano Azione -->
                <h2>Suggerimenti Iniziali per Piano d'Azione</h2>
                 <div class="action-suggestions">
                     ${reportData.suggerimentiPianoAzioneIniziale && reportData.suggerimentiPianoAzioneIniziale.length > 0
                         ? `<ul>${reportData.suggerimentiPianoAzioneIniziale.map(sugg => `
                             <li>
                                 <strong>Gap:</strong> ${escapeHtml(sugg.titoloGap)} <span class="chip-small ${mapRiskToChipClass(sugg.rischioGap)}">${escapeHtml(sugg.rischioGap)}</span><br/>
                                 <strong>Intervento Suggerito (da AI Gap):</strong> ${escapeHtml(sugg.interventoSuggerito)}
                             </li>`).join('')}</ul>`
                         : '<p><i>Nessun suggerimento specifico per il piano d\'\'azione prioritario generato. Fare riferimento all\'elenco completo dei gap per definire gli interventi.</i></p>'
                     }
                 </div>
                 
                 <h2>Raccomandazioni Generali</h2>
                 <div class="recommendations">
                     ${reportData.raccomandazioni && reportData.raccomandazioni.length > 0 ? `<ul>${renderListItems(reportData.raccomandazioni, 'recommend')}</ul>` : '<p><i>Nessuna raccomandazione specifica generata.</i></p>'}
                 </div>

            </div>
        </body>
        </html>
    `;
};

// --- *NUOVA* FUNZIONE GENERAZIONE HTML PIANO AZIONE ---
/**
 * Genera una stringa HTML per il Piano d'Azione.
 * @param {object} planData - L'oggetto PianoAzione con interventi popolati.
 * @returns {string} La stringa HTML del piano.
 */
const generateActionPlanHTML = (planData) => {
    if (!planData) return '<html><body><h1>Errore: Dati piano mancanti.</h1></body></html>';

    const formatDate = (dateString) => {
        if (!dateString) return 'N/D';
        try {
            return new Date(dateString).toLocaleDateString('it-IT', { year: 'numeric', month: '2-digit', day: '2-digit' });
        } catch (e) {
            return 'Data non valida';
        }
    };

    // Helper per renderizzare un singolo intervento
    const renderIntervento = (intervento, index) => {
        if (!intervento) return '';
        return `
            <div class="intervento-item">
                <h4>${index + 1}. ${escapeHtml(intervento.titolo || 'N/D')}</h4>
                <div class="intervento-meta">
                    <span><strong>Area:</strong> ${escapeHtml(getAreaLabel(intervento.area))}</span> |
                    <span><strong>Priorità:</strong> <span class="chip-inline ${getPriorityColorClass(intervento.priorita)}">${escapeHtml(getPriorityLabel(intervento.priorita))}</span></span> |
                    <span><strong>Stato:</strong> <span class="chip-inline ${getInterventionStatusColorClass(intervento.stato)}">${escapeHtml(getInterventionStatusLabel(intervento.stato))}</span></span> |
                    <span><strong>Compl.:</strong> ${intervento.completamento_perc ?? 0}%</span>
                </div>
                <div class="intervento-details">
                    <p><strong>Descrizione:</strong> ${cleanAndEscape(intervento.descrizione || 'Nessuna descrizione.')}</p>
                    <p><strong>Responsabile:</strong> ${escapeHtml(intervento.responsabile || 'Non assegnato')}</p>
                    <p><strong>Tempistica Stimata:</strong> ${escapeHtml(intervento.tempistica_stimata || 'Non definita')}</p>
                    <p><strong>Risorse Necessarie:</strong> ${escapeHtml(intervento.risorse_necessarie || 'Non definite')}</p>
                    <p>
                        <strong>Date:</strong>
                        Inizio Prev.: ${formatDate(intervento.data_inizio_prevista)} |
                        Fine Prev.: ${formatDate(intervento.data_fine_prevista)} |
                        Compl. Eff.: ${formatDate(intervento.data_completamento_effettiva)}
                    </p>
                    ${intervento.note_avanzamento ? `<p><strong>Note Avanzamento:</strong> ${cleanAndEscape(intervento.note_avanzamento)}</p>` : ''}
                    <!-- Qui potresti aggiungere i Gap Correlati se necessario -->
                </div>
            </div>
        `;
    };

    // Template HTML principale
    return `
        <!DOCTYPE html>
        <html lang="it">
        <head>
            <meta charset="UTF-8">
            <title>Piano d'Azione - ${escapeHtml(planData.titolo || 'Piano')}</title>
            <style>
                body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #333; }
                .page-container { padding: 15mm; }
                h1, h2, h3, h4 { margin-bottom: 0.5em; margin-top: 1em; color: #1a237e; font-weight: normal; }
                h1 { font-size: 18pt; border-bottom: 2px solid #7986cb; padding-bottom: 5px; }
                h2 { font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #c5cae9; padding-bottom: 3px; color: #303f9f; }
                h3 { font-size: 12pt; margin-top: 15px; color: #3f51b5; }
                h4 { font-size: 11pt; margin-top: 12px; margin-bottom: 3px; color: #3f51b5; font-weight: bold; }
                p { margin: 0.3em 0; }
                strong { font-weight: bold; }
                .header-info, .plan-details { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                .plan-details p { font-size: 9.5pt; }
                .interventi-section { margin-top: 25px; }
                .intervento-item {
                    border: 1px solid #e0e0e0;
                    border-left: 4px solid #1976d2; /* Blu default */
                    padding: 10px 15px;
                    margin-bottom: 15px;
                    border-radius: 4px;
                    background-color: #fdfdfd;
                    page-break-inside: avoid; /* Evita interruzioni di pagina dentro un intervento */
                }
                /* Colora bordo sinistro in base alla priorità */
                .intervento-item.priority-alta { border-left-color: #d32f2f; }
                .intervento-item.priority-media { border-left-color: #ed6c02; }
                .intervento-item.priority-bassa { border-left-color: #2e7d32; }

                .intervento-meta { font-size: 8.5pt; color: #666; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px dashed #eee; }
                .intervento-meta span { margin-right: 10px; }
                .intervento-details p { font-size: 9pt; margin-bottom: 4px; }
                .chip-inline {
                    display: inline-block;
                    padding: 1px 6px;
                    font-size: 8pt;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                    margin-left: 3px;
                    vertical-align: middle;
                }
                /* Colori per priorità e stato (esempio) */
                .chip-inline.error { background-color: #d32f2f; }
                .chip-inline.warning { background-color: #ed6c02; }
                .chip-inline.success { background-color: #2e7d32; }
                .chip-inline.info { background-color: #0288d1; }
                .chip-inline.primary { background-color: #1976d2; }
                .chip-inline.secondary { background-color: #7b1fa2; }
                .chip-inline.default { background-color: #757575; }

                @media print {
                  body { font-size: 9pt; }
                  .page-container { padding: 0; }
                  .intervento-item { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="page-container">
                <h1>Piano d'Azione</h1>
                <div class="header-info">
                    <h2>${escapeHtml(planData.titolo || 'N/D')}</h2>
                    <p><strong>Cliente:</strong> ${escapeHtml(planData.cliente?.nome || 'N/D')}</p>
                    <p><strong>Stato Piano:</strong> <span class="chip-inline ${getPlanStatusColorClass(planData.stato)}">${escapeHtml(getPlanStatusLabel(planData.stato))}</span></p>
                    <p><strong>Data Creazione:</strong> ${formatDate(planData.createdAt)}</p>
                </div>

                <div class="plan-details">
                    <h3>Dettagli Piano</h3>
                    <p><strong>Descrizione/Obiettivi:</strong> ${cleanAndEscape(planData.descrizione || 'Nessuna descrizione.')}</p>
                    <p><strong>Responsabile Piano:</strong> ${escapeHtml(planData.responsabile_piano || 'Non assegnato')}</p>
                    <p><strong>Data Inizio:</strong> ${formatDate(planData.data_inizio)}</p>
                    <p><strong>Data Fine Prevista:</strong> ${formatDate(planData.data_fine_prevista)}</p>
                    ${planData.note ? `<p><strong>Note Generali Piano:</strong> ${cleanAndEscape(planData.note)}</p>` : ''}
                    ${planData.checklist_id_origine ? `<p><strong>Checklist Origine:</strong> ID ${escapeHtml(String(planData.checklist_id_origine))}</p>` : ''}
                </div>

                <div class="interventi-section">
                    <h2>Interventi Inclusi (${planData.interventi?.length || 0})</h2>
                    ${planData.interventi && planData.interventi.length > 0
                        ? planData.interventi.map((intervento, index) => renderIntervento(intervento, index)).join('')
                        : '<p><i>Nessun intervento associato a questo piano.</i></p>'
                    }
                </div>

            </div>
        </body>
        </html>
    `;
};
// --- FINE NUOVA FUNZIONE HTML ---

/**
 * Genera un PDF da un oggetto reportData usando Puppeteer.
 * @param {object} reportData - L'oggetto completo con i dati del report.
 * @returns {Promise<Buffer>} Buffer contenente il PDF generato.
 * @throws {Error} Se la generazione fallisce.
 */
const generatePdfFromReportData = async (reportData) => {
    console.log(">>> Servizio pdfGenerator: Avvio generazione PDF con Puppeteer...");
    let browser = null;
    try {
        const launchOptions = {
             headless: true,
             args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu']
         };
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
             console.log(`>>> Usando executablePath per Puppeteer: ${launchOptions.executablePath}`);
        } else {
             console.log(">>> Nessun executablePath specifico per Puppeteer, usando quello predefinito.");
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // Usa l'HTML PULITO E SICURO generato dalla funzione aggiornata
        const reportHtml = generateReportHTML(reportData);

        await page.setContent(reportHtml, { waitUntil: 'networkidle0' });

        console.log(">>> Generazione PDF in corso...");
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // Mantiene colori/sfondi definiti nel CSS
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
             preferCSSPageSize: true, // Usa dimensioni A4 definite implicitamente
            timeout: 0 // Nessun timeout interno
        });
        console.log(">>> PDF Generato con successo (Buffer ricevuto da page.pdf).");

        // Salvataggio debug (opzionale, puoi commentarlo se non serve più)
        console.log(`>>> PDF Generato (${pdfBuffer.length} bytes). Tentativo salvataggio per debug...`);
        try {
            const fs = require('fs').promises;
            const debugPdfPath = `/usr/src/app/pdf_debug_${Date.now()}.pdf`;
            await fs.writeFile(debugPdfPath, pdfBuffer);
            console.log(`>>> PDF di debug salvato in: ${debugPdfPath}`);
        } catch (writeError) {
            console.error(">>> ERRORE scrittura PDF di debug:", writeError);
        }

        await browser.close();
        console.log(">>> Browser Puppeteer chiuso.");
        return pdfBuffer; // Restituisce il Buffer valido

    } catch (error) {
       console.error("!!! ERRORE durante la generazione PDF con Puppeteer:", error);
        console.error(error.stack);
       if (browser) {
           try { await browser.close(); } catch (closeError) { /* ignora */ }
       }
       throw new Error(`Generazione PDF fallita: ${error.message}`);
    }
};

// --- *NUOVA* FUNZIONE GENERAZIONE PDF PIANO AZIONE ---
/**
 * Genera un PDF da dati di un Piano d'Azione usando Puppeteer.
 * @param {object} planData - L'oggetto PianoAzione con interventi popolati.
 * @returns {Promise<Buffer>} Buffer contenente il PDF generato.
 * @throws {Error} Se la generazione fallisce.
 */
const generatePdfFromActionPlanData = async (planData) => {
    console.log(">>> Servizio pdfGenerator: Avvio generazione PDF Piano Azione...");
    let browser = null;
    try {
        // Opzioni di lancio Puppeteer (riutilizzate)
        const launchOptions = {
             headless: true,
             args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu']
         };
        if (process.env.PUPPETEER_EXECUTABLE_PATH) {
            launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        }
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        // **Usa la NUOVA funzione per generare l'HTML del piano**
        const planHtml = generateActionPlanHTML(planData);

        await page.setContent(planHtml, { waitUntil: 'networkidle0' });

        console.log(">>> Generazione PDF Piano Azione in corso...");
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
            preferCSSPageSize: true,
            timeout: 0
        });
        console.log(`>>> PDF Piano Azione Generato (${pdfBuffer.length} bytes).`);

        await browser.close();
        console.log(">>> Browser Puppeteer chiuso.");
        return pdfBuffer;

    } catch (error) {
       console.error("!!! ERRORE durante la generazione PDF Piano Azione:", error);
       if (browser) { try { await browser.close(); } catch (closeError) { /* ignora */ } }
       throw new Error(`Generazione PDF Piano Azione fallita: ${error.message}`);
    }
};
// --- FINE NUOVA FUNZIONE PDF PIANO ---

// Esporta TUTTE le funzioni necessarie
module.exports = {
    generatePdfFromReportData,
    generatePdfFromActionPlanData // Esporta la nuova funzione
};

// END OF FILE server/services/pdfGenerator.js (AGGIORNATO con HTML Piano Azione)