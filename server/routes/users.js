const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/common'); // Assicurati che l'import del modello sia corretto
const dotenv = require('dotenv');

dotenv.config(); // Carica le variabili d'ambiente (per JWT_SECRET)

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET non è definita nelle variabili d'ambiente.");
    process.exit(1); // Esce se la chiave segreta non è impostata
}

// --- Registrazione Utente ---
// POST /api/users/register
router.post('/register', async (req, res) => {
    const { nome, cognome, email, password, ruolo } = req.body;

    // Validazione input base
    if (!nome || !cognome || !email || !password) {
        return res.status(400).json({ message: 'Per favore, fornisci nome, cognome, email e password.' });
    }

    try {
        // Controlla se l'utente esiste già
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ message: 'Utente già registrato con questa email.' });
        }

        // Crea un nuovo utente con il modello (l'hashing avviene nel pre-save hook)
        user = new User({
            nome,
            cognome,
            email: email.toLowerCase(),
            password, // Verrà hashata dal modello prima del salvataggio
            ruolo: ruolo || 'utente' // Default a 'utente' se non specificato
        });

        // Salva l'utente nel database
        await user.save();

        console.log(`Utente registrato: ${user.email}`);

        // Genera un token JWT per l'utente appena registrato (opzionale, ma comodo)
        const payload = {
            user: {
                id: user.id, // ID generato da MongoDB
                ruolo: user.ruolo
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token scade in 1 ora (modificabile)
            (err, token) => {
                if (err) throw err;
                // Restituisce il token insieme a un messaggio di successo
                res.status(201).json({ 
                    message: 'Utente registrato con successo', 
                    token: token,
                    user: { // Restituisci alcuni dati utente (senza password!)
                        id: user.id,
                        nome: user.nome,
                        cognome: user.cognome,
                        email: user.email,
                        ruolo: user.ruolo
                    }
                });
            }
        );

    } catch (err) {
        console.error("Errore durante la registrazione:", err.message);
        res.status(500).json({ message: 'Errore del server durante la registrazione.' });
    }
});

// --- Login Utente ---
// POST /api/users/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validazione input base
    if (!email || !password) {
        return res.status(400).json({ message: 'Per favore, fornisci email e password.' });
    }

    try {
        // Cerca l'utente per email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Credenziali non valide.' }); // Messaggio generico per sicurezza
        }

        // Confronta la password fornita con quella hashata nel DB
        // Usiamo il metodo comparePassword che abbiamo definito nel modello User
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenziali non valide.' }); // Messaggio generico
        }

        // Se le credenziali sono corrette, genera il token JWT
        const payload = {
            user: {
                id: user.id,
                ruolo: user.ruolo
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Scadenza token
            async (err, token) => {
                if (err) throw err;

                try {
                    // Aggiorna l'ultimo accesso (opzionale)
                    user.ultimo_accesso = Date.now();
                    await user.save();

                    console.log(`Login effettuato da: ${user.email}`);
                    // Restituisci il token e i dati utente (senza password!)
                    res.json({ 
                        message: 'Login effettuato con successo',
                        token: token,
                        user: {
                            id: user.id,
                            nome: user.nome,
                            cognome: user.cognome,
                            email: user.email,
                            ruolo: user.ruolo
                        }
                    });
                } catch (saveError) {
                    console.error("Errore durante l'aggiornamento dell'ultimo accesso:", saveError.message);
                    res.status(500).json({ message: 'Errore del server durante il login.' });
                }
            }
        );

    } catch (err) {
        console.error("Errore durante il login:", err.message);
        res.status(500).json({ message: 'Errore del server durante il login.' });
    }
});

module.exports = router;