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
  styled,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAuth } from '../../contexts/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/actions/authActions';

const drawerWidth = 240;

// Styled components
const Root = styled('div')({
  flexGrow: 1,
});

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: prop => prop !== 'open',
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  marginRight: theme.spacing(2),
}));

const Title = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  '& svg': {
    marginRight: theme.spacing(1),
  },
}));

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: prop => prop !== 'open',
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  ...(open && {
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '& .MuiDrawer-paper': {
      width: drawerWidth,
      overflowX: 'hidden',
    },
  }),
  ...(!open && {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(7) + 1,
    [theme.breakpoints.down('sm')]: {
      width: 0,
    },
    '& .MuiDrawer-paper': {
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
  }),
}));

const Toolbar2 = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  marginRight: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
}));

const ProfileButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  marginLeft: theme.spacing(2),
}));

const ActiveListItem = styled(ListItem)(({ theme }) => ({
  backgroundColor: theme.palette.action.selected,
  '& .MuiListItemIcon-root': {
    color: theme.palette.primary.main,
  },
  '& .MuiListItemText-primary': {
    fontWeight: 600,
    color: theme.palette.primary.main,
  },
}));

const RegularListItem = styled(ListItem)({});

const Navbar = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);

  // Safely access the alerts array with a default empty array
  // This retrieves the alerts array from the Redux store
  const reduxState = useSelector(state => state);
  const alertList = reduxState?.alerts?.alerts || [];
  const unreadAlerts = alertList.filter(alert => !alert.read).length;

  const handleProfileMenuOpen = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsOpen = event => {
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

  const handleNavigation = path => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const isActive = path => {
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
    <StyledDrawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={drawerOpen}
      onClose={handleDrawerToggle}
    >
      <Toolbar2>
        <IconButton onClick={handleDrawerToggle}>
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar2>
      <Divider />
      <List>
        {menuItems
          .filter(item => !item.authRequired || isAuthenticated)
          .map(item => {
            const ListItemComponent = isActive(item.path) ? ActiveListItem : RegularListItem;

            return (
              <ListItemComponent button key={item.text} onClick={() => handleNavigation(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemComponent>
            );
          })}
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
    </StyledDrawer>
  );

  return (
    <Root>
      <StyledAppBar position="fixed" open={drawerOpen && !isMobile}>
        <Toolbar>
          <MenuButton edge="start" color="inherit" aria-label="menu" onClick={handleDrawerToggle}>
            <MenuIcon />
          </MenuButton>
          <Title variant="h6" onClick={() => navigate('/')}>
            <SecurityIcon />
            Site-Analyser
          </Title>

          {isAuthenticated ? (
            <>
              <Tooltip title="Notifications">
                <IconButton color="inherit" onClick={handleNotificationsOpen}>
                  <Badge badgeContent={unreadAlerts} color="secondary">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <ProfileButton
                onClick={handleProfileMenuOpen}
                color="inherit"
                startIcon={<StyledAvatar>{user?.name?.charAt(0) || <PersonIcon />}</StyledAvatar>}
              >
                {!isMobile && (user?.name || 'Profile')}
              </ProfileButton>
              <Menu
                id="profile-menu"
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate('/settings/account');
                  }}
                >
                  My Account
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleMenuClose();
                    navigate('/settings/security');
                  }}
                >
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
                {alertList.length > 0 ? (
                  alertList.slice(0, 5).map((alert, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => {
                        handleNotificationsClose();
                        // Handle notification click
                      }}
                      sx={{
                        backgroundColor: alert.read ? 'inherit' : 'rgba(0, 0, 0, 0.04)',
                        whiteSpace: 'normal',
                      }}
                    >
                      <div>
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
                {alertList.length > 5 && (
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
      </StyledAppBar>
      {renderDrawer()}
      <Toolbar2 />
    </Root>
  );
};

export default Navbar;
