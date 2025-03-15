import React from 'react';
import { Box, Typography, CircularProgress, Tooltip } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import WarningIcon from '@material-ui/icons/Warning';
import ErrorIcon from '@material-ui/icons/Error';

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  scoreCircle: {
    position: 'relative',
    display: 'inline-flex',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  circleBackground: {
    color: theme.palette.grey[200],
  },
  circleProgress: {
    position: 'absolute',
    left: 0,
  },
  scoreValue: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
  gradeText: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
  },
  infoIcon: {
    marginLeft: theme.spacing(1),
    fontSize: '1rem',
    cursor: 'pointer',
    verticalAlign: 'middle',
  },
  categoryBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1, 0),
  },
  categoryIcon: {
    marginRight: theme.spacing(1),
  },
  excellent: {
    color: theme.palette.success.main,
  },
  good: {
    color: theme.palette.info.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  critical: {
    color: theme.palette.error.main,
  },
  categoriesContainer: {
    textAlign: 'left',
    marginTop: theme.spacing(2),
  },
  scoreLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}));

/**
 * Security score card component displaying overall security score
 * and breakdown by category
 * 
 * @param {Object} props - Component props
 * @param {Object|Number} props.score - Security score data or overall score
 */
const SecurityScoreCard = ({ score }) => {
  const classes = useStyles();
  
  // If score is a number, convert to object with overall property
  const scoreData = typeof score === 'number' ? { overall: score } : score || { overall: 0 };
  
  // Calculate security grade based on score
  const getGrade = (score) => {
    if (score >= 90) return { grade: 'A', label: 'Excellent', color: 'excellent' };
    if (score >= 80) return { grade: 'B', label: 'Good', color: 'good' };
    if (score >= 70) return { grade: 'C', label: 'Adequate', color: 'good' };
    if (score >= 60) return { grade: 'D', label: 'Warning', color: 'warning' };
    return { grade: 'F', label: 'Critical', color: 'critical' };
  };
  
  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 90) return classes.excellent;
    if (score >= 80) return classes.good;
    if (score >= 70) return classes.good;
    if (score >= 60) return classes.warning;
    return classes.critical;
  };
  
  // Security categories with component scores
  const categories = [
    { 
      name: 'SSL/TLS Security', 
      score: scoreData.ssl || 0, 
      description: 'Evaluates certificate validity, protocol versions, and cipher strength'
    },
    { 
      name: 'HTTP Headers', 
      score: scoreData.headers || 0, 
      description: 'Analyzes security headers, CSP, and CORS configuration'
    },
    { 
      name: 'Vulnerability Detection', 
      score: scoreData.vulnerabilities || 0, 
      description: 'Detects common web vulnerabilities and security weaknesses'
    },
    { 
      name: 'Server Configuration', 
      score: scoreData.server || 0, 
      description: 'Assesses server security settings and information exposure'
    },
  ];
  
  // Get icon based on category score
  const getCategoryIcon = (score) => {
    if (score >= 90) return <CheckCircleIcon className={`${classes.categoryIcon} ${classes.excellent}`} />;
    if (score >= 70) return <CheckCircleIcon className={`${classes.categoryIcon} ${classes.good}`} />;
    if (score >= 60) return <WarningIcon className={`${classes.categoryIcon} ${classes.warning}`} />;
    return <ErrorIcon className={`${classes.categoryIcon} ${classes.critical}`} />;
  };
  
  const { grade, label, color } = getGrade(scoreData.overall);
  
  return (
    <div className={classes.root}>
      <div className={classes.scoreLabel}>
        <Typography variant="h6">
          Security Score
        </Typography>
        <Tooltip title="Overall security rating based on multiple security factors">
          <InfoIcon className={classes.infoIcon} />
        </Tooltip>
      </div>
      
      <div className={classes.scoreCircle}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={120}
          thickness={5}
          className={classes.circleBackground}
        />
        <CircularProgress
          variant="determinate"
          value={scoreData.overall}
          size={120}
          thickness={5}
          className={`${classes.circleProgress} ${getScoreColor(scoreData.overall)}`}
        />
        <div className={classes.scoreValue}>
          <Typography variant="h4" component="div" className={classes.scoreText}>
            {scoreData.overall}
          </Typography>
        </div>
      </div>
      
      <Typography variant="h5" className={`${classes.gradeText} ${classes[color]}`}>
        Grade: {grade} ({label})
      </Typography>
      
      <div className={classes.categoriesContainer}>
        <Typography variant="subtitle2" gutterBottom>
          Category Breakdown:
        </Typography>
        
        {categories.map((category, index) => (
          <div key={index} className={classes.categoryBox}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {getCategoryIcon(category.score)}
              <Tooltip title={category.description}>
                <Typography variant="body2">{category.name}</Typography>
              </Tooltip>
            </div>
            <Typography variant="body2" className={getScoreColor(category.score)}>
              {category.score}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityScoreCard;