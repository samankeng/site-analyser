import React from 'react';
import { Button as MuiButton, CircularProgress, styled } from '@mui/material';
import clsx from 'clsx';

// Create a styled MuiButton with common styles
const StyledButton = styled(MuiButton)(
  ({ theme, customColor, customVariant, customSize, isFullWidth, isLoading }) => {
    // Base styles
    const baseStyles = {
      borderRadius: theme.shape.borderRadius,
      boxShadow: 'none',
      textTransform: 'none',
      fontWeight: 600,
      padding: theme.spacing(1, 3),
      '&:hover': {
        boxShadow: 'none',
      },
      ...(isFullWidth && { width: '100%' }),
      ...(isLoading && {
        opacity: 0.7,
        pointerEvents: 'none',
      }),
    };

    // Size styles
    const sizeStyles = {
      ...(customSize === 'small' && {
        padding: theme.spacing(0.5, 1.5),
        fontSize: theme.typography.pxToRem(13),
      }),
      ...(customSize === 'large' && {
        padding: theme.spacing(1.5, 4),
        fontSize: theme.typography.pxToRem(16),
      }),
    };

    // Variant and color styles
    let variantColorStyles = {};

    if (customVariant === 'contained') {
      switch (customColor) {
        case 'secondary':
          variantColorStyles = {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.secondary.dark,
            },
          };
          break;
        case 'success':
          variantColorStyles = {
            backgroundColor: theme.palette.success.main,
            color: theme.palette.success.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.success.dark,
            },
          };
          break;
        case 'error':
          variantColorStyles = {
            backgroundColor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.error.dark,
            },
          };
          break;
        case 'warning':
          variantColorStyles = {
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.warning.dark,
            },
          };
          break;
        case 'info':
          variantColorStyles = {
            backgroundColor: theme.palette.info.main,
            color: theme.palette.info.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.info.dark,
            },
          };
          break;
        case 'primary':
        default:
          variantColorStyles = {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
            },
          };
          break;
      }
    } else if (customVariant === 'outlined') {
      variantColorStyles = {
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      };

      switch (customColor) {
        case 'secondary':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.secondary.main,
            border: `1px solid ${theme.palette.secondary.main}`,
          };
          break;
        case 'success':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.success.main,
            border: `1px solid ${theme.palette.success.main}`,
          };
          break;
        case 'error':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.error.main,
            border: `1px solid ${theme.palette.error.main}`,
          };
          break;
        case 'warning':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.warning.main,
            border: `1px solid ${theme.palette.warning.main}`,
          };
          break;
        case 'info':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.info.main,
            border: `1px solid ${theme.palette.info.main}`,
          };
          break;
        case 'primary':
        default:
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.primary.main,
            border: `1px solid ${theme.palette.primary.main}`,
          };
          break;
      }
    } else if (customVariant === 'text') {
      variantColorStyles = {
        padding: theme.spacing(1, 2),
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)',
        },
      };

      switch (customColor) {
        case 'secondary':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.secondary.main,
          };
          break;
        case 'success':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.success.main,
          };
          break;
        case 'error':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.error.main,
          };
          break;
        case 'warning':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.warning.main,
          };
          break;
        case 'info':
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.info.main,
          };
          break;
        case 'primary':
        default:
          variantColorStyles = {
            ...variantColorStyles,
            color: theme.palette.primary.main,
          };
          break;
      }
    }

    return {
      ...baseStyles,
      ...sizeStyles,
      ...variantColorStyles,
    };
  }
);

const IconContainer = styled('span')(({ theme, position }) => ({
  ...(position === 'left' && {
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(-0.5),
  }),
  ...(position === 'right' && {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(-0.5),
  }),
  ...(position === 'loading' && {
    color: 'inherit',
    marginRight: theme.spacing(1),
    marginLeft: theme.spacing(-1),
  }),
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
  const renderStartIcon = () => {
    if (loading) {
      return (
        <IconContainer position="loading">
          <CircularProgress size={20} />
        </IconContainer>
      );
    }
    if (startIcon) {
      return <IconContainer position="left">{startIcon}</IconContainer>;
    }
    return null;
  };

  const renderEndIcon = () => {
    if (endIcon) {
      return <IconContainer position="right">{endIcon}</IconContainer>;
    }
    return null;
  };

  return (
    <StyledButton
      customVariant={variant}
      customColor={color}
      customSize={size}
      isFullWidth={fullWidth}
      isLoading={loading}
      onClick={onClick}
      disabled={loading || rest.disabled}
      className={className}
      {...rest}
    >
      {renderStartIcon()}
      {children}
      {renderEndIcon()}
    </StyledButton>
  );
};

export default Button;
