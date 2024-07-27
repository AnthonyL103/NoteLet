// routes/note-scans.js

'use strict';

const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, TIFF, and PDF are allowed.'));
  }
};

const upload = multer({ storage, fileFilter });

// Route to render the note scan upload form
router.get('/', (req, res) => {
  const username = req.cookies.username;
  
  // Read all saved scan data
  const scansPath = path.join(__dirname, '../scans');
  const scans = [];
  if (fs.existsSync(scansPath)) {
    fs.readdirSync(scansPath).forEach(file => {
      const data = fs.readFileSync(path.join(scansPath, file), 'utf8');
      scans.push(JSON.parse(data));
    });
  }

  // Render the note-scans template with the scans data
  res.render('note-scans', { username, scans });
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
      date: new Date().toISOString(),
      text: text,
      originalName: req.file.originalname
    };

    fs.writeFileSync(path.join(scansPath, `${scanData.id}.json`), JSON.stringify(scanData, null, 2));
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.redirect('/note-scans');
  }).catch(err => {
    console.error(err);
    res.render('note-scans', { error: 'Error processing the scanned note.' });
  });
});

// Route to handle deleting a scan
router.delete('/delete/:id', (req, res) => {
  const scanId = req.params.id;
  const scanFilePath = path.join(__dirname, '../scans', `${scanId}.json`);
  
  if (fs.existsSync(scanFilePath)) {
    fs.unlinkSync(scanFilePath);
    res.status(200).json({ message: 'Scan deleted successfully' });
  } else {
    res.status(404).json({ error: 'Scan not found' });
  }
});


module.exports = router;
