import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  styled,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Button from './Button';

// Styled components using emotion instead of makeStyles
const StyledDialog = styled(Dialog)(({ theme, isFullWidth, isFullScreen }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[10],
  },
  ...(isFullWidth && {
    '& .MuiDialog-paper': {
      width: '95%',
      maxWidth: '100%',
    },
  }),
  ...(isFullScreen && {
    '& .MuiDialog-paper': {
      margin: 0,
      width: '100%',
      maxWidth: '100%',
      borderRadius: 0,
    },
  }),
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2, 3),
  '& h2': {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const CloseIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.secondary,
}));

/**
 * Modal dialog component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {string} props.title - Modal title
 * @param {node} props.children - Modal content
 * @param {boolean} props.fullWidth - Whether the modal should take full width
 * @param {boolean} props.fullScreen - Whether the modal should be fullscreen
 * @param {string} props.maxWidth - Maximum width of the modal (xs, sm, md, lg, xl)
 * @param {Array} props.actions - Array of action button configurations
 * @param {boolean} props.disableBackdropClick - Whether to disable closing on backdrop click
 * @param {boolean} props.disableEscapeKeyDown - Whether to disable closing on Escape key
 */
const Modal = ({
  open,
  onClose,
  title,
  children,
  fullWidth = false,
  fullScreen: propFullScreen = false,
  maxWidth = 'sm',
  actions = [],
  disableBackdropClick = false,
  disableEscapeKeyDown = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));

  // Force fullScreen on mobile if specified
  const fullScreen = propFullScreen || (isMobile && fullWidth);

  const handleClose = (event, reason) => {
    if (disableBackdropClick && reason === 'backdropClick') {
      return;
    }
    if (onClose) {
      onClose(event, reason);
    }
  };

  const renderActions = () => {
    if (actions.length === 0) {
      return null;
    }

    return (
      <StyledDialogActions>
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'text'}
            color={action.color || 'primary'}
            onClick={action.onClick}
            loading={action.loading}
            disabled={action.disabled}
            startIcon={action.startIcon}
          >
            {action.label}
          </Button>
        ))}
      </StyledDialogActions>
    );
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      isFullWidth={fullWidth}
      isFullScreen={fullScreen}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      // In MUI v6, these props have been updated
      onBackdropClick={disableBackdropClick ? undefined : handleClose}
      // Note: disableEscapeKeyDown is still valid
      disableEscapeKeyDown={disableEscapeKeyDown}
      aria-labelledby="modal-title"
    >
      {title && (
        <StyledDialogTitle disableTypography id="modal-title">
          <Typography variant="h6">{title}</Typography>
          {onClose && (
            <CloseIconButton aria-label="close" onClick={onClose} size="small">
              <CloseIcon />
            </CloseIconButton>
          )}
        </StyledDialogTitle>
      )}
      <StyledDialogContent dividers={!title}>{children}</StyledDialogContent>
      {renderActions()}
    </StyledDialog>
  );
};

export default Modal;
