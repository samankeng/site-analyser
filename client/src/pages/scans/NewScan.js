import React, { useState } from "react";
import {
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
} from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useNavigate } from "react-router-dom";
import { ScanForm, ScanOptions } from "../../components/security";
import useScan from "../../hooks/useScan";
import { useAlertContext } from "../../contexts/AlertContext";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  actionButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: theme.spacing(3),
  },
}));

const NewScan = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const { startScan } = useScan();
  const { showAlert } = useAlertContext();

  const [scanOptions, setScanOptions] = useState({
    deepScan: false,
    checkSSL: true,
    checkHeaders: true,
    checkPerformance: false,
    checkVulnerabilities: true,
  });

  const handleOptionChange = (option) => {
    setScanOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleScanStart = async (url) => {
    try {
      const scanResult = await startScan(url, scanOptions);

      if (scanResult) {
        showAlert("Scan initiated successfully", "success");
        navigate(`/scans/${scanResult.id}`);
      } else {
        showAlert("Failed to start scan", "error");
      }
    } catch (error) {
      showAlert("An error occurred while starting the scan", "error");
    }
  };

  return (
    <Container maxWidth="md" className={classes.root}>
      <Typography variant="h4" gutterBottom>
        New Security Scan
      </Typography>

      <Paper className={classes.paper}>
        <section className={classes.section}>
          <Typography variant="h6" gutterBottom>
            Scan Target
          </Typography>
          <ScanForm
            onScanStart={handleScanStart}
            fullWidth
            variant="outlined"
          />
        </section>

        <Divider className={classes.divider} />

        <section className={classes.section}>
          <Typography variant="h6" gutterBottom>
            Scan Options
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <ScanOptions
                options={scanOptions}
                onOptionChange={handleOptionChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
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
        </section>

        <div className={classes.actionButtons}>
          <Button
            variant="outlined"
            color="default"
            onClick={() => navigate("/dashboard")}
          >
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
        </div>
      </Paper>
    </Container>
  );
};

export default NewScan;
