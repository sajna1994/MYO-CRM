const User = require('../models/User');

// ─── Helper: build and send token response ───────────────────────────────────
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateToken();

  // User object (password already stripped by toJSON transform)
  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userData,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Validation ───────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    // ── Check for existing user ──────────────────────────────────────────────
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // ── Create user ──────────────────────────────────────────────────────────
    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user', // Prevent role injection
    });

    // ── Update last login timestamp ──────────────────────────────────────────
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login user & return JWT
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Validation ───────────────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // ── Find user with password field ────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // ── Check if account is active ───────────────────────────────────────────
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Contact an administrator.',
      });
    }

    // ── Verify password ──────────────────────────────────────────────────────
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // ── Update last login timestamp ──────────────────────────────────────────
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
// @access  Private (requires protect middleware)
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update current user profile (name, email)
// @route   PUT /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();

    // Check if new email is already taken
    if (email) {
      const emailTaken = await User.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.user.id },
      });
      if (emailTaken) {
        return res.status(409).json({
          success: false,
          message: 'This email is already in use by another account.',
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, updateMe, changePassword };
