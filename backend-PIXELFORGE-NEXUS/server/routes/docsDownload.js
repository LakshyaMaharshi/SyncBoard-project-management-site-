const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');

router.get('/api/projects/:projectId/documents/:docId/download', async (req, res) => {
  try {
    const document = await Document.findById(req.params.docId);
    if (!document) return res.status(404).send('Document not found');

    const filePath = document.path;
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    res.setHeader('Content-Type', document.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${document.originalName}"`);
    res.sendFile(path.resolve(filePath));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;