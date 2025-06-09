const express = require('express');
const router = express.Router();
const upload = require('../utils/fileUpload');

router.post('/passport-photo', upload.single('file'), (req, res) => {
    try {
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        return res.status(200).json({ url: fileUrl });
    } catch (err) {
        console.error('Upload error:', err);
        return res.status(500).json({ message: 'Failed to upload file' });
    }
});

module.exports = router;

