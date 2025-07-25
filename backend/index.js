require('dotenv').config(); // Adjust the path as needed
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { User } = require('./models/User');
const Village = require('./models/Village');
const Landmark = require('./models/Landmark');
const Settings = require('./models/Settings');
const Route = require('./models/Route');
const SuperLocalRequest = require('./models/SuperLocalRequest');
const auth = require('./middleware/auth'); // Ensure this path is correct
const bcrypt = require('bcryptjs');
const fs = require('fs');
const landmarksRoute = require('./routes/landmarks');
const villageRoutes = require('./routes/villages.js') ;
const usersRoutes = require('./routes/users');
const router = express.Router();  // Add this line
const routes = require('./routes/routes');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken'); // Add at the top with other requires


const app = express();

const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', usersRoutes);
app.use('/api/routes', routes);
app.use('/api/landmarks', landmarksRoute);
app.use('/api/villages', villageRoutes);
app.use('/api/auth', authRoutes);
// Use village routes
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
        cb(null, `images-${uniqueSuffix}`);
    },
});

const upload = multer({ storage }); // Ensure this is defined only once
// GET /api/users - Fetch all users
app.get('/api/users', async (req, res) => {
    try {
      const users = await User.find().select('-password').sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users'
      });
    }
  });
// Add this email check endpoint before your signup endpoint
app.post("/api/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    res.json({ exists: !!user });
  } catch (error) {
    console.error("Email check error:", error);
    res.status(500).json({ message: "Server error" });
  }
});
// Signup route
// Replace or modify your existing signup route with this:
app.post("/api/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    
    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save hook
      role: role || "local"
    });

    await user.save();
    
    res.status(201).json({ 
      message: "User created successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error.message 
    });
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) return res.status(404).send({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send({ message: "Invalid password" });

    // Include isSuperlocal in the token
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        isSuperlocal: user.isSuperlocal  // <-- This is critical
      },
      process.env.JWTPRIVATEKEY,
      { expiresIn: '1h' }
    );

    res.status(200).send({
      message: "Logged in successfully",
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isSuperlocal: user.isSuperlocal  // Also send to frontend
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send({ message: "Server error" });
  }
});
// Add this middleware to verify admin access
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
};

app.get('/api/fix-user', async (req, res) => {
  try {
    // 1. Delete existing
    await User.deleteMany({email: "test@example.com"});

    // 2. Create and validate before save
    const password = "test123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    console.log('Original hash:', hash);
    
    // 3. Manually create document to avoid middleware issues
    const result = await mongoose.connection.collection('users').insertOne({
      name: "Test User",
      email: "test@example.com",
      password: hash,
      role: "local",
      isSuperlocal: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 4. Verify storage
    const rawDoc = await mongoose.connection.collection('users')
      .findOne({_id: result.insertedId});
    
    console.log('Stored hash:', rawDoc.password);
    console.log('Hash matches:', rawDoc.password === hash);

    // 5. Test comparison
    const valid = await bcrypt.compare(password, rawDoc.password);
    console.log('Database comparison:', valid);

    res.json({
      success: valid,
      storedCorrectly: rawDoc.password === hash,
      dbComparison: valid
    });
  } catch (error) {
    console.error('Fix error:', error);
    res.status(500).json({error: error.message});
  }
});

// GET single village
router.get('/:id', async (req, res) => {
  try {
    const village = await Village.findById(req.params.id);
    if (!village) {
      return res.status(404).json({ error: 'Village not found' });
    }
    res.json(village);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the villages GET endpoint to ensure proper image URLs
app.get('/api/villages', async (req, res) => {
  try {
    const villages = await Village.find();
    
    // Map through villages to ensure proper image URLs
    const villagesWithFullUrls = villages.map(village => ({
      ...village._doc,
      images: village.images.map(img => 
        img.startsWith('http') ? img : `${req.protocol}://${req.get('host')}/${img.replace(/^\//, '')}`
      )
    }));

    res.status(200).json(villagesWithFullUrls);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching villages', 
      error: error.message 
    });
  }
});
app.post('/api/addVillage', async (req, res) => {
    try {
        const { name, description, images } = req.body; // Changed from imageUrl to images
        
        if (!name || !description) {
            return res.status(400).json({ error: "Name and description are required" });
        }

        if (!images || images.length === 0) {
            return res.status(400).json({ error: "At least one image is required" });
        }

        const newVillage = new Village({
            name,
            description,
            images, // Now accepts array directly
            location: {
                type: 'Point',
                coordinates: [0, 0] // Default coordinates
            }
        });

        await newVillage.save();
        res.status(201).json({
            _id: newVillage._id,
            name: newVillage.name,
            description: newVillage.description,
            images: newVillage.images // Return full images array
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ 
            error: "Failed to save village",
            details: error.message 
        });
    }
});
    app.get('/api/villages', async (req, res) => {
        try {
        const villages = await Village.find();
        res.status(200).json(villages);
        } catch (error) {
        res.status(500).json({ message: 'Error fetching villages', error: error.message });
        }
    });
    // نقاط API// API endpoints
app.post('/api/landmarks', async (req, res) => {
  try {
    const landmark = new Landmark({
      ...req.body,
      verified: false,
      votes: []
    });
    await landmark.save();
    res.status(201).json(landmark);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all routes
app.get('/api/routes', async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Get verification radius
app.get('/api/settings/verification-radius', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({ 
      success: true,
      radius: settings?.verificationRadius || 500 // Default 500 meters
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification radius' });
  }
});

app.post('/api/admin/settings/verification-radius', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { radius } = req.body;
    if (!radius || isNaN(radius) || radius < 100 || radius > 5000) {
      return res.status(400).json({ message: 'Radius must be between 100 and 5000 meters' });
    }

    const settings = await Settings.findOneAndUpdate(
      {}, 
      { verificationRadius: radius },
      { upsert: true, new: true }
    );

    res.json({ 
      success: true,
      message: 'Verification radius updated',
      radius: settings.verificationRadius
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating verification radius' });
  }
});

// Create new route
// Add better error handling and validation
app.post('/api/routes', async (req, res) => {
  try {
    const { title, points, color, createdBy } = req.body;
    
    // Basic validation
    if (!title || !points || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (points.length < 2) {
      return res.status(400).json({ error: 'Route must have at least 2 points' });
    }

    const route = new Route({
      title,
      points,
      color: color || '#3A86FF',
      createdBy,
      verified: false,
      votes: []
    });
    
    await route.save();
    res.status(201).json(route);
  } catch (error) {
    console.error('Route creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Add these endpoints to your backend/index.js

// Get verification radius
app.get('/api/settings/verification-radius', auth, async (req, res) => {
  try {
    // Get or create settings
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({ verificationRadius: 500 });
      await settings.save();
    }
    
    res.json({
      success: true,
      radius: settings.verificationRadius
    });
  } catch (error) {
    console.error('Error fetching radius:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching verification radius' 
    });
  }
});

// Update verification radius (admin only)
app.post('/api/admin/settings/verification-radius', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const { radius } = req.body;
    
    // Validate input
    if (!radius || isNaN(radius) || radius < 100 || radius > 5000) {
      return res.status(400).json({ 
        success: false,
        message: 'Radius must be between 100 and 5000 meters' 
      });
    }

    // Update or create settings
    const settings = await Settings.findOneAndUpdate(
      {}, 
      { verificationRadius: radius },
      { upsert: true, new: true }
    );

    res.json({ 
      success: true,
      message: 'Verification radius updated',
      radius: settings.verificationRadius
    });
  } catch (error) {
    console.error('Error updating radius:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating verification radius' 
    });
  }
});

// Super Local Requests endpoints
app.get('/api/superlocal/requests', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const requests = await SuperLocalRequest.find({ status: 'pending' })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: requests.map(req => ({
        _id: req._id,
        userId: req.userId._id,
        name: req.userId.name,
        email: req.userId.email,
        status: req.status,
        createdAt: req.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching requests' 
    });
  }
});

app.patch('/api/superlocal/requests/:id', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    const { status } = req.body;
    const request = await SuperLocalRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ 
        success: false,
        message: 'Request not found' 
      });
    }

    request.status = status;
    await request.save();

    // If approved, update user's isSuperlocal status
    if (status === 'approved') {
      await User.findByIdAndUpdate(request.userId, { isSuperlocal: true });
    }

    res.json({
      success: true,
      message: 'Request updated successfully',
      updatedUser: status === 'approved' ? await User.findById(request.userId) : null
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating request' 
    });
  }
});
// Connect to MongoDB and start the server
mongoose.connect(process.env.DB)
  .then(() => {
    console.log('MongoDB connected successfully');
    
    // 2. Verify models are registered
    console.log('Registered models:', mongoose.modelNames());
    const PORT = process.env.PORT || 8082;

    // 3. Then start the server
    app.listen(PORT, () => {
    console.log(`🌐 Server is live at: https://negevpulsapp.onrender.com`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('🚀 Server is up and running!');
});