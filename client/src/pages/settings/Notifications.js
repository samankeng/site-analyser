import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Box,
  Paper,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import {
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { updateNotificationSettings } from '../../store/actions/authActions';
import Loader from '../../components/common/Loader';

const Notifications = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(state => state.auth);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    securityAlerts: true,
    scanCompleted: true,
    newVulnerabilities: true,
    weeklyReports: true,
    marketingEmails: false,
    emailAddresses: [],
    slackWebhook: '',
    slackNotifications: false,
    discordWebhook: '',
    discordNotifications: false,
    customNotifications: [],
  });

  const [newEmail, setNewEmail] = useState('');
  const [newCustomNotification, setNewCustomNotification] = useState({
    event: '',
    channel: 'email',
    threshold: 'all',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (user && user.notificationSettings) {
      setSettings(user.notificationSettings);
    }
  }, [user]);

  const handleToggleChange = event => {
    const { name, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleInputChange = event => {
    const { name, value } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@') || settings.emailAddresses.includes(newEmail)) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid email address',
        severity: 'error',
      });
      return;
    }

    setSettings(prev => ({
      ...prev,
      emailAddresses: [...prev.emailAddresses, newEmail],
    }));
    setNewEmail('');
  };

  const handleRemoveEmail = email => {
    setSettings(prev => ({
      ...prev,
      emailAddresses: prev.emailAddresses.filter(e => e !== email),
    }));
  };

  const handleAddCustomNotification = () => {
    if (!newCustomNotification.event) {
      setSnackbar({
        open: true,
        message: 'Please enter an event name',
        severity: 'error',
      });
      return;
    }

    setSettings(prev => ({
      ...prev,
      customNotifications: [
        ...prev.customNotifications,
        { ...newCustomNotification, id: Date.now() },
      ],
    }));

    setNewCustomNotification({
      event: '',
      channel: 'email',
      threshold: 'all',
    });
  };

  const handleRemoveCustomNotification = id => {
    setSettings(prev => ({
      ...prev,
      customNotifications: prev.customNotifications.filter(n => n.id !== id),
    }));
  };

  const handleCustomNotificationChange = e => {
    const { name, value } = e.target;
    setNewCustomNotification(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveSettings = () => {
    dispatch(updateNotificationSettings(settings))
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Notification settings saved successfully',
          severity: 'success',
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to save notification settings',
          severity: 'error',
        });
      });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Notification Settings
        </Typography>
        <Button
          variant="filled"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSaveSettings}
        >
          Save Settings
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Email Notifications
        </Typography>

        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.emailNotifications}
                onChange={handleToggleChange}
                name="emailNotifications"
                color="primary"
              />
            }
            label="Enable Email Notifications"
          />
        </FormGroup>

        <Box sx={{ ml: 4, mt: 2 }}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.securityAlerts}
                  onChange={handleToggleChange}
                  name="securityAlerts"
                  color="primary"
                  disabled={!settings.emailNotifications}
                />
              }
              label="Security Alerts (Critical vulnerabilities detected)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.scanCompleted}
                  onChange={handleToggleChange}
                  name="scanCompleted"
                  color="primary"
                  disabled={!settings.emailNotifications}
                />
              }
              label="Scan Completed Notifications"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.newVulnerabilities}
                  onChange={handleToggleChange}
                  name="newVulnerabilities"
                  color="primary"
                  disabled={!settings.emailNotifications}
                />
              }
              label="New Vulnerability Detected"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.weeklyReports}
                  onChange={handleToggleChange}
                  name="weeklyReports"
                  color="primary"
                  disabled={!settings.emailNotifications}
                />
              }
              label="Weekly Security Reports"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.marketingEmails}
                  onChange={handleToggleChange}
                  name="marketingEmails"
                  color="primary"
                  disabled={!settings.emailNotifications}
                />
              }
              label="Product Updates and Tips"
            />
          </FormGroup>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notification Email Addresses
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField
              label="Add Email Address"
              variant="outlined"
              size="small"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              sx={{ mr: 1, flexGrow: 1 }}
              disabled={!settings.emailNotifications}
            />
            <Button
              variant="filled"
              startIcon={<AddIcon />}
              onClick={handleAddEmail}
              disabled={!settings.emailNotifications}
            >
              Add
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {settings.emailAddresses.map(email => (
              <Chip
                key={email}
                label={email}
                onDelete={() => handleRemoveEmail(email)}
                icon={<EmailIcon />}
                variant="outlined"
                disabled={!settings.emailNotifications}
              />
            ))}
            {settings.emailAddresses.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No additional email addresses added
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Integration Channels
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.slackNotifications}
                    onChange={handleToggleChange}
                    name="slackNotifications"
                    color="primary"
                  />
                }
                label="Enable Slack Notifications"
              />

              <TextField
                fullWidth
                label="Slack Webhook URL"
                variant="outlined"
                name="slackWebhook"
                value={settings.slackWebhook}
                onChange={handleInputChange}
                margin="normal"
                disabled={!settings.slackNotifications}
                placeholder="https://hooks.slack.com/services/..."
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.discordNotifications}
                    onChange={handleToggleChange}
                    name="discordNotifications"
                    color="primary"
                  />
                }
                label="Enable Discord Notifications"
              />

              <TextField
                fullWidth
                label="Discord Webhook URL"
                variant="outlined"
                name="discordWebhook"
                value={settings.discordWebhook}
                onChange={handleInputChange}
                margin="normal"
                disabled={!settings.discordNotifications}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Custom Notification Rules
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Event Name"
                variant="outlined"
                size="small"
                name="event"
                value={newCustomNotification.event}
                onChange={handleCustomNotificationChange}
                placeholder="e.g., SSL Certificate Expiry"
              />
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Channel</InputLabel>
                <Select
                  name="channel"
                  value={newCustomNotification.channel}
                  onChange={handleCustomNotificationChange}
                  label="Channel"
                >
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="slack">Slack</MenuItem>
                  <MenuItem value="discord">Discord</MenuItem>
                  <MenuItem value="all">All Channels</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity Threshold</InputLabel>
                <Select
                  name="threshold"
                  value={newCustomNotification.threshold}
                  onChange={handleCustomNotificationChange}
                  label="Severity Threshold"
                >
                  <MenuItem value="critical">Critical Only</MenuItem>
                  <MenuItem value="high">High and Above</MenuItem>
                  <MenuItem value="medium">Medium and Above</MenuItem>
                  <MenuItem value="all">All Severities</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="filled"
                startIcon={<AddIcon />}
                onClick={handleAddCustomNotification}
              >
                Add Rule
              </Button>
            </Grid>
          </Grid>
        </Box>

        {settings.customNotifications.length > 0 ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Your Custom Rules
            </Typography>

            {settings.customNotifications.map(notification => (
              <Box
                key={notification.id}
                sx={{
                  p: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="subtitle1">{notification.event}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={`Channel: ${notification.channel}`}
                      size="small"
                      icon={<NotificationsIcon />}
                      variant="outlined"
                    />
                    <Chip
                      label={`Threshold: ${notification.threshold}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveCustomNotification(notification.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            No custom notification rules defined
          </Typography>
        )}
      </Paper>

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

export default Notifications;
