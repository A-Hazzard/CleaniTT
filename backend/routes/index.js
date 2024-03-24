// Express routes for the application
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Report = require('../models/report');
const cloudinary = require('cloudinary').v2;
const geolib = require('geolib');
const exifParser = require('exif-parser');
const ExifReader = require('exifreader');

require('dotenv').config();

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

    let { description, latitude, longitude } = req.body;
    let photoBuffer = req.file.buffer; // Access the file buffer directly
  // Parse the EXIF data
    let parser = exifParser.create(photoBuffer);
    let result = parser.parse();

  // Check if EXIF data contains GPS info
  if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
    latitude = result.tags.GPSLatitude;
    longitude = result.tags.GPSLongitude;
  }else console.log('using current location instead of meta data from image')

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
    const clusters = calculateClusters(reports, 50);
    res.json({ reports, clusters });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

function calculateClusters(reports, radius) {
  const clusters = [];
  const processedReportIds = new Set();

  reports.forEach(report => {
    // Skip if this report has already been processed as part of a cluster
    if (processedReportIds.has(report._id.toString())) {
      return;
    }

    const nearbyReports = reports.filter(otherReport => {
      // Do not compare the report with itself and skip already processed reports
      return report._id.toString() !== otherReport._id.toString() &&
             !processedReportIds.has(otherReport._id.toString()) &&
             geolib.isPointWithinRadius(
               { latitude: report.latitude, longitude: report.longitude },
               { latitude: otherReport.latitude, longitude: otherReport.longitude },
               radius
             );
    });

    // If at least 2 other reports are in the same area (3 reports make a cluster)
    if (nearbyReports.length >= 2) {
      // Mark all reports in this cluster as processed
      nearbyReports.forEach(nr => processedReportIds.add(nr._id.toString()));
      processedReportIds.add(report._id.toString());
      
      // Add the original report to the list
      nearbyReports.push(report);

      // Calculate the center point of the cluster
      const averageCoords = geolib.getCenter(nearbyReports.map(r => ({ latitude: r.latitude, longitude: r.longitude })));

      // Add cluster to list
      clusters.push({
        center: averageCoords,
        count: nearbyReports.length
      });
    }else console.log('no nearby reports')
  });

  return clusters;
}

router.post('/lazyReport', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      consol.error('No file uploaded.');
      return res.status(400).send('No file uploaded.');
    }

    const { description } = req.body;
    const photoBuffer = req.file.buffer;
    let latitude, longitude;

    try {
      const parser = exifParser.create(photoBuffer);
      const result = parser.parse();

      if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
        latitude = result.tags.GPSLatitude;
        longitude = result.tags.GPSLongitude;
      } else {
        console.error('EXIF data is missing GPS information.')
        throw new Error('EXIF data is missing GPS information.');
      }
    } catch (exifError) {
      // Try with exifreader if exif-parser fails
      try {
        const tags = ExifReader.load(photoBuffer);

        if (tags.GPSLatitude && tags.GPSLongitude) {
          latitude = tags.GPSLatitude.description;
          longitude = tags.GPSLongitude.description;
        } else {
          console.error('Location data not found in image EXIF.')
          return res.status(400).send('Location data not found in image EXIF.');
        }
      } catch (exifReaderError) {
        console.error('Could not extract EXIF data with any library.')
        return res.status(400).send('Could not extract EXIF data with any library.');
      }
    }

    // Proceed with Cloudinary upload
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
      photo: uploadResponse.secure_url,
      latitude, 
      longitude 
    });

    await report.save();

    res.status(201).json({ message: 'Lazy report saved', report: report });

  } catch (error) {
    console.error('Error saving lazy report:', error.message);
    res.status(500).send('Server error while saving lazy report.');
  }
});



module.exports = router;
