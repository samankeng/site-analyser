import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  updateProfile as updateUserProfile,
  updateUserPassword,
  deleteAccount,
} from '../../store/actions/authActions';
import Loader from '../../components/common/Loader';

// Define a debug mode constant - set to false for production
const DEBUG_MODE = true;

const Account = () => {
  console.log('Account component is mounting');

  const dispatch = useDispatch();

  // Get the full Redux state
  const reduxState = useSelector(state => state);

  // Log the full Redux state if in debug mode
  if (DEBUG_MODE) {
    console.log('Full Redux State in Account component:', reduxState);
  }

  // Extract auth-related state
  const { user, loading, error, isAuthenticated } = useSelector(state => state.auth);

  // Log authentication state
  console.log('Auth State in Account:', { user, loading, error, isAuthenticated });

  // Simplified profile data that matches server structure
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Clean up useEffect to directly use fields from the API
  useEffect(() => {
    console.log('useEffect triggered - user:', user);
    if (user) {
      // Only use fields that actually come from the server
      const newProfileData = {
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
      };

      console.log('Setting profile data to:', newProfileData);
      setProfileData(newProfileData);
    }
  }, [user]);

  const handleProfileChange = e => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveProfile = () => {
    console.log('Saving profile with data:', profileData);
    dispatch(updateUserProfile(profileData))
      .then(() => {
        setEditMode(false);
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      })
      .catch(error => {
        console.error('Profile update error:', error);
        setSnackbar({
          open: true,
          message: 'Failed to update profile',
          severity: 'error',
        });
      });
  };

  const handleUpdatePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'New passwords do not match',
        severity: 'error',
      });
      return;
    }

    dispatch(updateUserPassword(passwordData))
      .then(() => {
        setChangePasswordMode(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setSnackbar({
          open: true,
          message: 'Password updated successfully',
          severity: 'success',
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to update password',
          severity: 'error',
        });
      });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== user.email) {
      setSnackbar({
        open: true,
        message: 'Email confirmation does not match',
        severity: 'error',
      });
      return;
    }

    dispatch(deleteAccount())
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Account deleted successfully',
          severity: 'success',
        });
        // Redirect to login or home page would happen here via auth reducer
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to delete account',
          severity: 'error',
        });
      });

    setDeleteDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false,
    }));
  };

  // Add a pre-render log to check what's about to be rendered
  console.log('Account component about to render with:', {
    profileData,
    user,
    loading,
    isAuthenticated,
  });

  if (loading) {
    console.log('Account showing loading state');
    return <Loader />;
  }

  if (!user) {
    console.log('Account showing user not available state');
    return (
      <Box sx={{ p: 3, border: DEBUG_MODE ? '2px solid red' : 'none' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Account Settings
        </Typography>
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1">User data not available. Please log in again.</Typography>
          {DEBUG_MODE && (
            <Box mt={2}>
              <Alert severity="warning">
                DEBUG: Authentication state:{' '}
                {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
              </Alert>
            </Box>
          )}
        </Paper>
      </Box>
    );
  }

  // Main component render
  return (
    <Box
      sx={{
        p: 3,
        border: DEBUG_MODE ? '2px solid green' : 'none',
        backgroundColor: DEBUG_MODE ? 'rgba(0, 255, 0, 0.05)' : 'transparent',
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Account Settings {DEBUG_MODE && '(Debug Mode Active)'}
      </Typography>

      {DEBUG_MODE && (
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Debug - Authentication State
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            isAuthenticated: {isAuthenticated ? 'true' : 'false'}, loading:{' '}
            {loading ? 'true' : 'false'}
          </Alert>
          <Typography variant="subtitle2" gutterBottom>
            Debug - User Object
          </Typography>
          <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </Box>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Profile Information
          </Typography>
          <Button
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            variant={editMode ? 'contained' : 'outlined'}
            color={editMode ? 'primary' : 'secondary'}
            onClick={() => (editMode ? handleSaveProfile() : setEditMode(true))}
          >
            {editMode ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid
            item
            xs={12}
            md={3}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <Avatar sx={{ width: 100, height: 100, mb: 2 }} alt={profileData.name}>
              {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            {editMode && (
              <Button variant="outlined" startIcon={<UploadIcon />} size="small">
                Upload Photo
              </Button>
            )}
          </Grid>

          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Role"
                  name="role"
                  value={profileData.role}
                  onChange={handleProfileChange}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                  margin="normal"
                />
              </Grid>
              {/* Additional user fields can be displayed here if needed */}
              {user.lastLogin && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Last Login"
                    value={new Date(user.lastLogin).toLocaleString()}
                    disabled={true}
                    variant="filled"
                    margin="normal"
                  />
                </Grid>
              )}
              {user.emailVerified !== undefined && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Verification Status"
                    value={user.emailVerified ? 'Verified' : 'Not Verified'}
                    disabled={true}
                    variant="filled"
                    margin="normal"
                  />
                </Grid>
              )}
              {user.mfaEnabled !== undefined && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Two-Factor Authentication"
                    value={user.mfaEnabled ? 'Enabled' : 'Disabled'}
                    disabled={true}
                    variant="filled"
                    margin="normal"
                  />
                </Grid>
              )}
            </Grid>

            {editMode && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={() => setEditMode(false)}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveProfile}
                >
                  Save Changes
                </Button>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Security
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>

          {!changePasswordMode ? (
            <Button variant="outlined" onClick={() => setChangePasswordMode(true)}>
              Update Password
            </Button>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    color="error"
                    onClick={() => {
                      setChangePasswordMode(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: '',
                      });
                    }}
                    sx={{ mr: 1 }}
                  >
                    Cancel
                  </Button>
                  <Button color="primary" variant="contained" onClick={handleUpdatePassword}>
                    Update Password
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>

        {user.preferences && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                User Preferences
              </Typography>
              <pre>{JSON.stringify(user.preferences, null, 2)}</pre>
            </Box>
          </>
        )}

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom color="error">
            Danger Zone
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Once you delete your account, there is no going back. Please be certain.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </Box>
      </Paper>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            This action cannot be undone. All your data will be permanently deleted.
          </Typography>
          <Typography paragraph>
            Please type <strong>{user?.email}</strong> to confirm deletion:
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={e => setDeleteConfirmText(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== user?.email}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Account;
