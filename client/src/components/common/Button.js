import React from 'react';
import { Button as MuiButton, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  root: {
    borderRadius: theme.shape.borderRadius,
    boxShadow: 'none',
    textTransform: 'none',
    fontWeight: 600,
    padding: theme.spacing(1, 3),
    '&:hover': {
      boxShadow: 'none',
    },
  },
  primary: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  secondary: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.secondary.dark,
    },
  },
  success: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.success.dark,
    },
  },
  error: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.error.dark,
    },
  },
  warning: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.warning.dark,
    },
  },
  info: {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.info.dark,
    },
  },
  outlined: {
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  primaryOutlined: {
    color: theme.palette.primary.main,
    border: `1px solid ${theme.palette.primary.main}`,
  },
  secondaryOutlined: {
    color: theme.palette.secondary.main,
    border: `1px solid ${theme.palette.secondary.main}`,
  },
  successOutlined: {
    color: theme.palette.success.main,
    border: `1px solid ${theme.palette.success.main}`,
  },
  errorOutlined: {
    color: theme.palette.error.main,
    border: `1px solid ${theme.palette.error.main}`,
  },
  warningOutlined: {
    color: theme.palette.warning.main,
    border: `1px solid ${theme.palette.warning.main}`,
  },
  infoOutlined: {
    color: theme.palette.info.main,
    border: `1px solid ${theme.palette.info.main}`,
  },
  text: {
    padding: theme.spacing(1, 2),
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
    },
  },
  primaryText: {
    color: theme.palette.primary.main,
  },
  secondaryText: {
    color: theme.palette.secondary.main,
  },
  successText: {
    color: theme.palette.success.main,
  },
  errorText: {
    color: theme.palette.error.main,
  },
  warningText: {
    color: theme.palette.warning.main,
  },
  infoText: {
    color: theme.palette.info.main,
  },
  small: {
    padding: theme.spacing(0.5, 1.5),
    fontSize: theme.typography.pxToRem(13),
  },
  large: {
    padding: theme.spacing(1.5, 4),
    fontSize: theme.typography.pxToRem(16),
  },
  fullWidth: {
    width: '100%',
  },
  loading: {
    opacity: 0.7,
    pointerEvents: 'none',
  },
  loadingIndicator: {
    color: 'inherit',
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(-1),
  },
  iconLeft: {
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(-0.5),
  },
  iconRight: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(-0.5),
  },
}));

/**
 * Custom button component extending Material-UI Button
 * @param {Object} props - Component props
 * @param {string} props.variant - Button variant (contained, outlined, text)
 * @param {string} props.color - Button color (primary, secondary, success, error, warning, info)
 * @param {string} props.size - Button size (small, medium, large)
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {node} props.startIcon - Icon to display at start of button
 * @param {node} props.endIcon - Icon to display at end of button
 * @param {Function} props.onClick - Function to call on button click
 * @param {string} props.className - Additional CSS class
 */
const Button = ({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  startIcon,
  endIcon,
  onClick,
  className,
  ...rest
}) => {
  const classes = useStyles();

  const getVariantClass = () => {
    switch (variant) {
      case 'outlined':
        return classes.outlined;
      case 'text':
        return classes.text;
      case 'contained':
      default:
        return '';
    }
  };

  const getColorClass = () => {
    if (variant === 'contained') {
      switch (color) {
        case 'secondary':
          return classes.secondary;
        case 'success':
          return classes.success;
        case 'error':
          return classes.error;
        case 'warning':
          return classes.warning;
        case 'info':
          return classes.info;
        case 'primary':
        default:
          return classes.primary;
      }
    } else if (variant === 'outlined') {
      switch (color) {
        case 'secondary':
          return classes.secondaryOutlined;
        case 'success':
          return classes.successOutlined;
        case 'error':
          return classes.errorOutlined;
        case 'warning':
          return classes.warningOutlined;
        case 'info':
          return classes.infoOutlined;
        case 'primary':
        default:
          return classes.primaryOutlined;
      }
    } else {
      // text variant
      switch (color) {
        case 'secondary':
          return classes.secondaryText;
        case 'success':
          return classes.successText;
        case 'error':
          return classes.errorText;
        case 'warning':
          return classes.warningText;
        case 'info':
          return classes.infoText;
        case 'primary':
        default:
          return classes.primaryText;
      }
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return classes.small;
      case 'large':
        return classes.large;
      case 'medium':
      default:
        return '';
    }
  };

  const buttonClasses = clsx(
    classes.root,
    getVariantClass(),
    getColorClass(),
    getSizeClass(),
    {
      [classes.fullWidth]: fullWidth,
      [classes.loading]: loading,
    },
    className
  );

  const renderStartIcon = () => {
    if (loading) {
      return <CircularProgress size={20} className={classes.loadingIndicator} />;
    }
    if (startIcon) {
      return <span className={classes.iconLeft}>{startIcon}</span>;
    }
    return null;
  };

  const renderEndIcon = () => {
    if (endIcon) {
      return <span className={classes.iconRight}>{endIcon}</span>;
    }
    return null;
  };

  return (
    <MuiButton
      className={buttonClasses}
      onClick={onClick}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {renderStartIcon()}
      {children}
      {renderEndIcon()}
    </MuiButton>
  );
};

export default Button;