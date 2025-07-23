const express = require('express');
const router = express.Router();
const Landmark = require('../models/Landmark');
//const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
const { User } = require('../models/User'); // Destructure the User model

// Enhanced user weight calculation
const calculateUserWeight = (user) => {
  let weight = 1; // Base weight
  
  // Super user bonus
  if (user.isSuperlocal) weight += 1;
  
  // Reputation bonus (if you implement this later)
  if (user.reputationScore) weight += Math.min(2, user.reputationScore / 100);
  
  // Activity bonus - reward active users
  if (user.landmarksAdded > 5) weight += 0.5;
  
  return Math.min(5, weight); // Cap at 5 to prevent abuse
};

// GET all landmarks (unchanged)
router.get('/', async (req, res) => {
  try {
    const landmarks = await Landmark.find().sort({ createdAt: -1 });
    res.status(200).json(landmarks);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching landmarks', 
      error: error.message 
    });
  }
});

// POST create new landmark (unchanged)
router.post('/', auth, async (req, res) => {
  try {
    const { title, lat, lon, color, imageUrl } = req.body;
    
    const landmark = new Landmark({
      title,
      lat,
      lon,
      color: color || '#8B4513',
      imageUrl: imageUrl || '',
      verified: false,
      votes: [],
      createdBy: req.user._id
    });

    const savedLandmark = await landmark.save();
    res.status(201).json(savedLandmark);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error creating landmark',
      error: error.message 
    });
  }
});
/* 

router.put('/:id/vote', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { vote } = req.body;
    
    // Validate input
    if (!['yes', 'no'].includes(vote)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Get user with proper weight calculation
    const user = await User.findById(req.user._id).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the proper weight using the user's method
    const weight = user.getVoteWeight();
    
    // Get landmark
    const landmark = await Landmark.findById(req.params.id).session(session);
    if (!landmark) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Landmark not found' });
    }

    // Check for existing vote
    const existingVoteIndex = landmark.votes.findIndex(
      v => v.userId.toString() === user._id.toString()
    );

    // Create vote payload with the calculated weight
    const voteData = {
      userId: user._id,
      vote,
      weight,
      timestamp: new Date()
    };

    // Update or add vote
    if (existingVoteIndex >= 0) {
      landmark.votes[existingVoteIndex] = voteData;
    } else {
      landmark.votes.push(voteData);
    }

    // Recalculate verification status
    landmark.updateVerificationStatus();
    
    await landmark.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      data: landmark,
      message: `Vote recorded with weight ${weight}`
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Vote processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process vote',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});
*/
// routes/landmarks.js
router.put('/:id/vote', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { vote } = req.body;
    
    // Validate input
    if (!['yes', 'no'].includes(vote)) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Invalid vote type' });
    }

    // Get user with proper fields
    const user = await User.findById(req.user._id)
      .select('isSuperlocal verifiedLandmarksAdded reputationScore')
      .session(session);
    
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate weight
    let weight = 1.0;
    if (user.isSuperlocal) {
      weight = 4.0;
    } else if (user.verifiedLandmarksAdded > 0) {
      weight = 2.0;
    } else if (user.reputationScore >= 70) {
      weight = 2.0;
    }

    // Get and lock landmark
    const landmark = await Landmark.findById(req.params.id).session(session);
    if (!landmark) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Landmark not found' });
    }

    // Update or add vote
    const voteIndex = landmark.votes.findIndex(v => v.userId.toString() === user._id.toString());
    const voteData = {
      userId: user._id,
      vote,
      weight,
      timestamp: new Date()
    };

    if (voteIndex >= 0) {
      landmark.votes[voteIndex] = voteData;
    } else {
      landmark.votes.push(voteData);
    }

    // Update verification status (this will handle creator updates)
    await landmark.updateVerificationStatus();
    await landmark.save({ session });
    
    await session.commitTransaction();

    res.json({
      success: true,
      data: landmark,
      message: `Vote recorded with weight ${weight}x`,
      userWeight: weight
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Vote processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process vote',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});
// DELETE endpoint (unchanged)
router.delete('/:id', auth, async (req, res) => {
  try {
    const landmark = await Landmark.findById(req.params.id);
    
    if (!landmark) {
      return res.status(404).json({ 
        success: false,
        message: 'Landmark not found' 
      });
    }

    if (!landmark.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    await Landmark.findByIdAndDelete(req.params.id);
    res.status(200).json({ 
      success: true,
      message: 'Landmark deleted successfully' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting landmark',
      error: error.message 
    });
  }
});

// New endpoint to get voting analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const landmark = await Landmark.findById(req.params.id);
    
    if (!landmark) {
      return res.status(404).json({ 
        success: false,
        message: 'Landmark not found' 
      });
    }

    // Calculate voter distribution
    const voterTypes = landmark.votes.reduce((acc, vote) => {
      if (vote.weight > 1) acc.superUsers += 1;
      else acc.regularUsers += 1;
      return acc;
    }, { superUsers: 0, regularUsers: 0 });

    res.status(200).json({
      success: true,
      data: {
        totalVotes: landmark.votes.length,
        voterTypes,
        yesPercentage: landmark.votes.filter(v => v.vote === 'yes').length / landmark.votes.length * 100 || 0,
        noPercentage: landmark.votes.filter(v => v.vote === 'no').length / landmark.votes.length * 100 || 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error getting analytics',
      error: error.message 
    });
  }
});
// Add this to your backend routes
// routes/landmarks.js - Update these routes:

// Get verification radius
router.get('/api/settings/verification-radius', async (req, res) => {
  try {
    // In a real app, you would fetch this from your database
    // For now, we'll just return the default value
    res.json({ 
      success: true,
      radius: 500 // Default value
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification radius' });
  }
});

// Update verification radius (admin only)
router.post('/api/admin/settings/verification-radius', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { radius } = req.body;
    
    // Validate input
    if (!radius || isNaN(radius) || radius < 100 || radius > 5000) {
      return res.status(400).json({ message: 'Radius must be between 100 and 5000 meters' });
    }

    // In a real app, you would save this to your database
    // For now, we'll just return the new value
    res.json({ 
      success: true,
      message: 'Verification radius updated',
      radius: parseInt(radius)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating verification radius' });
  }
});

// Get verification radius
router.get('/api/settings/verification-radius', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({ 
      success: true,
      radius: settings?.verificationRadius || 500 // Default 500 meters
    });
  } catch (error) {
    console.error('Error fetching radius:', error);
    res.status(500).json({ message: 'Error fetching verification radius' });
  }
});

// Update verification radius (admin only)
router.post('/api/admin/settings/verification-radius', auth, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { radius } = req.body;
    
    // Validate input
    if (!radius || isNaN(radius) || radius < 100 || radius > 5000) {
      return res.status(400).json({ message: 'Radius must be between 100 and 5000 meters' });
    }

    // Save to database
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
    res.status(500).json({ message: 'Error updating verification radius' });
  }
});
router.post('/api/admin/settings/verification-radius', auth, async (req, res) => {
  try {
    const { radius } = req.body;
    
    if (!radius || isNaN(radius) || radius < 100 || radius > 5000) {
      return res.status(400).json({ message: 'Invalid radius value' });
    }
    
    res.json({ 
      success: true,
      message: 'Verification radius updated',
      radius: parseInt(radius)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating verification radius' });
  }
});

module.exports = router;