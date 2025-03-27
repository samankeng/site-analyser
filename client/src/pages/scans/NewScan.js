import { useState } from 'react';
import { Container, Typography, Grid, Paper, Button, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ScanForm from '../../components/security/ScanForm';
import ScanOptions from '../../components/security/ScanOptions';
import useScan from '../../hooks/useScan';
import { useAlert } from '../../contexts/AlertContext';

// Using styled API instead of makeStyles
const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const Section = styled('section')(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(3, 0),
}));

const ActionButtonsContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: theme.spacing(3),
}));

const NewScan = () => {
  const navigate = useNavigate();
  const { startScan } = useScan();
  const { addAlert } = useAlert();

  const [scanOptions, setScanOptions] = useState({
    // Use the exact names expected by your backend
    sslCheck: true, // instead of checkSSL
    headerAnalysis: true, // instead of checkHeaders
    vulnDetection: true, // instead of checkVulnerabilities
    performanceCheck: false,
    portScan: false, // you need to add this
    contentAnalysis: false, // you need to add this
  });

  

  const handleOptionChange = option => {
    setScanOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleScanStart = async url => {
    try {
      const scanResult = await startScan(url, scanOptions);

      if (scanResult) {
        addAlert('Scan initiated successfully', 'success');
        navigate(`/scans/${scanResult.id}`);
      } else {
        addAlert('Failed to start scan', 'error');
      }
    } catch (error) {
      addAlert('An error occurred while starting the scan', 'error');
    }
  };

  return (
    <StyledContainer maxWidth="md">
      <Typography variant="h4" gutterBottom>
        New Security Scan
      </Typography>

      <StyledPaper>
        <Section>
          <Typography variant="h6" gutterBottom>
            Scan Target
          </Typography>
          <ScanForm onScanStart={handleScanStart} fullWidth variant="outlined" />
        </Section>

        <StyledDivider />

        <Section>
          <Typography variant="h6" gutterBottom>
            Scan Options
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ScanOptions options={scanOptions} onOptionChange={handleOptionChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                Customize your scan by selecting specific security checks:
                <ul>
                  <li>SSL/TLS Certificate Analysis</li>
                  <li>HTTP Security Headers Evaluation</li>
                  <li>Vulnerability Assessment</li>
                  <li>Performance Metrics</li>
                </ul>
                More comprehensive scans may take longer to complete.
              </Typography>
            </Grid>
          </Grid>
        </Section>

        <ActionButtonsContainer>
          <Button variant="outlined" color="inherit" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              /* Trigger scan from form */
            }}
            disabled={!scanOptions}
          >
            Start Scan
          </Button>
        </ActionButtonsContainer>
      </StyledPaper>
    </StyledContainer>
  );
};

export default NewScan;
