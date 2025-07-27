// Remove the debug log at the top (it's causing issues)
// Keep only:
const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const SuperLocalRequest = require('../models/SuperLocalRequest');
const mongoose = require('mongoose');
const auth = require('../middleware/auth'); // Add this import

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
// Example improved superlocal requests endpoint
router.get('/superlocal/requests', auth, async (req, res) => {
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
      .lean(); // Convert to plain JS objects

    if (!requests) {
      return res.status(404).json({
        success: false,
        message: 'No requests found'
      });
    }

    res.json({
      success: true,
    requests: requests
  .filter(req => req.userId) // تجاهل nulls
  .map(req => ({
    _id: req._id,
    userId: req.userId._id,
    name: req.userId.name || 'Unknown',
    email: req.userId.email || 'No email',
    status: req.status,
    createdAt: req.createdAt
  }))
    });
  } catch (error) {
    console.error('Error fetching superlocal requests:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching requests',
      error: error.message // Only include in development
    });
  }
});
// Handle request decision (approve/reject)
router.patch('/superlocal/requests/:requestId', async (req, res) => {
  try {
    // Verify admin token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { status } = req.body;
    const { requestId } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Find and update the request
    const request = await SuperLocalRequest.findByIdAndUpdate(
      requestId,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // If approved, update user's super local status
    if (status === 'approved') {
      await User.findByIdAndUpdate(request.userId, { 
        isSuperlocal: true
      });
    }

    res.json({
      success: true,
      message: `Request ${status} successfully`,
      request: request
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update request',
      error: error.message 
    });
  }
});
module.exports = router;