const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // <-- IMPORTA MIDDLEWARE
// Logica di importazione con multer, sheetjs, mammoth.js andrà qui

router.use(authMiddleware); // <-- APPLICA MIDDLEWARE A TUTTE

// POST /api/import/excel - Ora protetta
router.post('/excel', /* upload.single('excelFile'), */ async (req, res) => {
    console.log(`Richiesta POST /api/import/excel dall'utente ${req.user.id}`);
    // Qui ci sarà la logica di upload e parsing di file Excel
    res.status(501).json({ message: 'Importazione Excel (protetta) non ancora implementata' });
});

// POST /api/import/word - Ora protetta
router.post('/word', /* upload.single('wordFile'), */ async (req, res) => {
    console.log(`Richiesta POST /api/import/word dall'utente ${req.user.id}`);
    // Qui ci sarà la logica di upload e parsing di file Word
    res.status(501).json({ message: 'Importazione Word (protetta) non ancora implementata' });
});

module.exports = router;