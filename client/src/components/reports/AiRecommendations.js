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
  CircularProgress
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import WarningIcon from '@material-ui/icons/Warning';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import BugReportIcon from '@material-ui/icons/BugReport';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import AssessmentIcon from '@material-ui/icons/Assessment';
import LightbulbOutlinedIcon from '@material-ui/icons/LightbulbOutlined';

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  sectionIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  riskAssessment: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
    borderLeft: `4px solid ${theme.palette.warning.main}`,
  },
  priorityChip: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  critical: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  high: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  },
  medium: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  low: {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
  recommendationCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  priorityBadge: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  priority1: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  priority2: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
  },
  priority3: {
    backgroundColor: theme.palette.info.main,
    color: theme.palette.info.contrastText,
  },
  cardContent: {
    position: 'relative',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(4),
    textAlign: 'center',
  },
  generateButton: {
    marginTop: theme.spacing(2),
  },
  bulb: {
    fontSize: 48,
    marginBottom: theme.spacing(2),
    color: theme.palette.grey[400],
  },
  disclaimer: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: 4,
  },
}));

/**
 * AI-generated recommendations component for security reports
 * 
 * @param {Object} props - Component props
 * @param {Object} props.analysis - AI analysis data from the API
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.onGenerateAnalysis - Function to call when generate button is clicked
 */
const AiRecommendations = ({ 
  analysis, 
  loading = false, 
  onGenerateAnalysis
}) => {
  const classes = useStyles();
  
  // If loading, show loading state
  if (loading) {
    return (
      <div className={classes.loadingContainer}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body1" style={{ marginTop: 16 }}>
          Generating AI-enhanced security analysis...
        </Typography>
      </div>
    );
  }

  // If no analysis data, show empty state with generate button
  if (!analysis || (
    !analysis.recommendations?.length && 
    !analysis.riskAssessment && 
    !analysis.prioritizedActions?.length)
  ) {
    return (
      <div className={classes.noDataContainer}>
        <LightbulbOutlinedIcon className={classes.bulb} />
        <Typography variant="h6">
          AI-enhanced analysis not available
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Generate an AI-powered analysis to get personalized recommendations and insights.
        </Typography>
        {onGenerateAnalysis && (
          <Button
            variant="contained"
            color="primary"
            className={classes.generateButton}
            onClick={onGenerateAnalysis}
            startIcon={<AutorenewIcon />}
          >
            Generate Analysis
          </Button>
        )}
      </div>
    );
  }
  
  // Default values if analysis is incomplete
  const recommendations = analysis.recommendations || [];
  const riskAssessment = analysis.riskAssessment || analysis.risk_assessment || "No risk assessment available.";
  const prioritizedActions = analysis.prioritizedActions || analysis.prioritized_actions || [];
  
  return (
    <div className={classes.root}>
      {/* Risk Assessment */}
      <div className={classes.section}>
        <div className={classes.sectionTitle}>
          <AssessmentIcon className={classes.sectionIcon} />
          <Typography variant="h6">Risk Assessment</Typography>
        </div>
        <Paper className={classes.riskAssessment} elevation={0}>
          <Typography variant="body1">{riskAssessment}</Typography>
        </Paper>
      </div>
      
      {/* Priority Actions */}
      {prioritizedActions.length > 0 && (
        <div className={classes.section}>
          <div className={classes.sectionTitle}>
            <PriorityHighIcon className={classes.sectionIcon} />
            <Typography variant="h6">Prioritized Actions</Typography>
          </div>
          <List>
            {prioritizedActions.map((action, index) => (
              <ListItem key={index} alignItems="flex-start">
                <ListItemIcon>
                  <Chip 
                    label={`P${index + 1}`} 
                    className={`${classes.priorityChip} ${
                      index === 0 ? classes.critical : 
                      index === 1 ? classes.high : 
                      classes.medium
                    }`} 
                    size="small"
                  />
                </ListItemIcon>
                <ListItemText primary={action} />
              </ListItem>
            ))}
          </List>
        </div>
      )}
      
      <Divider style={{ margin: '16px 0' }} />
      
      {/* Security Recommendations */}
      {recommendations.length > 0 && (
        <div className={classes.section}>
          <div className={classes.sectionTitle}>
            <BugReportIcon className={classes.sectionIcon} />
            <Typography variant="h6">AI-Generated Security Recommendations</Typography>
          </div>
          
          <Grid container spacing={3}>
            {recommendations.map((recommendation, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card className={classes.recommendationCard}>
                  <CardContent className={classes.cardContent}>
                    <div className={`${classes.priorityBadge} ${
                      index === 0 ? classes.priority1 : 
                      index === 1 ? classes.priority2 : 
                      classes.priority3
                    }`}>
                      Priority {index + 1}
                    </div>
                    <Typography variant="h6" gutterBottom>
                      {recommendation.split('.')[0]}.
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {recommendation.split('.').slice(1).join('.').trim()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>
      )}
      
      {/* Disclaimer */}
      <Box className={classes.disclaimer}>
        <Typography variant="caption" color="textSecondary">
          <strong>Note:</strong> These recommendations are generated by AI based on the scan results. 
          While they provide valuable guidance, we recommend consulting with a security professional 
          for comprehensive security implementation.
        </Typography>
      </Box>
    </div>
  );
};

export default AiRecommendations;