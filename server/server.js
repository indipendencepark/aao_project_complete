const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Importa cors
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Carica le variabili d'ambiente dal file .env nella root del progetto
dotenv.config();

// Inizializza l'app Express
const app = express();
// Legge la porta dalle variabili d'ambiente, con un default se non definita
// Questa è la porta SU CUI il server Node.js ascolta DENTRO il container Docker
const PORT = process.env.PORT || 5000;

// --- Configurazione CORS Esplicita ---
// Definisce le opzioni per il middleware CORS
// ...
// ...
// --- Configurazione CORS Aperta (SOLO PER DEBUG) ---
// const corsOptions = { 
//   origin: 'http://localhost:3000',
//   optionsSuccessStatus: 200 
// };
// app.use(cors(corsOptions));
app.use(cors()); // <-- USA QUESTO TEMPORANEAMENTE (permette tutte le origini)
// ----------------------------------------------
app.use('/api/extract', require('./routes/extract'));
// Middleware per il parsing del body delle richieste 
// Permette di leggere req.body nelle richieste POST/PUT/PATCH in formato JSON
app.use(bodyParser.json());
// Permette di leggere req.body da form HTML (meno comune per API ma utile averlo)
app.use(bodyParser.urlencoded({ extended: true }));

// Connessione al database MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/aao_system'; // Usa 'mongodb' come hostname del servizio Docker
console.log(`Tentativo connessione a MongoDB: ${mongoUri}`); // Log dell'URI usato
mongoose.connect(mongoUri, {
  // Le opzioni useNewUrlParser, useUnifiedTopology, useCreateIndex, useFindAndModify
  // sono deprecate in Mongoose 6+ e non più necessarie.
})
.then(() => console.log('MongoDB connesso con successo.'))
.catch(err => {
  // Logga un errore più dettagliato se la connessione fallisce
  console.error('***********************************************');
  console.error('ERRORE DI CONNESSIONE A MONGODB!');
  console.error(`URI Tentato: ${mongoUri}`);
  console.error(`Messaggio Errore: ${err.message}`);
  console.error('Possibili cause:');
  console.error('- Il container mongodb non è in esecuzione o non ha finito l\'avvio.');
  console.error('- L\'hostname "mongodb" non è corretto (controlla docker-compose.yml).');
  console.error('- Problemi di rete all\'interno di Docker.');
  console.error('***********************************************');
  // Considera di uscire dall'applicazione se il DB è essenziale
  // process.exit(1);
});

// Definizione delle API Routes 
// Ogni modulo ha le sue routes specifiche
console.log("Configurazione routes API...");
try {
    // Spostiamo formalization più su
    app.use('/api/checklist', require('./routes/checklist'));
    app.use('/api/formalization', require('./routes/formalization')); // <-- SPOSTATA QUI
    app.use('/api/assessment', require('./routes/assessment'));
    app.use('/api/report', require('./routes/report')); // Nota: questa viene registrata due volte, rimuovine una
    app.use('/api/interventions', require('./routes/interventions'));
    app.use('/api/action-plan', require('./routes/actionPlan'));
    app.use('/api/kpis', require('./routes/kpis'));
    app.use('/api/values', require('./routes/values'));
    app.use('/api/alerts', require('./routes/alerts'));
    app.use('/api/analysis', require('./routes/analysis'));
    app.use('/api/import', require('./routes/import'));
    app.use('/api/users', require('./routes/users'));
    // Rimuovi la seconda registrazione di /api/report se presente
    // app.use('/api/report', require('./routes/report')); // <-- RIMUOVERE DUPLICATO
    app.use('/api/export', require('./routes/exportPdf')); 
    // La vecchia posizione di formalization va rimossa se l'hai spostata

    console.log("Routes API configurate.");
} catch (routeError) {
    console.error("!!! ERRORE DURANTE LA CONFIGURAZIONE DELLE ROUTES !!!");
    console.error(routeError);
    process.exit(1);
}

// Configurazione per servire l'applicazione React buildata in produzione
if (process.env.NODE_ENV === 'production') {
  console.log("Modalità produzione: Serving client build...");
  // Serve i file statici dalla cartella 'build' del client
  const clientBuildPath = path.resolve(__dirname, '../client/build');
  console.log(`Percorso build client: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));

  // Per qualsiasi altra richiesta GET non gestita dalle API, invia l'index.html di React
  // Questo permette a React Router di gestire la navigazione lato client
  app.get('*', (req, res) => {
    console.log(`Richiesta GET * ricevuta, invio index.html`);
    res.sendFile(path.resolve(clientBuildPath, 'index.html'));
  });
} else {
    console.log("Modalità sviluppo: Il client React è servito dal suo dev server (porta 3000).");
}

// Avvia il server sulla porta specificata (interna al container)
app.listen(PORT, () => {
  console.log(`***********************************************************`);
  console.log(`* Server Node.js in esecuzione sulla porta INTERNA: ${PORT} *`);
  // Ricorda che la porta accessibile dall'esterno è definita in docker-compose.yml (es. 5001)
  console.log(`* Ambiente: ${process.env.NODE_ENV || 'development'}                      *`);
  console.log(`* Accesso Esterno API (via Docker): http://localhost:5001 *`);
  console.log(`* Accesso Frontend (via Docker): http://localhost:3000    *`);
  console.log(`***********************************************************`);
});

// Gestione errori non catturati (opzionale ma utile)
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error('Reason:', reason);
  // console.error('Promise:', promise); // Può essere molto verboso
  process.exit(1);
});