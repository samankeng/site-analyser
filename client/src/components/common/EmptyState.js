import React from 'react';
import { Typography, Button, Box, Paper, styled } from '@mui/material';

// Create styled components using emotion instead of makeStyles
const StyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const IconWrapper = styled('div')(({ theme }) => ({
  fontSize: 64,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.secondary,
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontWeight: 500,
}));

const StyledMessage = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  maxWidth: 500,
  marginBottom: theme.spacing(3),
}));

const PrimaryButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const SecondaryButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
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
const EmptyState = ({ title, message, icon, primaryAction, secondaryAction, paper = true }) => {
  const content = (
    <StyledContainer>
      {icon && <IconWrapper>{icon}</IconWrapper>}

      {title && <StyledTitle variant="h5">{title}</StyledTitle>}

      {message && <StyledMessage variant="body1">{message}</StyledMessage>}

      {primaryAction && (
        <PrimaryButton
          variant="contained"
          color="primary"
          onClick={primaryAction.onClick}
          startIcon={primaryAction.icon}
        >
          {primaryAction.label}
        </PrimaryButton>
      )}

      {secondaryAction && (
        <SecondaryButton
          variant="text"
          color="primary"
          onClick={secondaryAction.onClick}
          startIcon={secondaryAction.icon}
        >
          {secondaryAction.label}
        </SecondaryButton>
      )}
    </StyledContainer>
  );

  if (paper) {
    return <Paper elevation={1}>{content}</Paper>;
  }

  return content;
};

export default EmptyState;
