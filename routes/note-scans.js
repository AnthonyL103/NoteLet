const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// Route to render the note scan upload form
router.get('/', (req, res) => {
  const username = req.cookies.username;
  res.render('note-scans', { username });
}); 

// Route to handle file uploads and text extraction
router.post('/', upload.single('note'), (req, res) => {
  const filePath = req.file.path;

  Tesseract.recognize(
    filePath,
    'eng',
    {
      logger: m => console.log(m),
    }
  ).then(({ data: { text } }) => {
    // Save the parsed text to a file or database
    const scansPath = path.join(__dirname, '../scans');
    if (!fs.existsSync(scansPath)) {
      fs.mkdirSync(scansPath);
    }

    const scanData = {
      id: Date.now(),
      text: text,
    };

    fs.writeFileSync(path.join(scansPath, `${scanData.id}.json`), JSON.stringify(scanData, null, 2));
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.render('note-scans', { message: 'Note scanned and text extracted successfully!', scan: scanData });
  }).catch(err => {
    console.error(err);
    res.render('note-scans', { error: 'Error processing the scanned note.' });
  });
});

module.exports = router;