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
} from '@material-ui/core';
import { makeStyles } from '@mui/styles';
import CloseIcon from '@mui/icons-material/Close';
import Button from './Button';

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiDialog-paper': {
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[10],
    },
  },
  title: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(2, 3),
    '& h2': {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
  },
  content: {
    padding: theme.spacing(3),
  },
  actions: {
    padding: theme.spacing(2, 3),
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  closeButton: {
    color: theme.palette.text.secondary,
  },
  fullWidth: {
    '& .MuiDialog-paper': {
      width: '95%',
      maxWidth: '100%',
    },
  },
  fullScreen: {
    '& .MuiDialog-paper': {
      margin: 0,
      width: '100%',
      maxWidth: '100%',
      borderRadius: 0,
    },
  },
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
  const classes = useStyles();
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
      <DialogActions className={classes.actions}>
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
      </DialogActions>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className={`${classes.root} ${fullWidth ? classes.fullWidth : ''} ${
        fullScreen ? classes.fullScreen : ''
      }`}
      fullWidth={fullWidth}
      fullScreen={fullScreen}
      maxWidth={maxWidth}
      disableBackdropClick={disableBackdropClick}
      disableEscapeKeyDown={disableEscapeKeyDown}
      aria-labelledby="modal-title"
    >
      {title && (
        <DialogTitle disableTypography className={classes.title} id="modal-title">
          <Typography variant="h6">{title}</Typography>
          {onClose && (
            <IconButton
              aria-label="close"
              className={classes.closeButton}
              onClick={onClose}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent className={classes.content} dividers={!title}>
        {children}
      </DialogContent>
      {renderActions()}
    </Dialog>
  );
};

export default Modal;