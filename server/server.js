const express = require("express");

const mongoose = require("mongoose");

const cors = require("cors");

const bodyParser = require("body-parser");

const path = require("path");

const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5e3;

app.use(cors());

app.use("/api/extract", require("./routes/extract"));

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

const mongoUri = process.env.MONGO_URI || "mongodb://mongodb:27017/aao_system";

console.log(`Tentativo connessione a MongoDB: ${mongoUri}`);

mongoose.connect(mongoUri, {}).then((() => console.log("MongoDB connesso con successo."))).catch((err => {
  console.error("***********************************************");
  console.error("ERRORE DI CONNESSIONE A MONGODB!");
  console.error(`URI Tentato: ${mongoUri}`);
  console.error(`Messaggio Errore: ${err.message}`);
  console.error("Possibili cause:");
  console.error("- Il container mongodb non è in esecuzione o non ha finito l'avvio.");
  console.error('- L\'hostname "mongodb" non è corretto (controlla docker-compose.yml).');
  console.error("- Problemi di rete all'interno di Docker.");
  console.error("***********************************************");
}));

console.log("Configurazione routes API...");

try {
  app.use("/api/checklist", require("./routes/checklist"));
  app.use("/api/formalization", require("./routes/formalization"));
  app.use("/api/assessment", require("./routes/assessment"));
  app.use("/api/report", require("./routes/report"));
  app.use("/api/interventions", require("./routes/interventions"));
  app.use("/api/action-plan", require("./routes/actionPlan"));
  app.use("/api/kpis", require("./routes/kpis"));
  app.use("/api/values", require("./routes/values"));
  app.use("/api/alerts", require("./routes/alerts"));
  app.use("/api/analysis", require("./routes/analysis"));
  app.use("/api/import", require("./routes/import"));
  app.use("/api/users", require("./routes/users"));
  app.use("/api/export", require("./routes/exportPdf"));
  console.log("Routes API configurate.");
} catch (routeError) {
  console.error("!!! ERRORE DURANTE LA CONFIGURAZIONE DELLE ROUTES !!!");
  console.error(routeError);
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  console.log("Modalità produzione: Serving client build...");
  const clientBuildPath = path.resolve(__dirname, "../client/build");
  console.log(`Percorso build client: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));
  app.get("*", ((req, res) => {
    console.log(`Richiesta GET * ricevuta, invio index.html`);
    res.sendFile(path.resolve(clientBuildPath, "index.html"));
  }));
} else {
  console.log("Modalità sviluppo: Il client React è servito dal suo dev server (porta 3000).");
}

app.listen(PORT, (() => {
  console.log(`***********************************************************`);
  console.log(`* Server Node.js in esecuzione sulla porta INTERNA: ${PORT} *`);
  console.log(`* Ambiente: ${process.env.NODE_ENV || "development"}                      *`);
  console.log(`* Accesso Esterno API (via Docker): http://localhost:5001 *`);
  console.log(`* Accesso Frontend (via Docker): http://localhost:3000    *`);
  console.log(`***********************************************************`);
}));

process.on("uncaughtException", (error => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(error);
  process.exit(1);
}));

process.on("unhandledRejection", ((reason, promise) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error("Reason:", reason);
  process.exit(1);
}));