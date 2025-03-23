// Placeholder for MFA service functionality
const mfaService = {
  generateTOTP: async userId => {
    // Return a dummy TOTP secret and QR code URL for now
    return {
      secret: 'DUMMY_SECRET_KEY',
      qrCodeUrl: 'https://example.com/qr/dummy',
    };
  },

  verifyTOTP: async (userId, token) => {
    // Always return true for now (all tokens valid in development)
    return true;
  },

  enableMFA: async userId => {
    return { success: true };
  },

  disableMFA: async userId => {
    return { success: true };
  },
};

module.exports = mfaService;
