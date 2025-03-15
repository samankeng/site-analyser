const crypto = require('crypto');
const User = require('../../models/User');
const ApiError = require('../../utils/ApiError');
const { asyncHandler } = require('../../middleware/asyncHandler');
const { generateMfaSecret, verifyMfaToken } = require('../../services/mfaService');
const { sendEmail } = require('../../services/notifications/EmailService');
const config = require('../../config');

/**
 * Auth Controller
 * Handles user authentication and related operations
 */
class AuthController {
  /**
   * Register a new user
   * @route POST /api/auth/register
   * @access Public
   */
  register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Generate email verification token if email verification is enabled
    let verificationToken = null;
    const emailVerified = !config.features.emailVerification;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      emailVerified
    });

    // Generate verification token if needed
    if (!emailVerified) {
      verificationToken = user.generateEmailVerificationToken();
      await user.save();

      // Send verification email
      await sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        template: 'emailVerification',
        data: {
          name: user.name,
          verificationUrl: `${config.baseUrl}/verify-email?token=${verificationToken}`
        }
      });
    }

    // Send token response
    this.sendTokenResponse(user, 201, res, {
      message: emailVerified 
        ? 'User registered successfully'
        : 'User registered. Please verify your email address'
    });
  });

  /**
   * Login user
   * @route POST /api/auth/login
   * @access Public
   */
  login = asyncHandler(async (req, res) => {
    const { email, password, mfaToken } = req.body;

    // Validate email & password
    if (!email || !password) {
      throw new ApiError(400, 'Please provide email and password');
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password +mfaSecret');
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new ApiError(401, 'This account has been deactivated');
    }

    // Check if email is verified
    if (config.features.emailVerification && !user.emailVerified) {
      throw new ApiError(401, 'Please verify your email before logging in');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Check if MFA is enabled and validate token
    if (user.mfaEnabled) {
      // If MFA token wasn't provided, send MFA required response
      if (!mfaToken) {
        return res.status(200).json({
          success: true,
          requiresMfa: true,
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        });
      }

      // Verify MFA token
      const isValidToken = verifyMfaToken(user.mfaSecret, mfaToken);
      if (!isValidToken) {
        throw new ApiError(401, 'Invalid MFA token');
      }
    }

    // Update last login timestamp
    user.lastLogin = Date.now();
    await user.save();

    // Send token response
    this.sendTokenResponse(user, 200, res);
  });

  /**
   * Get current user
   * @route GET /api/auth/me
   * @access Private
   */
  getMe = asyncHandler(async (req, res) => {
    // Get user with populated data
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  });

  /**
   * Logout user / clear cookie
   * @route POST /api/auth/logout
   * @access Private
   */
  logout = asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  });

  /**
   * Update user details
   * @route PUT /api/auth/updatedetails
   * @access Private
   */
  updateDetails = asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const fieldsToUpdate = {};

    if (name) fieldsToUpdate.name = name;
    
    // If email is being updated, check if it's already in use
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError(400, 'Email is already in use');
      }
      fieldsToUpdate.email = email;
      
      // If email verification is enabled, mark as unverified
      if (config.features.emailVerification) {
        fieldsToUpdate.emailVerified = false;
        
        // Generate verification token
        const user = await User.findById(req.user.id);
        const verificationToken = user.generateEmailVerificationToken();
        fieldsToUpdate.emailVerificationToken = user.emailVerificationToken;
        
        // Send verification email
        await sendEmail({
          to: email,
          subject: 'Verify your email address',
          template: 'emailVerification',
          data: {
            name: user.name,
            verificationUrl: `${config.baseUrl}/verify-email?token=${verificationToken}`
          }
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user,
      message: email && config.features.emailVerification && email !== req.user.email
        ? 'Profile updated. Please verify your new email address'
        : 'Profile updated successfully'
    });
  });

  /**
   * Update password
   * @route PUT /api/auth/updatepassword
   * @access Private
   */
  updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send token response
    this.sendTokenResponse(user, 200, res, {
      message: 'Password updated successfully'
    });
  });

  /**
   * Forgot password
   * @route POST /api/auth/forgotpassword
   * @access Public
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${config.baseUrl}/reset-password?token=${resetToken}`;

    try {
      // Send email
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        template: 'passwordReset',
        data: {
          name: user.name,
          resetUrl
        }
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (err) {
      // If email fails, clear the reset token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      throw new ApiError(500, 'Email could not be sent');
    }
  });

  /**
   * Reset password
   * @route PUT /api/auth/resetpassword/:token
   * @access Public
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: resetPasswordToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new ApiError(400, 'Invalid or expired token');
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send token response
    this.sendTokenResponse(user, 200, res, {
      message: 'Password reset successful'
    });
  });

  /**
   * Verify email
   * @route GET /api/auth/verifyemail/:token
   * @access Public
   */
  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    // Get hashed token
    const emailVerificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token
    const user = await User.findOne({ emailVerificationToken });

    if (!user) {
      throw new ApiError(400, 'Invalid verification token');
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  });

  /**
   * Setup MFA
   * @route POST /api/auth/mfa/setup
   * @access Private
   */
  setupMfa = asyncHandler(async (req, res) => {
    // Get user with MFA secret
    const user = await User.findById(req.user.id).select('+mfaSecret');

    // Generate MFA secret if not exists
    if (!user.mfaSecret) {
      const { secret, qrCode } = generateMfaSecret(user.email);
      user.mfaSecret = secret;
      await user.save();

      return res.status(200).json({
        success: true,
        data: {
          secret,
          qrCode
        }
      });
    }

    // If MFA is already enabled
    if (user.mfaEnabled) {
      throw new ApiError(400, 'MFA is already enabled');
    }

    // Regenerate QR code from existing secret
    const { qrCode } = generateMfaSecret(user.email, user.mfaSecret);

    res.status(200).json({
      success: true,
      data: {
        secret: user.mfaSecret,
        qrCode
      }
    });
  });

  /**
   * Verify and enable MFA
   * @route POST /api/auth/mfa/enable
   * @access Private
   */
  enableMfa = asyncHandler(async (req, res) => {
    const { token } = req.body;

    // Get user with MFA secret
    const user = await User.findById(req.user.id).select('+mfaSecret');

    // Verify the token
    const isValid = verifyMfaToken(user.mfaSecret, token);
    if (!isValid) {
      throw new ApiError(400, 'Invalid MFA token');
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'MFA enabled successfully'
    });
  });

  /**
   * Disable MFA
   * @route POST /api/auth/mfa/disable
   * @access Private
   */
  disableMfa = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    // Get user with password and MFA secret
    const user = await User.findById(req.user.id).select('+password +mfaSecret');

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid password');
    }

    // If MFA is not enabled
    if (!user.mfaEnabled) {
      throw new ApiError(400, 'MFA is not enabled');
    }

    // Verify MFA token
    const isValid = verifyMfaToken(user.mfaSecret, token);
    if (!isValid) {
      throw new ApiError(400, 'Invalid MFA token');
    }

    // Disable MFA
    user.mfaEnabled = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'MFA disabled successfully'
    });
  });

  /**
   * Update user preferences
   * @route PUT /api/auth/preferences
   * @access Private
   */
  updatePreferences = asyncHandler(async (req, res) => {
    const { preferences } = req.body;

    // Update user preferences
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user.preferences,
      message: 'Preferences updated successfully'
    });
  });

  /**
   * Deactivate account
   * @route DELETE /api/auth/deactivate
   * @access Private
   */
  deactivateAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid password');
    }

    // Deactivate account
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  });

  /**
   * Helper method to send JWT response
   * @private
   */
  sendTokenResponse = (user, statusCode, res, additional = {}) => {
    // Create token
    const token = user.getSignedJwtToken();

    // Set cookie options
    const options = {
      expires: new Date(
        Date.now() + parseInt(config.jwt.expiresIn) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: config.env === 'production'
    };

    // Remove sensitive data
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      emailVerified: user.emailVerified,
      preferences: user.preferences
    };

    res
      .status(statusCode)
      .cookie('token', token, options)
      .json({
        success: true,
        token,
        user: userData,
        ...additional
      });
  };
}

module.exports = new AuthController();