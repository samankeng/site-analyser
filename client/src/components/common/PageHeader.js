import React from 'react';
import { Typography, Breadcrumbs, Box, Paper, Button, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { makeStyles } from '@mui/styles';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: 600,
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  breadcrumbs: {
    marginBottom: theme.spacing(1),
  },
  icon: {
    marginRight: theme.spacing(0.5),
    fontSize: 20,
    verticalAlign: 'text-bottom',
  },
  breadcrumbLink: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  actions: {
    display: 'flex',
    gap: theme.spacing(1),
    [theme.breakpoints.down('xs')]: {
      marginTop: theme.spacing(2),
      width: '100%',
      justifyContent: 'flex-end',
    },
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
}));

/**
 * PageHeader component for page titles, breadcrumbs, and actions
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Page subtitle
 * @param {Array} props.breadcrumbs - Array of breadcrumb items
 * @param {Array} props.actions - Array of action button configurations
 * @param {boolean} props.divider - Whether to show divider below header
 * @param {boolean} props.paper - Whether to wrap in Paper component
 */
const PageHeader = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  divider = false,
  paper = true,
}) => {
  const classes = useStyles();

  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) {
      return null;
    }

    return (
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        className={classes.breadcrumbs}
      >
        <RouterLink to="/" className={classes.breadcrumbLink}>
          <HomeIcon className={classes.icon} />
          Home
        </RouterLink>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          if (isLast || !breadcrumb.link) {
            return (
              <Typography
                key={index}
                color="textPrimary"
                className={classes.breadcrumbLink}
              >
                {breadcrumb.icon && (
                  <span className={classes.icon}>{breadcrumb.icon}</span>
                )}
                {breadcrumb.label}
              </Typography>
            );
          }
          
          return (
            <RouterLink
              key={index}
              to={breadcrumb.link}
              className={classes.breadcrumbLink}
            >
              {breadcrumb.icon && (
                <span className={classes.icon}>{breadcrumb.icon}</span>
              )}
              {breadcrumb.label}
            </RouterLink>
          );
        })}
      </Breadcrumbs>
    );
  };

  const renderActions = () => {
    if (actions.length === 0) {
      return null;
    }

    return (
      <div className={classes.actions}>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'contained'}
            color={action.color || 'primary'}
            startIcon={action.icon}
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  const content = (
    <div className={classes.root}>
      {renderBreadcrumbs()}
      <div className={classes.titleContainer}>
        <div>
          <Typography variant="h4" className={classes.title}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="subtitle1" className={classes.subtitle}>
              {subtitle}
            </Typography>
          )}
        </div>
        {renderActions()}
      </div>
      {divider && <Divider className={classes.divider} />}
    </div>
  );

  if (paper) {
    return <Paper className={classes.paper}>{content}</Paper>;
  }

  return content;
};

export default PageHeader;