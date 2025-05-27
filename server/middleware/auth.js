const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware function
module.exports = function(req, res, next) {
    // Prendi il token dall'header Authorization
    // Il formato standard è "Bearer <token>"
    const authHeader = req.header('Authorization');

    // Controlla se l'header esiste
    if (!authHeader) {
        return res.status(401).json({ message: 'Nessun token, autorizzazione negata.' });
    }

    // Estrai il token rimuovendo "Bearer "
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7, authHeader.length) : null;

    // Controlla se il token esiste dopo l'estrazione
    if (!token) {
        return res.status(401).json({ message: 'Formato token non valido, autorizzazione negata.' });
    }

    try {
        // Verifica il token usando la chiave segreta
        const decoded = jwt.verify(token, JWT_SECRET);

        // Aggiungi l'utente decodificato (dal payload del token) all'oggetto request
        // In questo modo le routes successive possono accedere a req.user
        req.user = decoded.user; 
        console.log(`Richiesta autenticata per utente ID: ${req.user.id}, Ruolo: ${req.user.ruolo}`);
        next(); // Passa al prossimo middleware o alla route handler

    } catch (err) {
        console.error('Errore verifica token:', err.message);
        if (err.name === 'TokenExpiredError') {
             return res.status(401).json({ message: 'Token scaduto.' });
        }
        res.status(401).json({ message: 'Token non valido.' });
    }
};