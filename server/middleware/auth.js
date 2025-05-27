const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function(req, res, next) {

  const authHeader = req.header("Authorization");

    if (!authHeader) {
    return res.status(401).json({
      message: "Nessun token, autorizzazione negata."
    });
  }

    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7, authHeader.length) : null;

    if (!token) {
    return res.status(401).json({
      message: "Formato token non valido, autorizzazione negata."
    });
  }
  try {

    const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded.user;
    console.log(`Richiesta autenticata per utente ID: ${req.user.id}, Ruolo: ${req.user.ruolo}`);
    next();

    } catch (err) {
    console.error("Errore verifica token:", err.message);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token scaduto."
      });
    }
    res.status(401).json({
      message: "Token non valido."
    });
  }
};