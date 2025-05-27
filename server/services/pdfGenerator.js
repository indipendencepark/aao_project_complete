const puppeteer = require("puppeteer");

const getGiudizioColor = giudizio => {
  switch (giudizio?.toUpperCase()) {
   case "INADEGUATO":
    return "error";

   case "PARZIALMENTE ADEGUATO":
    return "warning";

   case "ADEGUATO":
    return "success";

   case "ADEGUATO (CON GAP MINORI)":
    return "info";

   default:
    return "default";
  }
};

const getRiskColorClass = level => {
  switch (level) {
   case "alto":
    return "risk-alto";

   case "medio":
    return "risk-medio";

   case "basso":
    return "risk-basso";

   default:
    return "risk-default";
  }
};

const getAreaLabel = areaCode => {
  switch (areaCode) {
   case "Org":
    return "Assetto Organizzativo";

   case "Admin":
    return "Assetto Amministrativo";

   case "Acct":
    return "Assetto Contabile";

   case "Crisi":
    return "Rilevazione Crisi";

   default:
    return areaCode || "Altro";
  }
};

const escapeHtml = unsafe => {
  if (typeof unsafe !== "string") return unsafe;
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
};

const cleanAndEscape = text => {
  if (typeof text !== "string") return text;
  const cleanedText = text.replace(/\{\/\*.*?\*\/\}/g, "").trim();
  return escapeHtml(cleanedText);
};

const getPlanStatusLabel = status => status?.replace(/_/g, " ").split(" ").map((w => w.charAt(0).toUpperCase() + w.slice(1))).join(" ") || status || "N/D";

const getPlanStatusColorClass = status => {
  switch (status) {
   case "completato":
    return "success";

   case "in_corso":
    return "primary";

   case "approvato":
    return "info";

   case "annullato":
    return "error";

   case "bozza":
   default:
    return "default";
  }
};

const getInterventionStatusLabel = status => status?.replace(/_/g, " ").split(" ").map((w => w.charAt(0).toUpperCase() + w.slice(1))).join(" ") || status || "N/D";

const getInterventionStatusColorClass = status => {
  switch (status) {
   case "completato":
    return "success";

   case "in_corso":
    return "primary";

   case "approvato":
    return "info";

   case "pianificato":
    return "info";

   case "da_approvare":
    return "secondary";

   case "annullato":
    return "error";

   case "suggerito":
    return "default";

   case "in_attesa":
    return "default";

   default:
    return "default";
  }
};

const getPriorityLabel = priority => priority?.charAt(0).toUpperCase() + priority?.slice(1) || priority || "N/D";

const getPriorityColorClass = priority => {
  switch (priority) {
   case "alta":
    return "error";

   case "media":
    return "warning";

   case "bassa":
    return "success";

   default:
    return "default";
  }
};

const getConformityRowClassCss = valutazione => {
  switch (valutazione?.toUpperCase()) {
   case "INADEGUATO":
    return "non-conforme";

   case "PARZIALMENTE ADEGUATO":
    return "parzialmente-conforme";

   case "ADEGUATO (CON GAP MINORI)":
    return "parzialmente-conforme";

   case "ADEGUATO":
    return "conforme";

   case "NON APPLICABILE":
    return "non-applicabile";

   default:
    return "default";
  }
};

const generateReportHTML = reportData => {
  console.log(">>> [generateReportHTML] Ricevuto sintesi_esecutiva:", reportData.sintesi_esecutiva);
  if (!reportData) return "<html><body><h1>Errore: Dati report mancanti.</h1></body></html>";
  const renderGapList = gaps => {
    if (!gaps || gaps.length === 0) return "<p><i>Nessun gap rilevato.</i></p>";
    return `\n            <div class="gap-list">\n                ${gaps.map((gap => `\n                    <div class="gap-item ${getRiskColorClass(gap.livello_rischio)}">\n                        <div class="gap-header">\n                            <span class="gap-risk ${mapRiskToChipClass(gap.livello_rischio)}">${escapeHtml(gap.livello_rischio?.toUpperCase())}</span>\n                            <span class="gap-id">${escapeHtml(gap.item_id)}:</span>\n                            <span class="gap-desc-title">${cleanAndEscape(gap.descrizione)}</span>\n                        </div>\n                        <div class="gap-details">\n                            <p><strong>Domanda:</strong> ${cleanAndEscape(gap.domandaText || "N/D")}</p>\n                            <p><strong>Implicazioni:</strong> ${cleanAndEscape(gap.implicazioni || "Non specificate")}</p>\n                            ${gap.suggerimenti_ai && gap.suggerimenti_ai.length > 0 ? `\n                                <p><strong>Suggerimenti AI:</strong></p>\n                                <ul>\n                                    ${gap.suggerimenti_ai.map((s => `<li>${cleanAndEscape(s)}</li>`)).join("")}\n                                </ul>\n                            ` : ""}\n                        </div>\n                    </div>\n                `)).join("")}\n            </div>\n        `;
  };
  const renderListItems = (items, iconClass = "check") => {
    if (!items || items.length === 0) return "<li><i>N/D</i></li>";
    return items.map((item => `<li class="${iconClass}">${cleanAndEscape(item)}</li>`)).join("");
  };
  const mapValutazioneToChipClass = valutazione => {
    const giudizioColor = getGiudizioColor(valutazione);
    switch (giudizioColor) {
     case "success":
      return "conforme";

     case "error":
      return "non-conforme";

     case "warning":
      return "parzialmente-conforme";

     case "info":
      return "migliorabile";

     case "default":
      return "non-risposto";

     default:
      return giudizioColor;
    }
  };
  const mapRiskToChipClass = rischioLevel => {
    switch (rischioLevel?.toLowerCase()) {
     case "alto":
      return "non-conforme";

     case "medio":
      return "parzialmente-conforme";

     case "basso":
      return "conforme";

     default:
      return "default";
    }
  };
  return `\n        <!DOCTYPE html>\n        <html lang="it">\n        <head>\n            <meta charset="UTF-8">\n            <title>Report Diagnostico - ${escapeHtml(reportData.clienteInfo?.nome || "Cliente")}</title>\n            <style>\n                /* --- RESET BASE E IMPOSTAZIONI PAGINA --- */
                body { 
                    font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif; /* Font più moderno e leggibile */
                    font-size: 9.5pt; /* Leggermente ridotto per più contenuto, ma testare leggibilità */
                    line-height: 1.5; /* Aumentata interlinea per leggibilità */
                    margin: 0; 
                    color: #333333; /* Nero leggermente più morbido */
                    -webkit-print-color-adjust: exact; /* Forza la stampa dei colori di sfondo */
                }
                .page-container { 
                    /* Il padding viene gestito dai margini di pagina di Puppeteer */
                }

                /* --- TIPOGRAFIA --- */
                h1, h2, h3, h4 { 
                    font-weight: normal; /* Titoli più leggeri, non bold di default */
                    margin-top: 1.2em; 
                    margin-bottom: 0.6em;
                    color: #1A237E; /* Blu scuro principale, già in uso */
                    page-break-after: avoid; /* Evita che un titolo finisca da solo a fondo pagina */
                }
                h1 { 
                    font-size: 20pt; /* Aumentato */
                    border-bottom: 2px solid #3F51B5; /* Blu più chiaro per il bordo */
                    padding-bottom: 8px; 
                    margin-bottom: 20px; /* Più spazio dopo H1 */
                }
                h2 { 
                    font-size: 15pt; /* Aumentato */
                    margin-top: 25px; 
                    border-bottom: 1px solid #7986CB; /* Viola/Blu chiaro per il bordo */
                    padding-bottom: 5px; 
                    color: #303F9F; /* Leggermente più scuro di h1 per gerarchia */
                }
                h3 { 
                    font-size: 12pt; 
                    margin-top: 20px; 
                    color: #3F51B5; 
                    font-weight: 500; /* Semibold per h3 */
                }
                h4 { 
                    font-size: 10.5pt; 
                    margin-top: 15px; 
                    color: #455A64; /* Grigio-blu scuro per sottotitoli */
                    font-weight: bold; 
                }
                p { 
                    margin: 0.5em 0; 
                    text-align: justify; /* Testo giustificato per un look più formale */
                }
                strong, b { 
                    font-weight: 600; /* Leggermente più bold del default */
                }
                ul, ol {
                    padding-left: 20px;
                    margin-top: 0.3em;
                    margin-bottom: 0.8em;
                }
                li {
                    margin-bottom: 0.3em;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 8.5pt; /* Leggermente ridotto per tabelle dense */
                    page-break-inside: auto; /* Permette alle tabelle di spezzarsi se necessario */
                }
                th, td {
                    border: 1px solid #cccccc; /* Bordo più chiaro per tabelle */
                    padding: 6px 8px; /* Più padding */
                    text-align: left;
                    vertical-align: top;
                }
                th {
                    background-color: #f0f4f8; /* Sfondo header tabella più chiaro */
                    font-weight: bold; /* Già bold */
                    color: #2c3e50; /* Colore testo header */
                }

                /* --- LAYOUT E CONTENITORI --- */
                .header-info { 
                    font-size: 9pt; 
                    color: #555555; 
                    margin-bottom: 25px; 
                    padding-bottom: 15px; 
                    border-bottom: 1px solid #e0e0e0; 
                }
                .summary-box { 
                    background-color: #f8f9fa; 
                    border: 1px solid #e0e0e0; 
                    padding: 18px; /* Più padding */
                    margin-bottom: 30px; 
                    border-radius: 4px; /* Bordi leggermente arrotondati */
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05); /* Ombra leggera (potrebbe non essere resa bene in tutti i PDF viewers) */
                    page-break-inside: avoid;
                }
                .executive-summary-content p { /* Classe specifica per i paragrafi dell'executive summary */
                    margin-bottom: 0.8em; 
                    text-align: justify;
                }
                 .executive-summary-content p:first-child {
                    margin-top: 0;
                }

                .area-grid { /* Contenitore per le card delle aree */
                    display: grid; /* Usiamo grid se possibile per Puppeteer moderno */
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); /* Colonne responsive */
                    gap: 15px;
                    margin-bottom: 25px;
                }
                .area-card {
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    padding: 15px;
                    background-color: #ffffff;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    page-break-inside: avoid;
                }
                .area-card h4 { margin-top: 0; margin-bottom: 8px; font-size: 11pt; }
                .area-card .stats { font-size: 8.5pt; color: #666; margin-top: 8px; }
                
                .gap-list { margin-top: 10px; }
                .gap-item {
                    border: 1px solid #e0e0e0;
                    border-left-width: 5px; /* Bordo laterale colorato */
                    border-radius: 3px;
                    padding: 10px 15px;
                    margin-bottom: 12px;
                    background-color: #fff;
                    page-break-inside: avoid;
                }
                /* Colori bordo per rischio gap (già definiti da getRiskColorClass) */
                .gap-item.risk-alto { border-left-color: #f44336; }
                .gap-item.risk-medio { border-left-color: #ff9800; }
                .gap-item.risk-basso { border-left-color: #4caf50; }
                .gap-header { margin-bottom: 8px; }
                .gap-risk { /* Stile per il chip di rischio */
                    padding: 2px 7px;
                    font-size: 7.5pt;
                    border-radius: 10px;
                    color: white;
                    font-weight: bold;
                }
                .gap-item.risk-alto .gap-risk { background-color: #f44336; }
                .gap-item.risk-medio .gap-risk { background-color: #ff9800; }
                .gap-item.risk-basso .gap-risk { background-color: #4caf50; }
                .gap-id { font-weight: bold; color: #555; margin-right: 5px; }
                .gap-desc-title { font-weight: 500; /* Semibold per il titolo del gap */}
                .gap-details p { font-size: 9pt; margin: 4px 0; }
                .gap-details ul { list-style-type: disc; margin-left: 15px; padding-left: 5px; font-size: 9pt; }
                .gap-details li { margin-bottom: 3px;}


                /* --- CHIP (come li hai, ma standardizzati) --- */
                .chip { 
                    display: inline-block; 
                    padding: 4px 10px; /* Leggermente più grandi */
                    font-size: 8.5pt; 
                    border-radius: 12px; 
                    color: white; 
                    font-weight: 500; /* Semibold */
                    margin-left: 5px; 
                    text-transform: capitalize;
                }
                .chip.success, .chip-small.conforme, .chip-small.adeguato-presente { background-color: #4CAF50; }
                .chip.warning, .chip-small.parzialmente-conforme, .chip-small.parzialmente-adeguato { background-color: #FF9800; }
                .chip.error, .chip-small.non-conforme, .chip-small.carente-non-adeguato { background-color: #F44336; }
                .chip.info, .chip-small.migliorabile { background-color: #2196F3; } /* Blu per info */
                .chip.default, .chip-small.non-applicabile, .chip-small.non-risposto, .chip-small.da-verificare-manualmente { background-color: #9E9E9E; }
                .chip-small.fortemente-carente { background-color: #b71c1c; color: white; }

                .chip-small { /* Versione più piccola se serve, ma potresti usare solo .chip */
                    padding: 2px 7px; 
                    font-size: 7.5pt; 
                    border-radius: 10px;
                    /* i colori sono già definiti sopra con la classe principale */
                }
                
                .text-danger { color: #c0392b; /* Rosso più scuro e leggibile */ font-style: normal; }
                .text-muted { color: #7f8c8d; /* Grigio per testo secondario */ }

                /* --- SEZIONI CONFORMITÀ --- */
                .conformity-section { 
                    margin-bottom: 25px; 
                    margin-top: 15px; /* Più spazio prima */
                }
                .conformity-table-container { margin-top: 10px; }
                /* Stili tabelle già definiti sopra */
                
                /* Classi specifiche per righe tabella conformità CNDCEC */
                .conformity-row.non-conforme td { background-color: #ffebee; /* Rosso chiaro */ }
                .conformity-row.parzialmente-conforme td { background-color: #fff3e0; /* Arancio chiaro */ }
                .conformity-row.conforme td { /* Rimosso sfondo verde per non appesantire, il chip è sufficiente */ }
                .conformity-row.non-applicabile td { background-color: #f5f5f5; color: #757575; }
                
                .conformity-item { /* Usato per Doc 4, EBA, SSM, Visti */
                    border: 1px solid #e0e0e0;
                    padding: 12px 15px;
                    margin-bottom: 12px;
                    border-radius: 3px;
                    background-color: #fdfdfd;
                    page-break-inside: avoid;
                }
                .conformity-item h4 { margin-top: 0; margin-bottom: 8px; font-size: 11pt; }
                .conformity-item p { font-size: 9pt; }
                .conformity-item ul { font-size: 9pt; }

                /* --- SEZIONE SUGGERIMENTI PIANO AZIONE E RACCOMANDAZIONI --- */
                .action-suggestions ul, .recommendations ul {
                    list-style-type: none; /* Rimuovi pallini di default se usi icone */
                    padding-left: 0;
                }
                .action-suggestions li, .recommendations li {
                    padding: 8px;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex; /* Per allineare icona e testo se aggiungi icone */
                    align-items: flex-start;
                }
                .action-suggestions li:last-child, .recommendations li:last-child {
                    border-bottom: none;
                }
                 /* Se vuoi icone per le raccomandazioni/suggerimenti: */
                .action-suggestions li::before, .recommendations li::before {
                    /* content: '►'; Potresti usare pseudo-elementi o icone SVG inline */
                    /* font-family: 'Material Icons'; content: '\\e86c'; /* Esempio con icona Material */
                    /* margin-right: 8px; color: var(--colore-secondario); */
                }
                .action-suggestions strong, .recommendations strong {
                    display: block; /* "Gap:" e "Intervento Suggerito:" su righe separate */
                    margin-bottom: 3px;
                }


                /* --- STILI PER LA STAMPA (Puppeteer li usa) --- */
                @media print {
                  body { 
                      font-size: 9pt; /* Leggermente più piccolo per stampa per farci stare più cose */
                      -webkit-print-color-adjust: exact; /* Fondamentale per i colori di sfondo */
                  }
                  .page-container { padding: 0; } /* Margini gestiti da Puppeteer */
                  .summary-box, .area-card, .gap-item, .conformity-item, 
                  .action-suggestions li, .recommendations li,
                  .conformity-table-container table { 
                      page-break-inside: avoid !important; /* Tenta di non spezzare questi elementi */
                  }
                  h1, h2, h3, h4 { page-break-after: avoid !important; }
                  a { text-decoration: none !important; color: inherit !important; } /* Link non sottolineati e neri in stampa */
                }

                /* Add styles for default classes */
                .risk-default { border-left-color: #9E9E9E; } /* Gray border for risk-default */
                .chip.default { background-color: #9E9E9E; } /* Gray background for default chip */
            </style>\n        </head>\n        <body>\n            <div class="page-container">\n                <h1>Report Diagnostico Adeguati Assetti</h1>\n                <div class="header-info">\n                    <p><strong>Cliente:</strong> ${escapeHtml(reportData.clienteInfo?.nome || "N/D")}</p>\n                    <p><strong>Checklist:</strong> ${escapeHtml(reportData.checklistInfo?.nome || "N/D")} (ID: ${escapeHtml(reportData.checklistInfo?.id || "N/D")})</p>\n                    <p><strong>Data Report:</strong> ${(new Date).toLocaleDateString("it-IT")}</p>\n                </div>\n\n\n                <h2>Executive Summary</h2>\n                <div class="summary-box executive-summary-content">
                     <p>${(reportData.sintesi_esecutiva || "ERRORE: Sintesi Esecutiva non definita in reportData.").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>
                </div>\n\n\n                <h2>Analisi per Area</h2>\n                <div class="area-grid">\n                     ${reportData.analisiArea ? Object.entries(reportData.analisiArea).map((([areaCode, giudizio]) => `\n                        <div class="area-card">\n                            <h4>${escapeHtml(getAreaLabel(areaCode))}</h4>\n                            <span class="chip ${mapValutazioneToChipClass(giudizio)}">${escapeHtml(giudizio || "N/D")}</span>\n                            <div class="stats">\n                                Gap: ${reportData.statisticheGap?.countByArea?.[areaCode] || 0}\n                                (A:${reportData.statisticheGap?.riskCountByArea?.[areaCode]?.alto || 0},\n                                M:${reportData.statisticheGap?.riskCountByArea?.[areaCode]?.medio || 0},\n                                B:${reportData.statisticheGap?.riskCountByArea?.[areaCode]?.basso || 0})\n                            </div>\n                        </div>\n                     `)).join("") : "<p>N/D</p>"}\n                </div>\n\n\n                <h2>Elenco Gap Rilevati (${reportData.statisticheGap?.totalGaps || 0})</h2>\n                ${renderGapList(reportData.elencoGapCompleto)}\n                \n                <h2>Conformità Check-list CNDCEC (Doc. 1)</h2>\n                <div class="conformity-table-container">\n                    <table>\n                        <thead>\n                            <tr>\n                                <th style="width: 10%;">Punto</th>\n                                <th style="width: 35%;">Descrizione Punto CNDCEC</th>\n                                <th style="width: 15%;">Risposta Data</th>\n                                <th style="width: 15%;">Valutazione</th>\n                                <th style="width: 25%;">Note / Gap Correlato</th>\n                            </tr>\n                        </thead>\n                        <tbody>\n                            ${reportData.analisiConformita && reportData.analisiConformita.cndcec && reportData.analisiConformita.cndcec.length > 0 ? reportData.analisiConformita.cndcec.map((item => {
    let rispostaClass = "default";
    const rispostaLower = item.rispostaUtente?.toLowerCase();
    if (rispostaLower === "sì" || rispostaLower === "si") rispostaClass = "conforme"; else if (rispostaLower === "no") rispostaClass = "non-conforme"; else if (rispostaLower === "parziale") rispostaClass = "parzialmente-conforme"; else if (rispostaLower === "non applicabile" || rispostaLower === "n.a." || rispostaLower === "na") rispostaClass = "non-applicabile";
    return `\n                                    <tr class="conformity-row ${getConformityRowClassCss(item.valutazioneConformita)}">\n                                        <td>${escapeHtml(item.puntoCNDCEC)}</td>\n                                        <td>\n                                            ${escapeHtml(item.descrizionePunto)}\n                                            ${item.fonteNormativaPunto ? `<br/><small class="text-muted"><em>Fonte: ${escapeHtml(item.fonteNormativaPunto)}</em></small>` : ""}\n                                        </td>\n                                        <td><span class="chip-small ${rispostaClass}">${escapeHtml(item.rispostaUtente)}</span></td>\n                                        <td><span class="chip-small ${mapValutazioneToChipClass(item.valutazioneConformita)}">${escapeHtml(item.valutazioneConformita)}</span></td>\n                                        <td>\n                                            ${item.noteGap ? `<span class="text-danger"><strong>Gap:</strong> ${escapeHtml(item.noteGap)}</span>` : ""}\n                                            ${item.notaUtenteChecklist ? `${item.noteGap ? "<br/>" : ""}<span class="text-muted"><em>Nota Utente: ${escapeHtml(item.notaUtenteChecklist)}</em></span>` : ""}\n                                            ${!item.noteGap && !item.notaUtenteChecklist && (item.valutazioneConformita === "Adeguato" || item.valutazioneConformita === "Non Applicabile") ? "<em>OK</em>" : ""}\n                                            ${!item.noteGap && !item.notaUtenteChecklist && item.valutazioneConformita && item.valutazioneConformita !== "Adeguato" && item.valutazioneConformita !== "Non Applicabile" ? "<em>Verificare</em>" : ""}\n                                        </td>\n                                    </tr>\n                                `;
  })).join("") : '<tr><td colspan="5" style="text-align:center;"><i>Nessun dato di conformità CNDCEC disponibile.</i></td></tr>'}\n                        </tbody>\n                    </table>\n                </div>\n\n\n                <h2>Conformità Sistemi di Allerta Interna (Rif. Quaderno 71 ODCEC MI / CCII)</h2>\n                <div class="conformity-section">\n                    ${reportData.analisiConformita && reportData.analisiConformita.sistemiAllertaCCII && reportData.analisiConformita.sistemiAllertaCCII.length > 0 ? reportData.analisiConformita.sistemiAllertaCCII.map((item => `\n                            <div class="conformity-item">\n                                <h4>${escapeHtml(item.aspettoValutato)}</h4>\n                                <p><strong>Valutazione:</strong> <span class="chip chip-small ${mapValutazioneToChipClass(item.valutazioneConformita)}">${escapeHtml(item.valutazioneConformita)}</span></p>\n                                ${item.risposteRilevanti && item.risposteRilevanti.length > 0 ? `\n                                    <p><strong>Risposte Checklist Rilevanti:</strong></p>\n                                    <ul>\n                                        ${item.risposteRilevanti.map((r => `<li>${escapeHtml(r.itemId)}: "${escapeHtml(r.domandaText)}" - Risposta: <strong>${escapeHtml(r.risposta)}</strong></li>`)).join("")}\n                                    </ul>\n                                ` : ""}\n                                ${item.noteOsservazioni ? `<p><strong>Osservazioni Dettagliate:</strong> ${escapeHtml(item.noteOsservazioni)}</p>` : ""}\n                                ${item.implicazioniNonConformitaTestuali ? `<p><strong>Possibili Implicazioni (CCII):</strong> <span class="text-danger">${escapeHtml(item.implicazioniNonConformitaTestuali)}</span></p>` : ""}\n                            </div>\n                        `)).join('<hr style="border:0; border-top: 1px dashed #eee; margin: 10px 0;"/>') : "<p><i>Nessun dato di conformità per i sistemi di allerta disponibile.</i></p>"}\n                </div>\n\n                <h2>Valutazione Rispetto Linee Guida EBA (Doc. 3)</h2>\n                <div class="conformity-section">\n                    ${reportData.analisiConformita && reportData.analisiConformita.eba && reportData.analisiConformita.eba.length > 0 ? reportData.analisiConformita.eba.map((item => `\n                            <div class="conformity-item">\n                                <h4>${escapeHtml(item.principioEBA)}</h4>\n                                <p><strong>Valutazione AI:</strong> ${escapeHtml(item.valutazioneAI)}</p>\n                                \n                            </div>\n                        `)).join('<hr style="border:0; border-top: 1px dashed #eee; margin: 10px 0;"/>') : "<p><i>Nessun dato di conformità EBA disponibile.</i></p>"}\n                </div>\n\n                <h2>Considerazioni sull'Art. 2086 c.c. (Rif. Quaderno 18 SSM)</h2>\n                <div class="conformity-section">\n                     ${reportData.valutazioneQualitativaAAO && reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM ? `\n                            <div class="conformity-item">\n                                <h4>Aderenza ai Doveri ex Art. 2086 c.c.</h4>\n                                <p><strong>Commento AI:</strong> ${escapeHtml(reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM.valutazioneTestuale)}</p>\n                                ${reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM.gapCriticiRilevantiArt2086 && reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM.gapCriticiRilevantiArt2086.length > 0 ? `<p><small><em>Riferimento a Gap IDs critici: ${reportData.valutazioneQualitativaAAO.aderenzaArt2086SSM.gapCriticiRilevantiArt2086.join(", ")}</em></small></p>` : ""}\n                            </div>\n                        ` : reportData.analisiConformita && reportData.analisiConformita.ssmArt2086 && reportData.analisiConformita.ssmArt2086.length > 0 ? reportData.analisiConformita.ssmArt2086.map((item => `\n                                <div class="conformity-item">\n                                    <h4>${escapeHtml(item.aspettoSSM)}</h4>\n                                    <p><strong>Commento AI:</strong> ${escapeHtml(item.commentoAI)}</p>\n                                </div>\n                            `)).join("") : "<p><i>Nessun commento sull'aderenza all'art. 2086 c.c. (SSM) disponibile.</i></p>"}\n                </div>\n\n                <h2>Predisposizione per Visti di Conformità/Congruità (Rif. LG CNDCEC 2021)</h2>\n                <div class="conformity-section">\n                    ${reportData.analisiConformita && reportData.analisiConformita.predisposizioneVistiCNDCEC && reportData.analisiConformita.predisposizioneVistiCNDCEC.length > 0 ? reportData.analisiConformita.predisposizioneVistiCNDCEC.map((item => `\n                            <div class="conformity-item">\n                                <h4>${escapeHtml(item.requisitoVisto)}</h4>\n                                <p><strong>Parere Preliminare AI:</strong> ${escapeHtml(item.parerePreliminareAI)}</p>\n                            </div>\n                        `)).join('<hr style="border:0; border-top: 1px dashed #eee; margin: 10px 0;"/>') : "<p><i>Nessuna analisi sulla predisposizione per i Visti CNDCEC disponibile.</i></p>"}\n                </div>\n\n                <h2>Suggerimenti Iniziali per Piano d'Azione</h2>\n                 <div class="action-suggestions">
                     ${reportData.suggerimentiPianoAzioneIniziale && reportData.suggerimentiPianoAzioneIniziale.length > 0 ?
                        `<ul>${reportData.suggerimentiPianoAzioneIniziale.map(sugg => `
                             <li>
                                 <div>
                                     <strong>Gap:</strong> ${escapeHtml(sugg.titoloGap)} <span class="chip-small ${mapRiskToChipClass(sugg.rischioGap)}">${escapeHtml(sugg.rischioGap)}</span><br/>
                                     <strong>Intervento Suggerito (da AI Gap):</strong> ${escapeHtml(sugg.interventoSuggerito)}
                                 </div>
                             </li>`).join("")}</ul>` :
                        "<p><i>Nessun suggerimento specifico...</i></p>"
                     }
                 </div>\n                 \n                 <h2>Raccomandazioni Generali</h2>\n                 <div class="recommendations">
                     ${reportData.raccomandazioniGenerali && reportData.raccomandazioniGenerali.length > 0 && !(reportData.raccomandazioniGenerali.length === 1 && reportData.raccomandazioniGenerali[0].toLowerCase().includes("errore"))
                        ? `<ul>${reportData.raccomandazioniGenerali.map(rec => `<li>${escapeHtml(rec)}</li>`).join("")}</ul>`
                        : '<p><i>Nessuna raccomandazione specifica generata o errore durante la generazione.</i></p>'
                     }
                 </div>\n\n            </div>\n        </body>\n        </html>\n    `;
};

const generateActionPlanHTML = planData => {
  if (!planData) return "<html><body><h1>Errore: Dati piano mancanti.</h1></body></html>";
  const formatDate = dateString => {
    if (!dateString) return "N/D";
    try {
      return new Date(dateString).toLocaleDateString("it-IT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
    } catch (e) {
      return "Data non valida";
    }
  };
  const renderIntervento = (intervento, index) => {
    if (!intervento) return "";
    return `\n            <div class="intervento-item">\n                <h4>${index + 1}. ${escapeHtml(intervento.titolo || "N/D")}</h4>\n                <div class="intervento-meta">\n                    <span><strong>Area:</strong> ${escapeHtml(getAreaLabel(intervento.area))}</span> |\n                    <span><strong>Priorità:</strong> <span class="chip-inline ${getPriorityColorClass(intervento.priorita)}">${escapeHtml(getPriorityLabel(intervento.priorita))}</span></span> |\n                    <span><strong>Stato:</strong> <span class="chip-inline ${getInterventionStatusColorClass(intervento.stato)}">${escapeHtml(getInterventionStatusLabel(intervento.stato))}</span></span> |\n                    <span><strong>Compl.:</strong> ${intervento.completamento_perc ?? 0}%</span>\n                </div>\n                <div class="intervento-details">\n                    <p><strong>Descrizione:</strong> ${cleanAndEscape(intervento.descrizione || "Nessuna descrizione.")}</p>\n                    <p><strong>Responsabile:</strong> ${escapeHtml(intervento.responsabile || "Non assegnato")}</p>\n                    <p><strong>Tempistica Stimata:</strong> ${escapeHtml(intervento.tempistica_stimata || "Non definita")}</p>\n                    <p><strong>Risorse Necessarie:</strong> ${escapeHtml(intervento.risorse_necessarie || "Non definite")}</p>\n                    <p>\n                        <strong>Date:</strong>\n                        Inizio Prev.: ${formatDate(intervento.data_inizio_prevista)} |\n                        Fine Prev.: ${formatDate(intervento.data_fine_prevista)} |\n                        Compl. Eff.: ${formatDate(intervento.data_completamento_effettiva)}\n                    </p>\n                    ${intervento.note_avanzamento ? `<p><strong>Note Avanzamento:</strong> ${cleanAndEscape(intervento.note_avanzamento)}</p>` : ""}\n                    \n                </div>\n            </div>\n        `;
  };
  return `\n        <!DOCTYPE html>\n        <html lang="it">\n        <head>\n            <meta charset="UTF-8">\n            <title>Piano d'Azione - ${escapeHtml(planData.titolo || "Piano")}</title>\n            <style>\n                body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 10pt; line-height: 1.4; color: #333; }\n                .page-container { padding: 15mm; }\n                h1, h2, h3, h4 { margin-bottom: 0.5em; margin-top: 1em; color: #1a237e; font-weight: normal; }\n                h1 { font-size: 18pt; border-bottom: 2px solid #7986cb; padding-bottom: 5px; }\n                h2 { font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #c5cae9; padding-bottom: 3px; color: #303f9f; }\n                h3 { font-size: 12pt; margin-top: 15px; color: #3f51b5;}\n                h4 { font-size: 11pt; margin-top: 12px; margin-bottom: 3px; color: #3f51b5; font-weight: bold; }\n                p { margin: 0.3em 0; }\n                strong { font-weight: bold; }\n                .header-info, .plan-details { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }\n                .plan-details p { font-size: 9.5pt; }\n                .interventi-section { margin-top: 25px; }\n                .intervento-item {\n                    border: 1px solid #e0e0e0;\n                    border-left: 4px solid #1976d2; \n                    padding: 10px 15px;\n                    margin-bottom: 15px;\n                    border-radius: 4px;\n                    background-color: #fdfdfd;\n                    page-break-inside: avoid; \n                }\n                \n                .intervento-item.priority-alta { border-left-color: #d32f2f; }\n                .intervento-item.priority-media { border-left-color: #ed6c02; }\n                .intervento-item.priority-bassa { border-left-color: #2e7d32; }\n\n                .intervento-meta { font-size: 8.5pt; color: #666; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 1px dashed #eee; }\n                .intervento-meta span { margin-right: 10px; }\n                .intervento-details p { font-size: 9pt; margin-bottom: 4px; }\n                .chip-inline {\n                    display: inline-block;\n                    padding: 1px 6px;\n                    font-size: 8pt;\n                    border-radius: 10px;\n                    color: white;\n                    font-weight: bold;\n                    margin-left: 3px;\n                    vertical-align: middle;\n                }\n                \n                .chip-inline.error { background-color: #d32f2f; }\n                .chip-inline.warning { background-color: #ed6c02; }\n                .chip-inline.success { background-color: #2e7d32; }\n                .chip-inline.info { background-color: #0288d1; }\n                .chip-inline.primary { background-color: #1976d2; }\n                .chip-inline.secondary { background-color: #7b1fa2; }\n                .chip-inline.default { background-color: #757575; }\n\n                @media print {\n                  body { font-size: 9pt; }\n                  .page-container { padding: 0; }\n                  .intervento-item { page-break-inside: avoid; }\n                }\n

                /* Add styles for default classes */
                .risk-default { border-left-color: #9E9E9E; } /* Gray border for risk-default */
                .chip.default { background-color: #9E9E9E; } /* Gray background for default chip */
            </style>\n        </head>\n        <body>\n            <div class="page-container">\n                <h1>Piano d'Azione</h1>\n                <div class="header-info">\n                    <h2>${escapeHtml(planData.titolo || "N/D")}</h2>\n                    <p><strong>Cliente:</strong> ${escapeHtml(planData.cliente?.nome || "N/D")}</p>\n                    <p><strong>Stato Piano:</strong> <span class="chip-inline ${getPlanStatusColorClass(planData.stato)}">${escapeHtml(getPlanStatusLabel(planData.stato))}</span></p>\n                    <p><strong>Data Creazione:</strong> ${formatDate(planData.createdAt)}</p>\n                </div>\n\n                <div class="plan-details">\n                    <h3>Dettagli Piano</h3>\n                    <p><strong>Descrizione/Obiettivi:</strong> ${cleanAndEscape(planData.descrizione || "Nessuna descrizione.")}</p>\n                    <p><strong>Responsabile Piano:</strong> ${escapeHtml(planData.responsabile_piano || "Non assegnato")}</p>\n                    <p><strong>Data Inizio:</strong> ${formatDate(planData.data_inizio)}</p>\n                    <p><strong>Data Fine Prevista:</strong> ${formatDate(planData.data_fine_prevista)}</p>\n                    ${planData.note ? `<p><strong>Note Generali Piano:</strong> ${cleanAndEscape(planData.note)}</p>` : ""}\n                    ${planData.checklist_id_origine ? `<p><strong>Checklist Origine:</strong> ID ${escapeHtml(String(planData.checklist_id_origine))}</p>` : ""}\n                </div>\n\n                <div class="interventi-section">\n                    <h2>Interventi Inclusi (${planData.interventi?.length || 0})</h2>\n                    ${planData.interventi && planData.interventi.length > 0 ? planData.interventi.map(((intervento, index) => renderIntervento(intervento, index))).join("") : "<p><i>Nessun intervento associato a questo piano.</i></p>"}\n                </div>\n\n            </div>\n        </body>\n        </html>\n    `;
};

const generatePdfFromReportData = async reportData => {
  console.log(">>> Servizio pdfGenerator: Avvio generazione PDF con Puppeteer...");
  let browser = null;
  try {
    const launchOptions = {
      headless: true,
      args: [ "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--no-first-run", "--no-zygote", "--disable-gpu" ]
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log(`>>> Usando executablePath per Puppeteer: ${launchOptions.executablePath}`);
    } else {
      console.log(">>> Nessun executablePath specifico per Puppeteer, usando quello predefinito.");
    }
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    const reportHtml = generateReportHTML(reportData);
    await page.setContent(reportHtml, {
      waitUntil: "networkidle0"
    });
    console.log(">>> Generazione PDF in corso...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm"
      },
      preferCSSPageSize: true,
      timeout: 0
    });
    console.log(">>> PDF Generato con successo (Buffer ricevuto da page.pdf).");
    console.log(`>>> PDF Generato (${pdfBuffer.length} bytes). Tentativo salvataggio per debug...`);
    try {
      const fs = require("fs").promises;
      const debugPdfPath = `/usr/src/app/pdf_debug_${Date.now()}.pdf`;
      await fs.writeFile(debugPdfPath, pdfBuffer);
      console.log(`>>> PDF di debug salvato in: ${debugPdfPath}`);
    } catch (writeError) {
      console.error(">>> ERRORE scrittura PDF di debug:", writeError);
    }
    await browser.close();
    console.log(">>> Browser Puppeteer chiuso.");
    return pdfBuffer;
  } catch (error) {
    console.error("!!! ERRORE durante la generazione PDF con Puppeteer:", error);
    console.error(error.stack);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {}
    }
    throw new Error(`Generazione PDF fallita: ${error.message}`);
  }
};

const generatePdfFromActionPlanData = async planData => {
  console.log(">>> Servizio pdfGenerator: Avvio generazione PDF Piano Azione...");
  let browser = null;
  try {
    const launchOptions = {
      headless: true,
      args: [ "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-accelerated-2d-canvas", "--no-first-run", "--no-zygote", "--disable-gpu" ]
    };
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    const planHtml = generateActionPlanHTML(planData);
    await page.setContent(planHtml, {
      waitUntil: "networkidle0"
    });
    console.log(">>> Generazione PDF Piano Azione in corso...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm"
      },
      preferCSSPageSize: true,
      timeout: 0
    });
    console.log(`>>> PDF Piano Azione Generato (${pdfBuffer.length} bytes).`);
    await browser.close();
    console.log(">>> Browser Puppeteer chiuso.");
    return pdfBuffer;
  } catch (error) {
    console.error("!!! ERRORE durante la generazione PDF Piano Azione:", error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {}
    }
    throw new Error(`Generazione PDF Piano Azione fallita: ${error.message}`);
  }
};

module.exports = {
  generatePdfFromReportData: generatePdfFromReportData,
  generatePdfFromActionPlanData: generatePdfFromActionPlanData
};