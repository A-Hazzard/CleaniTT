// Express routes for the application
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Report = require('../models/report');
const cloudinary = require('cloudinary').v2;
const exifParser = require('exif-parser');
require('dotenv').config();

// const path = require('path')
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/')
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUDNAME , 
  api_key: process.env.CLOUDINARY_APIKEY , 
  api_secret: process.env.CLOUDINARY_SECRET 
});


const upload = multer({ storage: multer.memoryStorage() }); // Multer configuration with memory storage

router.post('/reports', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const { description, latitude, longitude } = req.body;
    const photoBuffer = req.file.buffer; // Access the file buffer directly
    // Parse the EXIF data
    const parser = exifParser.create(photoBuffer);
    const result = parser.parse();

    // Check if EXIF data contains GPS info
    if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
      latitude = result.tags.GPSLatitude;
      longitude = result.tags.GPSLongitude
      console.log('Found meta location for photo', latitude, longitude)
    }else console.error('No meta data found')
    // Upload image buffer to Cloudinary using upload_stream
    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: "reports" }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      uploadStream.end(photoBuffer);
    });

    // Save Cloudinary URL in the database
    const report = new Report({ 
      description, 
      photo: uploadResponse.secure_url, // Use the secure URL returned by Cloudinary
      latitude, 
      longitude 
    });
    await report.save();

    res.status(201).send('Report saved');
  } catch (error) {
    console.error('Error saving report:', error.message);
    res.status(400).send('Error saving report: ' + error.message);
  }
});





// Route to get report data
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find({});
    console.log('Got reports', reports);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});
module.exports = router;
