const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // 🟣 استخراج التوكن من الهيدر
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please authenticate (no token provided)'
      });
    }

    // 🟢 التحقق من التوكن
    const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);

    // 🟢 إيجاد المستخدم في قاعدة البيانات
    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // 🟢 تجهيز بيانات المستخدم وإضافتها للـ request
    req.user = {
      _id: user._id, // ✅ تم تعديل الاسم من userId إلى _id
      email: user.email,
      name: user.firstName
        ? `${user.firstName} ${user.lastName || ''}`.trim()
        : user.email.split('@')[0],
      isSuperlocal: user.isSuperlocal || decoded.isSuperlocal || false,
      verifiedLandmarksAdded: user.verifiedLandmarksAdded || 0,
      verifiedRoutesAdded: user.verifiedRoutesAdded || 0,
      votingStats: user.votingStats || { correctVotes: 0, totalVotes: 0 }
    };

    // 🟢 الانتقال للمرحلة التالية (المسار)
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
