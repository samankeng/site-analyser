import React from 'react';
import { Typography, Button, Box, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(6, 3),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: 500,
  },
  message: {
    color: theme.palette.text.secondary,
    maxWidth: 500,
    marginBottom: theme.spacing(3),
  },
  button: {
    marginTop: theme.spacing(2),
  },
  secondaryButton: {
    marginTop: theme.spacing(1),
  },
}));

/**
 * EmptyState component for displaying when no data is available
 * @param {Object} props - Component props
 * @param {string} props.title - Title text
 * @param {string} props.message - Description message
 * @param {React.ReactNode} props.icon - Icon to display
 * @param {Object} props.primaryAction - Primary action button configuration
 * @param {Object} props.secondaryAction - Secondary action button configuration
 * @param {boolean} props.paper - Whether to wrap in Paper component
 */
const EmptyState = ({
  title,
  message,
  icon,
  primaryAction,
  secondaryAction,
  paper = true,
}) => {
  const classes = useStyles();

  const content = (
    <Box className={classes.root}>
      {icon && <div className={classes.icon}>{icon}</div>}
      
      {title && (
        <Typography variant="h5" className={classes.title}>
          {title}
        </Typography>
      )}
      
      {message && (
        <Typography variant="body1" className={classes.message}>
          {message}
        </Typography>
      )}
      
      {primaryAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={primaryAction.onClick}
          className={classes.button}
          startIcon={primaryAction.icon}
        >
          {primaryAction.label}
        </Button>
      )}
      
      {secondaryAction && (
        <Button
          variant="text"
          color="primary"
          onClick={secondaryAction.onClick}
          className={classes.secondaryButton}
          startIcon={secondaryAction.icon}
        >
          {secondaryAction.label}
        </Button>
      )}
    </Box>
  );

  if (paper) {
    return <Paper elevation={1}>{content}</Paper>;
  }

  return content;
};

export default EmptyState;