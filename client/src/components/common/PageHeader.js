import React from 'react';
import { Typography, Breadcrumbs, Box, Paper, Button, Divider, styled } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

// Styled components using emotion instead of makeStyles
const Root = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
}));

const TitleContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  [theme.breakpoints.down('xs')]: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
}));

const Title = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  fontWeight: 600,
}));

const Subtitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(2),
}));

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: theme.spacing(1),
}));

const IconWrapper = styled('span')(({ theme }) => ({
  marginRight: theme.spacing(0.5),
  fontSize: 20,
  verticalAlign: 'text-bottom',
}));

const BreadcrumbLink = styled(RouterLink)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  textDecoration: 'none',
  '&:hover': {
    textDecoration: 'underline',
  },
}));

const BreadcrumbTypography = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.primary,
}));

const Actions = styled('div')(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  [theme.breakpoints.down('xs')]: {
    marginTop: theme.spacing(2),
    width: '100%',
    justifyContent: 'flex-end',
  },
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(2, 0),
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
  const renderBreadcrumbs = () => {
    if (breadcrumbs.length === 0) {
      return null;
    }

    return (
      <StyledBreadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <BreadcrumbLink to="/">
          <HomeIcon sx={{ mr: 0.5, fontSize: 20 }} />
          Home
        </BreadcrumbLink>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast || !breadcrumb.link) {
            return (
              <BreadcrumbTypography key={index}>
                {breadcrumb.icon && <IconWrapper>{breadcrumb.icon}</IconWrapper>}
                {breadcrumb.label}
              </BreadcrumbTypography>
            );
          }

          return (
            <BreadcrumbLink key={index} to={breadcrumb.link}>
              {breadcrumb.icon && <IconWrapper>{breadcrumb.icon}</IconWrapper>}
              {breadcrumb.label}
            </BreadcrumbLink>
          );
        })}
      </StyledBreadcrumbs>
    );
  };

  const renderActions = () => {
    if (actions.length === 0) {
      return null;
    }

    return (
      <Actions>
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
      </Actions>
    );
  };

  const content = (
    <Root>
      {renderBreadcrumbs()}
      <TitleContainer>
        <div>
          <Title variant="h4">{title}</Title>
          {subtitle && <Subtitle variant="subtitle1">{subtitle}</Subtitle>}
        </div>
        {renderActions()}
      </TitleContainer>
      {divider && <StyledDivider />}
    </Root>
  );

  if (paper) {
    return <StyledPaper>{content}</StyledPaper>;
  }

  return content;
};

export default PageHeader;
