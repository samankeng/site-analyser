import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import NotificationsIcon from '@material-ui/icons/Notifications';
import SecurityIcon from '@material-ui/icons/Security';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AssessmentIcon from '@material-ui/icons/Assessment';
import SettingsIcon from '@material-ui/icons/Settings';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import PersonIcon from '@material-ui/icons/Person';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import { useAuth } from '../../contexts/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/actions/authActions';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    [theme.breakpoints.down('sm')]: {
      width: 0,
    },
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  avatar: {
    marginRight: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  profileButton: {
    textTransform: 'none',
    marginLeft: theme.spacing(2),
  },
  activeListItem: {
    backgroundColor: theme.palette.action.selected,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    '& .MuiListItemText-primary': {
      fontWeight: 600,
      color: theme.palette.primary.main,
    },
  },
}));

const Navbar = () => {
  const classes = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  
  const alerts = useSelector(state => state.alert.alerts || []);
  const unreadAlerts = alerts.filter(alert => !alert.read).length;

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      authRequired: true,
    },
    {
      text: 'New Scan',
      icon: <SecurityIcon />,
      path: '/scan',
      authRequired: true,
    },
    {
      text: 'Reports',
      icon: <AssessmentIcon />,
      path: '/reports',
      authRequired: true,
    },
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings/account',
      authRequired: true,
    },
  ];

  const renderDrawer = () => (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      className={drawerOpen ? classes.drawerOpen : classes.drawerClose}
      classes={{
        paper: drawerOpen ? classes.drawerOpen : classes.drawerClose,
      }}
      open={drawerOpen}
      onClose={handleDrawerToggle}
    >
      <div className={classes.toolbar}>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeftIcon />
        </IconButton>
      </div>
      <Divider />
      <List>
        {menuItems.filter(item => !item.authRequired || isAuthenticated).map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            className={isActive(item.path) ? classes.activeListItem : ''}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      {isAuthenticated && (
        <>
          <Divider />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      )}
    </Drawer>
  );

  return (
    <div className={classes.root}>
      <AppBar
        position="fixed"
        className={drawerOpen && !isMobile ? classes.appBarShift : classes.appBar}
      >
        <Toolbar>
          <IconButton
            edge="start"
            className={classes.menuButton}
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            className={classes.title}
            onClick={() => navigate('/')}
          >
            <SecurityIcon />
            Site-Analyser
          </Typography>

          {isAuthenticated ? (
            <>
              <Tooltip title="Notifications">
                <IconButton color="inherit" onClick={handleNotificationsOpen}>
                  <Badge badgeContent={unreadAlerts} color="secondary">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Button
                className={classes.profileButton}
                onClick={handleProfileMenuOpen}
                color="inherit"
                startIcon={
                  <Avatar className={classes.avatar}>
                    {user?.name?.charAt(0) || <PersonIcon />}
                  </Avatar>
                }
              >
                {!isMobile && (user?.name || 'Profile')}
              </Button>
              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate('/settings/account');
                }}>
                  My Account
                </MenuItem>
                <MenuItem onClick={() => {
                  handleMenuClose();
                  navigate('/settings/security');
                }}>
                  Security
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
              <Menu
                id="notifications-menu"
                anchorEl={notificationsAnchorEl}
                keepMounted
                open={Boolean(notificationsAnchorEl)}
                onClose={handleNotificationsClose}
                PaperProps={{
                  style: {
                    maxHeight: 300,
                    width: 320,
                  },
                }}
              >
                {alerts.length > 0 ? (
                  alerts.slice(0, 5).map((alert, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => {
                        handleNotificationsClose();
                        // Handle notification click
                      }}
                      style={{
                        backgroundColor: alert.read ? 'inherit' : 'rgba(0, 0, 0, 0.04)',
                      }}
                    >
                      <div style={{ whiteSpace: 'normal' }}>
                        <Typography variant="subtitle2">{alert.title}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {alert.message}
                        </Typography>
                      </div>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No notifications</MenuItem>
                )}
                {alerts.length > 5 && (
                  <MenuItem
                    onClick={() => {
                      handleNotificationsClose();
                      navigate('/notifications');
                    }}
                  >
                    <Typography variant="body2" color="primary">
                      View all notifications
                    </Typography>
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button color="inherit" onClick={() => navigate('/register')}>
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      {renderDrawer()}
      <div className={classes.toolbar} />
    </div>
  );
};

export default Navbar;