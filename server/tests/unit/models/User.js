import mongoose from 'mongoose';
import User from '../../src/models/User';

describe('User Model Test', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Model Validation', () => {
    it('should create & save user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'StrongPassword123!',
        firstName: 'Test',
        lastName: 'User'
      };

      const validUser = new User(userData);
      const savedUser = await validUser.save();

      // Assert
      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.username).toBe(userData.username);
    });

    it('should fail to save user without required fields', async () => {
      const userWithoutRequiredField = new User({
        email: 'test@example.com'
      });

      let err;
      try {
        await userWithoutRequiredField.save();
      } catch (error) {
        err = error;
      }
      
      expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    });

    it('should prevent duplicate email', async () => {
      const userData = {
        email: 'unique@example.com',
        username: 'testuser',
        password: 'StrongPassword123!'
      };

      // Create first user
      await new User(userData).save();

      // Try to create second user with same email
      const duplicateUser = new User({
        ...userData,
        username: 'differentusername'
      });

      let err;
      try {
        await duplicateUser.save();
      } catch (error) {
        err = error;
      }

      expect(err).toBeTruthy();
      expect(err.code).toBe(11000);
    });
  });

  describe('User Model Methods', () => {
    it('should hash password before saving', async () => {
      const userData = {
        email: 'passwordtest@example.com',
        username: 'passworduser',
        password: 'PlainTextPassword123!'
      };

      const user = new User(userData);
      await user.save();

      // Verify password is hashed
      expect(user.password).not.toBe(userData.password);
      expect(user.password.length).toBeGreaterThan(0);
    });

    it('should correctly validate password', async () => {
      const userData = {
        email: 'checkpassword@example.com',
        username: 'checkuser',
        password: 'ValidPassword123!'
      };

      const user = new User(userData);
      await user.save();

      // Check correct password validation
      const isValid = await user.checkPassword(userData.password);
      expect(isValid).toBe(true);

      // Check incorrect password validation
      const isInvalid = await user.checkPassword('WrongPassword');
      expect(isInvalid).toBe(false);
    });

    it('should generate password reset token', async () => {
      const userData = {
        email: 'resettoken@example.com',
        username: 'resetuser',
        password: 'ValidPassword123!'
      };

      const user = new User(userData);
      await user.save();

      const resetToken = user.generatePasswordResetToken();

      expect(resetToken).toBeDefined();
      expect(typeof resetToken).toBe('string');
      expect(resetToken.length).toBeGreaterThan(0);
    });
  });
});
