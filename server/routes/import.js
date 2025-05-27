const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.post("/excel", ( async (req, res) => {
  console.log(`Richiesta POST /api/import/excel dall'utente ${req.user.id}`);

    res.status(501).json({
    message: "Importazione Excel (protetta) non ancora implementata"
  });
}));

router.post("/word", ( async (req, res) => {
  console.log(`Richiesta POST /api/import/word dall'utente ${req.user.id}`);

    res.status(501).json({
    message: "Importazione Word (protetta) non ancora implementata"
  });
}));

module.exports = router;