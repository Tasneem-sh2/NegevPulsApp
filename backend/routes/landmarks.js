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
    // تأكيد استقبال البيانات بشكل صحيح
    console.log("Request body received:", req.body);
    
    const { title, description = '', lat, lon, color, imageUrl } = req.body;
    
    // إنشاء المعلم مع التأكد من وجود الوصف
    const landmark = new Landmark({
      title,
      description: description || '', // تأكيد وجود قيمة افتراضية
      lat,
      lon,
      color: color || '#8B4513',
      imageUrl: imageUrl || '',
      verified: false,
      votes: [],
      createdBy: req.user._id
    });

    console.log("Landmark to be saved:", landmark); // سجل قبل الحفظ
    
    const savedLandmark = await landmark.save();
    console.log("Landmark saved:", savedLandmark); // سجل بعد الحفظ
    
    res.status(201).json(savedLandmark);
  } catch (error) {
    console.error("Error saving landmark:", error);
    res.status(500).json({ 
      message: 'Error creating landmark',
      error: error.message 
    });
  }
});
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

    let weight = 1.0;
    if (user.isSuperlocal) {
      weight = 4.0;
    } else {
      // Active Resident من خلال المساهمات
      const verifiedLandmarks = user.verifiedLandmarksAdded || 0;
      const verifiedRoutes = user.verifiedRoutesAdded || 0;
      
      const hasTwoLandmarks = verifiedLandmarks >= 2;
      const hasTwoRoutes = verifiedRoutes >= 2;
      const hasOneEach = verifiedLandmarks >= 1 && verifiedRoutes >= 1;
      
      if (hasTwoLandmarks || hasTwoRoutes || hasOneEach) {
        weight = 2.0;
      }
      // Active Resident من خلال السمعة
      else if (user.reputationScore && user.reputationScore >= 70) {
        weight = 2.0;
      }
      // else يبقى 1.0 (Regular)
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


module.exports = router;