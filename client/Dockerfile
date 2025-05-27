# Usa un'immagine Node.js LTS Alpine
FROM node:18-alpine

# Imposta la directory di lavoro per il client
WORKDIR /usr/src/app/client

# Copia package.json e package-lock.json specifici del client
COPY package*.json ./

# Installa le dipendenze del client
RUN npm install

# Copia il resto del codice sorgente del client
COPY . .

# Esponi la porta standard per React development server
EXPOSE 3000

# Comando per avviare il client React in modalità sviluppo
CMD [ "npm", "start" ]