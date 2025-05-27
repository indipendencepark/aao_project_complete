#!/bin/bash
echo "==================================================================="
echo "  Installazione del Sistema di Gestione degli Adeguati Assetti     "
echo "                    Organizzativi (AAO)                            "
echo "==================================================================="
echo ""
echo "Verifica dei prerequisiti..."
if ! command -v node &> /dev/null; then
    echo "Node.js non trovato. È necessario installare Node.js 14.x o superiore."
    exit 1
fi
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
echo "- Node.js versione $NODE_VERSION trovato."
if ! command -v npm &> /dev/null; then
    echo "npm non trovato. È necessario installare npm."
    exit 1
fi
NPM_VERSION=$(npm -v)
echo "- npm versione $NPM_VERSION trovato."
echo "- Nota: MongoDB è necessario per il funzionamento del sistema."
echo "  Assicurati che MongoDB 4.x o superiore sia installato e in esecuzione."
echo ""
INSTALL_DIR="./aao_system"
echo "Creazione directory di installazione in $INSTALL_DIR..."
mkdir -p $INSTALL_DIR
cd $INSTALL_DIR
echo "Copia dei file del progetto..."
cp -r ../aao_project_complete/* .
echo "Installazione delle dipendenze del server..."
npm install
echo "Installazione delle dipendenze del client..."
cd client
npm install
cd ..
echo "Configurazione del database..."
echo "PORT=5000
MONGO_URI=mongodb://localhost:27017/aao_system
JWT_SECRET=aao_secret_key
NODE_ENV=production" > .env
echo "Build del client..."
cd client
npm run build
cd ..
echo ""
echo "==================================================================="
echo "  Installazione completata con successo!                           "
echo "==================================================================="
echo ""
echo "Per avviare il sistema:"
echo "1. Assicurati che MongoDB sia in esecuzione"
echo "2. Esegui 'npm run start' dalla directory $INSTALL_DIR"
echo "3. Accedi all'applicazione all'indirizzo http://localhost:5000"
echo ""
echo "Per ulteriori informazioni, consulta la documentazione:"
echo "- Manuale utente: $INSTALL_DIR/manuale_utente.md"
echo "- Documentazione tecnica: $INSTALL_DIR/documentazione_tecnica.js"
echo ""
echo "Grazie per aver installato il Sistema di Gestione degli AAO!"
