import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
    width: '100%',
  },
  fullPage: {
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1300,
  },
  progress: {
    marginBottom: theme.spacing(2),
  },
  text: {
    textAlign: 'center',
  },
  colorPrimary: {
    color: theme.palette.primary.main,
  },
  colorSecondary: {
    color: theme.palette.secondary.main,
  },
  colorWarning: {
    color: theme.palette.warning.main,
  },
  progressWrapper: {
    position: 'relative',
    display: 'inline-flex',
  },
  progressLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

/**
 * Loader component for displaying loading states
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the loader (small, medium, large)
 * @param {string} props.color - Color of the loader (primary, secondary, warning)
 * @param {string} props.text - Text to display below the loader
 * @param {boolean} props.fullPage - Whether to display the loader fullscreen
 * @param {number} props.value - Progress value (0-100) for determinate loader
 * @param {boolean} props.showValue - Whether to show the progress value
 */
const Loader = ({
  size = 'medium',
  color = 'primary',
  text,
  fullPage = false,
  value = 0,
  showValue = false,
}) => {
  const classes = useStyles();

  const getSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 60;
      case 'medium':
      default:
        return 40;
    }
  };

  const getColorClass = () => {
    switch (color) {
      case 'secondary':
        return classes.colorSecondary;
      case 'warning':
        return classes.colorWarning;
      case 'primary':
      default:
        return classes.colorPrimary;
    }
  };

  const renderLoader = () => {
    const circularProgress = value > 0 ? (
      <div className={classes.progressWrapper}>
        <CircularProgress
          variant="determinate"
          value={value}
          size={getSize()}
          className={`${classes.progress} ${getColorClass()}`}
        />
        {showValue && (
          <div className={classes.progressLabel}>
            <Typography variant="caption" component="div" color="textSecondary">
              {`${Math.round(value)}%`}
            </Typography>
          </div>
        )}
      </div>
    ) : (
      <CircularProgress
        size={getSize()}
        className={`${classes.progress} ${getColorClass()}`}
      />
    );

    return (
      <Box className={`${classes.root} ${fullPage ? classes.fullPage : ''}`}>
        {circularProgress}
        {text && (
          <Typography variant="body2" className={classes.text}>
            {text}
          </Typography>
        )}
      </Box>
    );
  };

  return renderLoader();
};

export default Loader;