// Remove the debug log at the top (it's causing issues)
// Keep only:
const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SuperLocalRequest = require('../models/SuperLocalRequest'); // You'll need to create this model
const mongoose = require('mongoose');
  // routes/auth.js
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Normalize hash format for comparison
    const normalizedHash = user.password.replace('$2a$', '$2b$');
    const isMatch = await bcrypt.compare(password, normalizedHash);
    
    console.log('Stored hash:', user.password);
    console.log('Normalized hash:', normalizedHash);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role, isSuperlocal: user.isSuperlocal },
      process.env.JWTPRIVATEKEY,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        isSuperlocal: user.isSuperlocal
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Check if user is logged in
router.get('/me', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify using same secret as login
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    
    // Find user without password
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
  
    res.json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Auth check error:', error);
    // More specific error messages
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(401).json({ message: 'Not authenticated' });
  }
});
router.post('/request-super', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);

    // 1. Find user with proper error handling
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Check if already Super Local
    if (user.isSuperlocal) {
      return res.status(400).json({ 
        message: 'User is already a Super Local' 
      });
    }

    // 3. Check for existing pending request
    const existingRequest = await SuperLocalRequest.findOne({
      userId: decoded.userId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'You already have a pending request'
      });
    }

    // 4. Create new request with user details
    const newRequest = await SuperLocalRequest.create({
      userId: decoded.userId,
      name: user.name || user.email.split('@')[0], // Fallback to email prefix if name not available
      email: user.email,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Super Local request submitted!',
      request: {
        _id: newRequest._id,
        userId: newRequest.userId,
        name: newRequest.name,
        email: newRequest.email,
        status: newRequest.status,
        createdAt: newRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Error submitting request:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all super local requests
router.get('/superlocal/requests', async (req, res) => {
  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    // Fetch requests with user data
    const requests = await SuperLocalRequest.find({})
      .populate('userId', 'name email')
      .lean();

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
    res.status(500).json({ message: 'Server error' });
  }
});
// Handle request decision
router.patch('/superlocal/requests/:requestId', async (req, res) => {
  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { status } = req.body;
    const { requestId } = req.params;

    // Find the request first
    const request = await SuperLocalRequest.findById(requestId).populate('userId');
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    let updatedUser = null;
    
    // If approved, upgrade user
    if (status === 'approved') {
      updatedUser = await User.findByIdAndUpdate(
        request.userId._id,
        { $set: { isSuperlocal: true } }, // Use $set operator
        { new: true } // Return the updated document
      );
      
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Delete the request
    await SuperLocalRequest.findByIdAndDelete(requestId);

    res.json({
      success: true,
      message: `Request ${status} and removed`,
      updatedUser: status === 'approved' ? {
        _id: updatedUser._id,
        isSuperlocal: updatedUser.isSuperlocal
      } : null
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
});


module.exports = router;