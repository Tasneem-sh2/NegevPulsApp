const express = require('express');
const router = express.Router();
const Route = require('../models/Route');
const User = require('../models/User');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// GET all routes
router.get('/', async (req, res) => {
  try {
    const routes = await Route.find().sort({ createdAt: -1 });
    res.status(200).json(routes);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching routes', 
      error: error.message 
    });
  }
});

// POST create new route
router.post('/', auth, async (req, res) => {
  try {
    const { title, points, color } = req.body;
    
    if (!title || !points || points.length < 2) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and at least 2 points are required' 
      });
    }
    const route = new Route({
      title,
      points,
      color: color || '#3A86FF',
      createdBy: req.user._id,
      verified: false,
      votes: []
    });
    
    await route.save();
    res.status(201).json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Route creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    });
  }
});
// PUT vote on route
router.put('/:id/vote', auth, async (req, res) => {
  try {
    const { vote } = req.body;
    const route = await Route.findById(req.params.id);
    
    if (!route) {
      return res.status(404).json({ 
        success: false,
        message: 'Route not found' 
      });
    }

    if (!['yes', 'no'].includes(vote)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid vote type' 
      });
    }

    const user = req.user;
    const existingVoteIndex = route.votes.findIndex(v => 
      v.userId.toString() === user._id.toString()
    );

    // If user already voted, update their vote
    if (existingVoteIndex !== -1) {
      route.votes[existingVoteIndex] = {
        userId: user._id,
        vote,
        weight: user.isSuperlocal ? 2 : 1
      };
    } 
    // Otherwise add new vote
    else {
      route.votes.push({
        userId: user._id,
        vote,
        weight: user.isSuperlocal ? 2 : 1
      });
    }

    // Recalculate verification status
    const { totalWeight, yesWeight } = route.votes.reduce((acc, v) => {
      const weight = v.weight || 1;
      return {
        totalWeight: acc.totalWeight + weight,
        yesWeight: v.vote === 'yes' ? acc.yesWeight + weight : acc.yesWeight
      };
    }, { totalWeight: 0, yesWeight: 0 });

    route.verified = totalWeight >= 5 && (yesWeight / totalWeight) >= 0.8;

    const updatedRoute = await route.save();
    
    res.status(200).json({
      success: true,
      data: {
        ...updatedRoute.toObject(),
        calculatedWeights: { totalWeight, yesWeight }
      },
      message: existingVoteIndex !== -1 
        ? 'Vote updated successfully' 
        : 'Vote recorded successfully'
    });

  } catch (error) {
    console.error("Voting error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// DELETE a route
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route ID format'
      });
    }

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ 
        success: false,
        message: 'Route not found' 
      });
    }

    // Authorization check (creator or admin)
    if (!route.createdBy.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Unauthorized: You can only delete your own routes unless you are an admin'
      });
    }

    await Route.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      success: true,
      message: 'Route deleted successfully' 
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting route',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;