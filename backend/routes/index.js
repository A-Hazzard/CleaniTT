// Express routes for the application
const express = require("express");
const router = express.Router();
const multer = require("multer");
const Report = require("../models/report");
const cloudinary = require("cloudinary").v2;
const geolib = require("geolib");
const exifParser = require("exif-parser");
const ExifReader = require("exifreader");
const User = require("../models/user");
const Activity = require("../models/activity");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUDNAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() }); // Multer configuration with memory storage
// Define difficulty levels and points per material
const difficultyLevels = {
  metal: 10, // Adjust points based on difficulty
  plastic: 5,
  // Add more materials and their corresponding points as needed
};
// Define points levels required for each rank
const rankPointsThresholds = {
  // earthSteward: 5000,
  seedling: 0,
  sapling: 100,
  tree: 500,
  forestGuardian: 1000
};

router.post("/reports", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }

    let { description, latitude, longitude, materials, userID } = req.body;
    const user_id = userID[0];

    // Calculate total points earned based on reported waste materials
    let totalPoints = 0;
    for (const material of Object.keys(materials)) {
      if (difficultyLevels.hasOwnProperty(material)) {
        totalPoints += materials[material] * difficultyLevels[material];
      }
    }

    // Update user's points
    const user = await User.findByIdAndUpdate(user_id, {
      $inc: { points: totalPoints },
    });

    // Check if user's total points exceed the threshold for a higher rank
    let userRank = user.rank;
    for (const [rank, threshold] of Object.entries(rankPointsThresholds)) {
      if (totalPoints >= threshold) {
        userRank = rank;
      }
    }

    // Update user's rank if it has changed
    if (user.rank !== userRank) {
      await User.findByIdAndUpdate(user_id, { rank: userRank });
    }

    // Save activity
    await Activity.create({
      userId: user_id,
      type: "report",
      points: totalPoints,
      // Additional fields as needed
    });

    const photoBuffer = req.file.buffer;
    // Parse the EXIF data
    let parser = exifParser.create(photoBuffer);
    let result = parser.parse();

    // Upload image buffer to Cloudinary using upload_stream
    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "reports" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(photoBuffer);
    });

    // Save Cloudinary URL in the database
    const report = new Report({
      description,
      photo: uploadResponse.secure_url, // Use the secure URL returned by Cloudinary
      latitude,
      longitude,
      userId: user_id,
    });
    await report
      .save()
      .then((savedReport) => {
        console.log("Report saved successfully", savedReport);
        // Handle success, such as sending a response back to the client
      })
      .catch((error) => {
        console.error("Error saving report", error);
        // Handle error, such as sending an error response to the client
      });

    console.log(report);

    res.status(201).send("Report saved");
  } catch (error) {
    console.error("Error saving report:", error.message);
    res.status(400).send("Error saving report: " + error.message);
  }
});

// Route to get report data
router.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find({});
    const clusters = calculateClusters(reports, 50);
    res.json({ reports, clusters });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }

  function calculateClusters(reports, radius) {
    const clusters = [];
    const processedReportIds = new Set();

    reports.forEach((report) => {
      // Skip if this report has already been processed as part of a cluster
      if (processedReportIds.has(report._id.toString())) {
        return;
      }

      const nearbyReports = reports.filter((otherReport) => {
        // Do not compare the report with itself and skip already processed reports
        return (
          report._id.toString() !== otherReport._id.toString() &&
          !processedReportIds.has(otherReport._id.toString()) &&
          geolib.isPointWithinRadius(
            { latitude: report.latitude, longitude: report.longitude },
            {
              latitude: otherReport.latitude,
              longitude: otherReport.longitude,
            },
            radius
          )
        );
      });

      // If at least 2 other reports are in the same area (3 reports make a cluster)
      if (nearbyReports.length >= 2) {
        // Mark all reports in this cluster as processed
        nearbyReports.forEach((nr) =>
          processedReportIds.add(nr._id.toString())
        );
        processedReportIds.add(report._id.toString());

        // Add the original report to the list
        nearbyReports.push(report);

        // Calculate the center point of the cluster
        const averageCoords = geolib.getCenter(
          nearbyReports.map((r) => ({
            latitude: r.latitude,
            longitude: r.longitude,
          }))
        );

        // Add cluster to list
        clusters.push({
          center: averageCoords,
          count: nearbyReports.length,
        });
      } else console.log("no nearby reports");
    });

    return clusters;
  }
});

router.post("/lazyReport", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      consol.error("No file uploaded.");
      return res.status(400).send("No file uploaded.");
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
        console.error("EXIF data is missing GPS information.");
        throw new Error("EXIF data is missing GPS information.");
      }
    } catch (exifError) {
      // Try with exifreader if exif-parser fails
      try {
        const tags = ExifReader.load(photoBuffer);

        if (tags.GPSLatitude && tags.GPSLongitude) {
          latitude = tags.GPSLatitude.description;
          longitude = tags.GPSLongitude.description;
        } else {
          console.error("Location data not found in image EXIF.");
          return res.status(400).send("Location data not found in image EXIF.");
        }
      } catch (exifReaderError) {
        console.error("Could not extract EXIF data with any library.");
        return res
          .status(400)
          .send("Could not extract EXIF data with any library.");
      }
    }

    // Proceed with Cloudinary upload
    const uploadResponse = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "reports" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(photoBuffer);
    });

    // Save Cloudinary URL in the database
    const report = new Report({
      description,
      photo: uploadResponse.secure_url,
      latitude,
      longitude,
    });

    await report.save();

    res.status(201).json({ message: "Lazy report saved", report: report });
  } catch (error) {
    console.error("Error saving lazy report:", error.message);
    res.status(500).send("Server error while saving lazy report.");
  }
});
router.get("/reports/:userId", async (req, res) => {
  try {
    const reports = await Report.find({ userId: req.params.userId });
    const clusters = calculateClusters(reports, 50);
    console.log(clusters);
    res.json({ reports, clusters });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }

  function calculateClusters(reports, radius) {
    const clusters = [];
    const processedReportIds = new Set();

    reports.forEach((report) => {
      // Skip if this report has already been processed as part of a cluster
      if (processedReportIds.has(report._id.toString())) {
        return;
      }

      const nearbyReports = reports.filter((otherReport) => {
        // Do not compare the report with itself and skip already processed reports
        return (
          report._id.toString() !== otherReport._id.toString() &&
          !processedReportIds.has(otherReport._id.toString()) &&
          geolib.isPointWithinRadius(
            { latitude: report.latitude, longitude: report.longitude },
            {
              latitude: otherReport.latitude,
              longitude: otherReport.longitude,
            },
            radius
          )
        );
      });

      // If at least 2 other reports are in the same area (3 reports make a cluster)
      if (nearbyReports.length >= 2) {
        // Mark all reports in this cluster as processed
        nearbyReports.forEach((nr) =>
          processedReportIds.add(nr._id.toString())
        );
        processedReportIds.add(report._id.toString());

        // Add the original report to the list
        nearbyReports.push(report);

        // Calculate the center point of the cluster
        const averageCoords = geolib.getCenter(
          nearbyReports.map((r) => ({
            latitude: r.latitude,
            longitude: r.longitude,
          }))
        );

        // Add cluster to list
        clusters.push({
          center: averageCoords,
          count: nearbyReports.length,
        });
      } else console.log("no nearby reports");
    });

    return clusters;
  }
});

// Route to get user profile
router.get("/profile", async (req, res) => {
  try {
    const { userId } = req.query;
    console.log(userId)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error.message);
    res.status(500).send("Server error");
  }
});

// Update User Profile
// Register route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.error("User already exists");
      return res.status(400).send("User already exists");
    }

    // Create new user
    const newUser = new User({ username, email, password });

    // Save user to database
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error registering user:", error.message);
    res.status(500).send("Server error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.error("Invalid email");
      return res.status(400).send("Invalid credentials");
    }

    // Compare passwords
    if (user.password !== password) {
      console.error("Invalid password");
      return res.status(400).send("Invalid credentials");
    }
    console.log("logged in");
    // Redirect to frontend/index.html upon successful login
    res.status(200).json(user);
  } catch (error) {
    console.error("Error logging in user:", error.message);
    res.status(500).send("Server error");
  }
});

router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    for (const user of users) {
      const activityList = await Activity.find({ userId: user._id });

      let totalPoints = 0;
      for (const activity of activityList) {
        totalPoints += activity.points;
      }
      user.points = totalPoints;
      await user.save();
    }

    users.sort((a, b) => b.points - a.points);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

module.exports = router;
