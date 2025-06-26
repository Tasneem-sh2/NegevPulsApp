const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { Update } = require('./models/Update'); // Assuming you have a defined Update model
require('dotenv').config();

const app = express();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Connect to MongoDB
mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // To handle JSON payloads
app.use(express.urlencoded({ extended: true })); // To handle URL encoded data
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// POST endpoint to submit update data
app.post('/api/submitUpdate', upload.array('images', 10), async (req, res) => {
  try {
    // Extract form data and images from the request
    const { firstName, lastName, villageName, updateType, description } = req.body;
    const images = req.files.map((file) => `/uploads/${file.filename}`);

    // Create a new update document
    const newUpdate = new Update({
      firstName,
      lastName,
      villageName,
      updateType,
      description,
      images,
    });

    // Save the update document to the database
    await newUpdate.save();
    res.status(200).json({ message: 'Update submitted successfully', newUpdate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving update', error });
  }
});

// Start the server
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
