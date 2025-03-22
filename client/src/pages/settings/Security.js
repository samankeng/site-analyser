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
  Alert,
  Snackbar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  VpnKey as VpnKeyIcon,
  PhonelinkLock as PhonelinkLockIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Lock as LockIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import {
  updateSecuritySettings,
  enableTwoFactor,
  disableTwoFactor,
  generateApiKey,
  revokeApiKey,
} from '../../store/actions/authActions';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/formatters';

const Security = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(state => state.auth);

  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    apiAccessEnabled: false,
    allowedIpAddresses: [],
    failedLoginLockout: true,
    passwordExpiryDays: 90,
    autoLogoutEnabled: true,
  });

  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorQrCode, setTwoFactorQrCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [apiKeysList, setApiKeysList] = useState([]);
  const [newIpAddress, setNewIpAddress] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (user) {
      if (user.securitySettings) {
        setSettings(user.securitySettings);
      }
      if (user.apiKeys) {
        setApiKeysList(user.apiKeys);
      }
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

  const handleSaveSettings = () => {
    dispatch(updateSecuritySettings(settings))
      .then(() => {
        setSnackbar({
          open: true,
          message: 'Security settings saved successfully',
          severity: 'success',
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to save security settings',
          severity: 'error',
        });
      });
  };

  const handleEnableTwoFactor = () => {
    dispatch(enableTwoFactor())
      .then(response => {
        setTwoFactorQrCode(response.qrCode);
        setTwoFactorSecret(response.secret);
        setTwoFactorSetupOpen(true);
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to enable two-factor authentication',
          severity: 'error',
        });
      });
  };

  const handleVerifyTwoFactor = () => {
    // Here you'd dispatch an action to verify the code
    if (twoFactorCode.length === 6) {
      // Mock successful verification
      setSettings(prev => ({
        ...prev,
        twoFactorEnabled: true,
      }));
      setTwoFactorSetupOpen(false);
      setSnackbar({
        open: true,
        message: 'Two-factor authentication enabled successfully',
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: 'Invalid verification code',
        severity: 'error',
      });
    }
  };

  const handleDisableTwoFactor = () => {
    dispatch(disableTwoFactor())
      .then(() => {
        setSettings(prev => ({
          ...prev,
          twoFactorEnabled: false,
        }));
        setSnackbar({
          open: true,
          message: 'Two-factor authentication disabled successfully',
          severity: 'success',
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to disable two-factor authentication',
          severity: 'error',
        });
      });
  };

  const handleGenerateApiKey = () => {
    if (!newApiKeyName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a name for your API key',
        severity: 'error',
      });
      return;
    }

    dispatch(generateApiKey(newApiKeyName))
      .then(response => {
        setNewApiKey(response.key);
        setApiKeysList(prev => [
          ...prev,
          {
            id: response.id,
            name: newApiKeyName,
            created: new Date().toISOString(),
            lastUsed: null,
          },
        ]);
        setApiKeyDialogOpen(true);
        setNewApiKeyName('');
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to generate API key',
          severity: 'error',
        });
      });
  };

  const handleRevokeApiKey = keyId => {
    dispatch(revokeApiKey(keyId))
      .then(() => {
        setApiKeysList(prev => prev.filter(key => key.id !== keyId));
        setSnackbar({
          open: true,
          message: 'API key revoked successfully',
          severity: 'success',
        });
      })
      .catch(() => {
        setSnackbar({
          open: true,
          message: 'Failed to revoke API key',
          severity: 'error',
        });
      });
  };

  const handleAddIpAddress = () => {
    if (!newIpAddress || settings.allowedIpAddresses.includes(newIpAddress)) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid IP address',
        severity: 'error',
      });
      return;
    }

    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(newIpAddress)) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid IP address or CIDR range',
        severity: 'error',
      });
      return;
    }

    setSettings(prev => ({
      ...prev,
      allowedIpAddresses: [...prev.allowedIpAddresses, newIpAddress],
    }));
    setNewIpAddress('');
  };

  const handleRemoveIpAddress = ip => {
    setSettings(prev => ({
      ...prev,
      allowedIpAddresses: prev.allowedIpAddresses.filter(item => item !== ip),
    }));
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
          Security Settings
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

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SecurityIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                Account Security
              </Typography>
            </Box>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.failedLoginLockout}
                    onChange={handleToggleChange}
                    name="failedLoginLockout"
                    color="primary"
                  />
                }
                label="Account lockout after multiple failed login attempts"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.autoLogoutEnabled}
                    onChange={handleToggleChange}
                    name="autoLogoutEnabled"
                    color="primary"
                  />
                }
                label="Automatically log out after inactivity"
              />
            </FormGroup>

            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Session timeout (minutes):
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                name="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={handleInputChange}
                disabled={!settings.autoLogoutEnabled}
                InputProps={{ inputProps: { min: 5, max: 240 } }}
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Password expiry (days):
              </Typography>
              <TextField
                type="number"
                variant="outlined"
                size="small"
                name="passwordExpiryDays"
                value={settings.passwordExpiryDays}
                onChange={handleInputChange}
                InputProps={{ inputProps: { min: 30, max: 365 } }}
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                Set to 0 to disable password expiry
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <VpnKeyIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                Two-Factor Authentication
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                Status:{' '}
                <Chip
                  label={settings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  color={settings.twoFactorEnabled ? 'success' : 'default'}
                  size="small"
                />
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Two-factor authentication adds an extra layer of security to your account by
                requiring more than just a password to sign in.
              </Typography>

              {settings.twoFactorEnabled ? (
                <Button variant="outlined" color="error" onClick={handleDisableTwoFactor}>
                  Disable Two-Factor Authentication
                </Button>
              ) : (
                <Button variant="filled" color="primary" onClick={handleEnableTwoFactor}>
                  Enable Two-Factor Authentication
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="body2" color="text.secondary">
                <LockIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Last password change:{' '}
                {user?.lastPasswordChange ? formatDate(user.lastPasswordChange) : 'Never'}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <HistoryIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1 }} />
                Last login: {user?.lastLogin ? formatDate(user.lastLogin) : 'Never'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PhonelinkLockIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                API Access
              </Typography>
            </Box>

            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.apiAccessEnabled}
                    onChange={handleToggleChange}
                    name="apiAccessEnabled"
                    color="primary"
                  />
                }
                label="Enable API Access"
              />
            </FormGroup>

            <Box sx={{ mt: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                API Keys
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  label="API Key Name"
                  variant="outlined"
                  size="small"
                  value={newApiKeyName}
                  onChange={e => setNewApiKeyName(e.target.value)}
                  placeholder="e.g., Development Server"
                  disabled={!settings.apiAccessEnabled}
                  sx={{ mr: 2, flexGrow: 1 }}
                />
                <Button
                  variant="filled"
                  startIcon={<AddIcon />}
                  onClick={handleGenerateApiKey}
                  disabled={!settings.apiAccessEnabled}
                >
                  Generate Key
                </Button>
              </Box>

              {apiKeysList.length > 0 ? (
                <List>
                  {apiKeysList.map(key => (
                    <ListItem
                      key={key.id}
                      secondaryAction={
                        <Button
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRevokeApiKey(key.id)}
                        >
                          Revoke
                        </Button>
                      }
                      sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                    >
                      <ListItemIcon>
                        <VpnKeyIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={key.name}
                        secondary={
                          <>
                            Created: {formatDate(key.created)}
                            {key.lastUsed && <>, Last used: {formatDate(key.lastUsed)}</>}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                  No API keys have been generated
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="h6" gutterBottom>
                IP Access Restrictions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Limit API access to specific IP addresses or ranges (using CIDR notation)
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextField
                  label="IP Address"
                  variant="outlined"
                  size="small"
                  value={newIpAddress}
                  onChange={e => setNewIpAddress(e.target.value)}
                  placeholder="e.g., 192.168.1.1 or 10.0.0.0/24"
                  disabled={!settings.apiAccessEnabled}
                  sx={{ mr: 2, flexGrow: 1 }}
                />
                <Button
                  variant="filled"
                  startIcon={<AddIcon />}
                  onClick={handleAddIpAddress}
                  disabled={!settings.apiAccessEnabled}
                >
                  Add IP
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {settings.allowedIpAddresses.map(ip => (
                  <Chip
                    key={ip}
                    label={ip}
                    onDelete={() => handleRemoveIpAddress(ip)}
                    disabled={!settings.apiAccessEnabled}
                  />
                ))}
                {settings.allowedIpAddresses.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No IP restrictions (allow all)
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Two Factor Setup Dialog */}
      <Dialog open={twoFactorSetupOpen} onClose={() => setTwoFactorSetupOpen(false)}>
        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Scan the QR code with your authenticator app (like Google Authenticator or Authy), then
            enter the verification code below.
          </DialogContentText>

          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            {/* This would be replaced with an actual QR code image in production */}
            <Card
              elevation={2}
              sx={{
                width: 200,
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography>QR Code Placeholder</Typography>
            </Card>
          </Box>

          <Typography variant="body2" gutterBottom>
            If you can't scan the QR code, enter this code manually in your app:
          </Typography>
          <Typography variant="subtitle1" sx={{ fontFamily: 'monospace', my: 1 }}>
            {twoFactorSecret || 'ABCDEFGHIJKLMNOP'}
          </Typography>

          <TextField
            label="Verification Code"
            fullWidth
            margin="normal"
            variant="outlined"
            value={twoFactorCode}
            onChange={e => setTwoFactorCode(e.target.value)}
            placeholder="Enter 6-digit code"
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTwoFactorSetupOpen(false)}>Cancel</Button>
          <Button
            onClick={handleVerifyTwoFactor}
            variant="filled"
            disabled={twoFactorCode.length !== 6}
          >
            Verify and Enable
          </Button>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog
        open={apiKeyDialogOpen}
        onClose={() => {
          setApiKeyDialogOpen(false);
          setNewApiKey('');
          setShowApiKey(false);
        }}
      >
        <DialogTitle>Your New API Key</DialogTitle>
        <DialogContent>
          <DialogContentText color="error" paragraph>
            Important: This key will only be shown once. Please copy it now and store it securely.
          </DialogContentText>

          <Box
            sx={{
              p: 2,
              backgroundColor: 'background.default',
              borderRadius: 1,
              fontFamily: 'monospace',
              position: 'relative',
            }}
          >
            <Box sx={{ wordBreak: 'break-all', ...(showApiKey ? {} : { filter: 'blur(5px)' }) }}>
              {newApiKey || 'sa_1234567890abcdefghijklmnopqrstuvwxyz'}
            </Box>
            <IconButton
              sx={{ position: 'absolute', top: 2, right: 2 }}
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Box>

          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(newApiKey);
              setSnackbar({
                open: true,
                message: 'API key copied to clipboard',
                severity: 'success',
              });
            }}
          >
            Copy to Clipboard
          </Button>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setApiKeyDialogOpen(false);
              setNewApiKey('');
              setShowApiKey(false);
            }}
            variant="filled"
            startIcon={<CheckIcon />}
          >
            I've Saved My Key
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

export default Security;
