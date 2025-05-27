const express = require("express");

const router = express.Router();

const jwt = require("jsonwebtoken");

const {User: User} = require("../models/common");

const dotenv = require("dotenv");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET non è definita nelle variabili d'ambiente.");
  process.exit(1);

}

router.post("/register", (async (req, res) => {
  const {nome: nome, cognome: cognome, email: email, password: password, ruolo: ruolo} = req.body;

    if (!nome || !cognome || !email || !password) {
    return res.status(400).json({
      message: "Per favore, fornisci nome, cognome, email e password."
    });
  }
  try {

    let user = await User.findOne({
      email: email.toLowerCase()
    });
    if (user) {
      return res.status(400).json({
        message: "Utente già registrato con questa email."
      });
    }

        user = new User({
      nome: nome,
      cognome: cognome,
      email: email.toLowerCase(),
      password: password,

      ruolo: ruolo || "utente"
    });

        await user.save();
    console.log(`Utente registrato: ${user.email}`);

        const payload = {
      user: {
        id: user.id,

        ruolo: user.ruolo
      }
    };
    jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1h"
    }, (// Token scade in 1 ora (modificabile)
    (err, token) => {
      if (err) throw err;

            res.status(201).json({
        message: "Utente registrato con successo",
        token: token,
        user: {

          id: user.id,
          nome: user.nome,
          cognome: user.cognome,
          email: user.email,
          ruolo: user.ruolo
        }
      });
    }));
  } catch (err) {
    console.error("Errore durante la registrazione:", err.message);
    res.status(500).json({
      message: "Errore del server durante la registrazione."
    });
  }
}));

router.post("/login", (async (req, res) => {
  const {email: email, password: password} = req.body;

    if (!email || !password) {
    return res.status(400).json({
      message: "Per favore, fornisci email e password."
    });
  }
  try {

    const user = await User.findOne({
      email: email.toLowerCase()
    });
    if (!user) {
      return res.status(400).json({
        message: "Credenziali non valide."
      });

        }

        const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Credenziali non valide."
      });

        }

        const payload = {
      user: {
        id: user.id,
        ruolo: user.ruolo
      }
    };
    jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1h"
    }, (// Scadenza token
    async (err, token) => {
      if (err) throw err;
      try {

        user.ultimo_accesso = Date.now();
        await user.save();
        console.log(`Login effettuato da: ${user.email}`);

                res.json({
          message: "Login effettuato con successo",
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
        res.status(500).json({
          message: "Errore del server durante il login."
        });
      }
    }));
  } catch (err) {
    console.error("Errore durante il login:", err.message);
    res.status(500).json({
      message: "Errore del server durante il login."
    });
  }
}));

module.exports = router;