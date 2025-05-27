const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/", (async (req, res) => {
  console.log(`Richiesta GET /api/alerts dall'utente ${req.user.id}`);
  try {
    res.json({
      message: "GET tutti gli alert (protetto - placeholder)",
      data: []
    });
  } catch (err) {
    console.error("Errore in GET /api/alerts:", err.message);
    res.status(500).json({
      message: "Errore del server"
    });
  }
}));

router.put("/:id/read", (async (req, res) => {
  console.log(`Richiesta PUT /api/alerts/${req.params.id}/read dall'utente ${req.user.id}`);
  try {

    res.json({
      message: `Alert ${req.params.id} segnato come letto (protetto - placeholder)`
    });
  } catch (err) {
    console.error(`Errore in PUT /api/alerts/${req.params.id}/read:`, err.message);
    res.status(500).json({
      message: "Errore del server"
    });
  }
}));

module.exports = router;