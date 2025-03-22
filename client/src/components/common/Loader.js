import React from 'react';
import { CircularProgress, Typography, Box, styled } from '@mui/material';

// Create styled components using emotion instead of makeStyles
const LoaderContainer = styled(Box)(({ theme, isFullPage }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(3),
  width: '100%',
  ...(isFullPage && {
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1300,
  }),
}));

const StyledProgress = styled(CircularProgress)(({ theme, colorVariant }) => ({
  marginBottom: theme.spacing(2),
  ...(colorVariant === 'primary' && {
    color: theme.palette.primary.main,
  }),
  ...(colorVariant === 'secondary' && {
    color: theme.palette.secondary.main,
  }),
  ...(colorVariant === 'warning' && {
    color: theme.palette.warning.main,
  }),
}));

const ProgressWrapper = styled('div')({
  position: 'relative',
  display: 'inline-flex',
});

const ProgressLabel = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const StyledText = styled(Typography)({
  textAlign: 'center',
});

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

  const renderLoader = () => {
    const circularProgress =
      value > 0 ? (
        <ProgressWrapper>
          <StyledProgress
            variant="determinate"
            value={value}
            size={getSize()}
            colorVariant={color}
          />
          {showValue && (
            <ProgressLabel>
              <Typography variant="caption" component="div" color="textSecondary">
                {`${Math.round(value)}%`}
              </Typography>
            </ProgressLabel>
          )}
        </ProgressWrapper>
      ) : (
        <StyledProgress size={getSize()} colorVariant={color} />
      );

    return (
      <LoaderContainer isFullPage={fullPage}>
        {circularProgress}
        {text && <StyledText variant="body2">{text}</StyledText>}
      </LoaderContainer>
    );
  };

  return renderLoader();
};

export default Loader;
