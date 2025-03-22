import React from 'react';
import {
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import BugReportIcon from '@mui/icons-material/BugReport';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';

// Using styled API instead of makeStyles
const Root = styled('div')({
  width: '100%',
});

const Section = styled('div')(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const SectionTitle = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const SectionIcon = styled('span')(({ theme }) => ({
  marginRight: theme.spacing(1),
  color: theme.palette.primary.main,
}));

const RiskAssessment = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.palette.background.default,
  borderLeft: `4px solid ${theme.palette.warning.main}`,
}));

const PriorityChip = styled(Chip)(({ theme }) => ({
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const RecommendationCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
}));

const PriorityBadge = styled('div')(({ theme, priority }) => {
  let backgroundColor;
  let color;

  switch (priority) {
    case 1:
      backgroundColor = theme.palette.error.main;
      color = theme.palette.error.contrastText;
      break;
    case 2:
      backgroundColor = theme.palette.warning.main;
      color = theme.palette.warning.contrastText;
      break;
    default:
      backgroundColor = theme.palette.info.main;
      color = theme.palette.info.contrastText;
  }

  return {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
    fontWeight: 'bold',
    backgroundColor,
    color,
  };
});

const CardContentStyled = styled(CardContent)(({ theme }) => ({
  position: 'relative',
}));

const LoadingContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
}));

const NoDataContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  textAlign: 'center',
}));

const GenerateButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

const Bulb = styled(LightbulbOutlinedIcon)(({ theme }) => ({
  fontSize: 48,
  marginBottom: theme.spacing(2),
  color: theme.palette.grey[400],
}));

const Disclaimer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: 4,
}));

// Helper function to get chip styling based on priority
const getChipSx = (index, theme) => {
  if (index === 0) {
    return {
      backgroundColor: theme.palette.error.main,
      color: theme.palette.error.contrastText,
    };
  } else if (index === 1) {
    return {
      backgroundColor: theme.palette.error.light,
      color: theme.palette.error.contrastText,
    };
  } else {
    return {
      backgroundColor: theme.palette.warning.main,
      color: theme.palette.warning.contrastText,
    };
  }
};

/**
 * AI-generated recommendations component for security reports
 *
 * @param {Object} props - Component props
 * @param {Object} props.analysis - AI analysis data from the API
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onGenerateAnalysis - Function to call when generate button is clicked
 */
const AiRecommendations = ({ analysis, loading = false, onGenerateAnalysis }) => {
  // If loading, show loading state
  if (loading) {
    return (
      <LoadingContainer>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body1" sx={{ marginTop: 2 }}>
          Generating AI-enhanced security analysis...
        </Typography>
      </LoadingContainer>
    );
  }

  // If no analysis data, show empty state with generate button
  if (
    !analysis ||
    (!analysis.recommendations?.length &&
      !analysis.riskAssessment &&
      !analysis.prioritizedActions?.length)
  ) {
    return (
      <NoDataContainer>
        <Bulb />
        <Typography variant="h6">AI-enhanced analysis not available</Typography>
        <Typography variant="body2" color="text.secondary">
          Generate an AI-powered analysis to get personalized recommendations and insights.
        </Typography>
        {onGenerateAnalysis && (
          <GenerateButton
            variant="contained"
            color="primary"
            onClick={onGenerateAnalysis}
            startIcon={<AutorenewIcon />}
          >
            Generate Analysis
          </GenerateButton>
        )}
      </NoDataContainer>
    );
  }

  // Default values if analysis is incomplete
  const recommendations = analysis.recommendations || [];
  const riskAssessment =
    analysis.riskAssessment || analysis.risk_assessment || 'No risk assessment available.';
  const prioritizedActions = analysis.prioritizedActions || analysis.prioritized_actions || [];

  return (
    <Root>
      {/* Risk Assessment */}
      <Section>
        <SectionTitle>
          <SectionIcon>
            <AssessmentIcon />
          </SectionIcon>
          <Typography variant="h6">Risk Assessment</Typography>
        </SectionTitle>
        <RiskAssessment elevation={0}>
          <Typography variant="body1">{riskAssessment}</Typography>
        </RiskAssessment>
      </Section>

      {/* Priority Actions */}
      {prioritizedActions.length > 0 && (
        <Section>
          <SectionTitle>
            <SectionIcon>
              <PriorityHighIcon />
            </SectionIcon>
            <Typography variant="h6">Prioritized Actions</Typography>
          </SectionTitle>
          <List>
            {prioritizedActions.map((action, index) => (
              <ListItem key={index} alignItems="flex-start">
                <ListItemIcon>
                  <PriorityChip
                    label={`P${index + 1}`}
                    size="small"
                    sx={theme => getChipSx(index, theme)}
                  />
                </ListItemIcon>
                <ListItemText primary={action} />
              </ListItem>
            ))}
          </List>
        </Section>
      )}

      <Divider sx={{ margin: '16px 0' }} />

      {/* Security Recommendations */}
      {recommendations.length > 0 && (
        <Section>
          <SectionTitle>
            <SectionIcon>
              <BugReportIcon />
            </SectionIcon>
            <Typography variant="h6">AI-Generated Security Recommendations</Typography>
          </SectionTitle>

          <Grid container spacing={3}>
            {recommendations.map((recommendation, index) => (
              <Grid item xs={12} md={4} key={index}>
                <RecommendationCard>
                  <CardContentStyled>
                    <PriorityBadge priority={index + 1}>Priority {index + 1}</PriorityBadge>
                    <Typography variant="h6" gutterBottom>
                      {recommendation.split('.')[0]}.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {recommendation.split('.').slice(1).join('.').trim()}
                    </Typography>
                  </CardContentStyled>
                </RecommendationCard>
              </Grid>
            ))}
          </Grid>
        </Section>
      )}

      {/* Disclaimer */}
      <Disclaimer>
        <Typography variant="caption" color="text.secondary">
          <strong>Note:</strong> These recommendations are generated by AI based on the scan
          results. While they provide valuable guidance, we recommend consulting with a security
          professional for comprehensive security implementation.
        </Typography>
      </Disclaimer>
    </Root>
  );
};

export default AiRecommendations;
