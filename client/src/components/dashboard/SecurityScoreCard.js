import React from 'react';
import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';

// Using styled API instead of makeStyles
const Root = styled('div')(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(2),
}));

const ScoreCircle = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'inline-flex',
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

const CircleBackground = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.grey[200],
}));

const CircleProgressStyled = styled(CircularProgress)(({ theme }) => ({
  position: 'absolute',
  left: 0,
}));

const ScoreValue = styled('div')(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const ScoreText = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  fontSize: '1.5rem',
}));

const GradeText = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  fontWeight: 'bold',
  marginTop: theme.spacing(1),
}));

const StyledInfoIcon = styled(InfoIcon)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  fontSize: '1rem',
  cursor: 'pointer',
  verticalAlign: 'middle',
}));

const CategoryBox = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1, 0),
}));

const CategoryIcon = styled('span')(() => ({
  marginRight: '8px',
}));

const CategoriesContainer = styled('div')(({ theme }) => ({
  textAlign: 'left',
  marginTop: theme.spacing(2),
}));

const ScoreLabel = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

// Score color styles
const getColorClassName = (theme, score) => {
  if (score >= 90) return theme.palette.success.main;
  if (score >= 80) return theme.palette.info.main;
  if (score >= 70) return theme.palette.info.main;
  if (score >= 60) return theme.palette.warning.main;
  return theme.palette.error.main;
};

/**
 * Security score card component displaying overall security score
 * and breakdown by category
 *
 * @param {Object} props - Component props
 * @param {Object|Number} props.score - Security score data or overall score
 */
const SecurityScoreCard = ({ score }) => {
  // If score is a number, convert to object with overall property
  const scoreData = typeof score === 'number' ? { overall: score } : score || { overall: 0 };

  // Calculate security grade based on score
  const getGrade = score => {
    if (score >= 90) return { grade: 'A', label: 'Excellent', color: 'success.main' };
    if (score >= 80) return { grade: 'B', label: 'Good', color: 'info.main' };
    if (score >= 70) return { grade: 'C', label: 'Adequate', color: 'info.main' };
    if (score >= 60) return { grade: 'D', label: 'Warning', color: 'warning.main' };
    return { grade: 'F', label: 'Critical', color: 'error.main' };
  };

  // Security categories with component scores
  const categories = [
    {
      name: 'SSL/TLS Security',
      score: scoreData.ssl || 0,
      description: 'Evaluates certificate validity, protocol versions, and cipher strength',
    },
    {
      name: 'HTTP Headers',
      score: scoreData.headers || 0,
      description: 'Analyzes security headers, CSP, and CORS configuration',
    },
    {
      name: 'Vulnerability Detection',
      score: scoreData.vulnerabilities || 0,
      description: 'Detects common web vulnerabilities and security weaknesses',
    },
    {
      name: 'Server Configuration',
      score: scoreData.server || 0,
      description: 'Assesses server security settings and information exposure',
    },
  ];

  // Get icon based on category score
  const getCategoryIcon = score => {
    if (score >= 90) {
      return (
        <CategoryIcon>
          <CheckCircleIcon sx={{ color: 'success.main' }} fontSize="small" />
        </CategoryIcon>
      );
    }
    if (score >= 70) {
      return (
        <CategoryIcon>
          <CheckCircleIcon sx={{ color: 'info.main' }} fontSize="small" />
        </CategoryIcon>
      );
    }
    if (score >= 60) {
      return (
        <CategoryIcon>
          <WarningIcon sx={{ color: 'warning.main' }} fontSize="small" />
        </CategoryIcon>
      );
    }
    return (
      <CategoryIcon>
        <ErrorIcon sx={{ color: 'error.main' }} fontSize="small" />
      </CategoryIcon>
    );
  };

  const { grade, label, color } = getGrade(scoreData.overall);

  return (
    <Root>
      <ScoreLabel>
        <Typography variant="h6">Security Score</Typography>
        <Tooltip title="Overall security rating based on multiple security factors">
          <StyledInfoIcon fontSize="small" />
        </Tooltip>
      </ScoreLabel>

      <ScoreCircle>
        <CircleBackground variant="determinate" value={100} size={120} thickness={5} />
        <CircleProgressStyled
          variant="determinate"
          value={scoreData.overall}
          size={120}
          thickness={5}
          sx={{ color: getColorClassName }}
        />
        <ScoreValue>
          <ScoreText variant="h4" component="div">
            {scoreData.overall}
          </ScoreText>
        </ScoreValue>
      </ScoreCircle>

      <GradeText variant="h5" sx={{ color }}>
        Grade: {grade} ({label})
      </GradeText>

      <CategoriesContainer>
        <Typography variant="subtitle2" gutterBottom>
          Category Breakdown:
        </Typography>

        {categories.map((category, index) => (
          <CategoryBox key={index}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getCategoryIcon(category.score)}
              <Tooltip title={category.description}>
                <Typography variant="body2">{category.name}</Typography>
              </Tooltip>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: theme => getColorClassName(theme, category.score) }}
            >
              {category.score}
            </Typography>
          </CategoryBox>
        ))}
      </CategoriesContainer>
    </Root>
  );
};

export default SecurityScoreCard;
