// Express routes for the application
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Report = require('../models/report');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const path = require('path')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUDNAME , 
  api_key: process.env.CLOUDINARY_APIKEY , 
  api_secret: process.env.CLOUDINARY_SECRET 
});

// Route to handle report submissions
router.post('/reports', upload.single('photo'), async (req, res) => {

  try {
    const { description, latitude, longitude } = req.body;
    const photo = req.file.path;
    console.log(req.body)
    cloudinary.uploader.upload(photo, { public_id: "olympic_flag" }, function(error, result) {
      if (error) {
        console.error('Error uploading image to Cloudinary:', error);
        return res.status(400).send('Error uploading image to Cloudinary: ' + error.message);
      }
      console.log('Image uploaded to Cloudinary:', result);
    });
    const report = new Report({ description, photo, latitude, longitude });
    await report.save();

    res.status(201).send('Report saved');
  } catch (error) {
    console.error('Error saving report: ' + error.message)
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
