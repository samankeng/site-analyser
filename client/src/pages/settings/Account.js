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

const Account = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(state => state.auth);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
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

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        company: user.company || '',
        jobTitle: user.jobTitle || '',
      });
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
    dispatch(updateUserProfile(profileData))
      .then(() => {
        setEditMode(false);
        setSnackbar({
          open: true,
          message: 'Profile updated successfully',
          severity: 'success',
        });
      })
      .catch(() => {
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

  if (loading) return <Loader />;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Account Settings
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            Profile Information
          </Typography>
          <Button
            startIcon={editMode ? <SaveIcon /> : <EditIcon />}
            variant={editMode ? 'filled' : 'outlined'}
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
            <Avatar
              sx={{ width: 100, height: 100, mb: 2 }}
              src={user?.profilePicture}
              alt={`${profileData.firstName} ${profileData.lastName}`}
            />
            {editMode && (
              <Button variant="outlined" startIcon={<UploadIcon />} size="small">
                Upload Photo
              </Button>
            )}
          </Grid>

          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleProfileChange}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={profileData.lastName}
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
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={profileData.company}
                  onChange={handleProfileChange}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title"
                  name="jobTitle"
                  value={profileData.jobTitle}
                  onChange={handleProfileChange}
                  disabled={!editMode}
                  variant={editMode ? 'outlined' : 'filled'}
                  margin="normal"
                />
              </Grid>
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
                  variant="filled"
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
                  <Button color="primary" variant="filled" onClick={handleUpdatePassword}>
                    Update Password
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>

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
            variant="filled"
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
