const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Please authenticate' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
    
    // Find user and include isSuperlocal status
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Attach complete user data to request
      // إعداد بيانات المستخدم للطلب
    req.user = {
      userId: user._id, // <<< هذا الحقل ضروري للنقاط النهائية
      email: user.email,
      name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email.split('@')[0],
      isSuperlocal: user.isSuperlocal || decoded.isSuperlocal || false,
      verifiedLandmarksAdded: user.verifiedLandmarksAdded || 0,
      verifiedRoutesAdded: user.verifiedRoutesAdded || 0,
      votingStats: user.votingStats || { correctVotes: 0, totalVotes: 0 }
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    let message = 'Please authenticate';
    if (error.name === 'TokenExpiredError') {
      message = 'Session expired, please login again';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }

    res.status(401).json({ 
      success: false,
      message 
    });
  }
};

module.exports = auth;