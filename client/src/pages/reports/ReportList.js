import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  Box,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useNavigate } from 'react-router-dom';
import { fetchReports } from '../../store/actions/reportActions';
import Loader from '../../components/common/Loader';
import Alert from '../../components/common/Alert';
import { formatDate } from '../../utils/formatters';

const ReportList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { reports, loading, error } = useSelector(state => state.reports);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReports, setFilteredReports] = useState([]);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  useEffect(() => {
    if (reports) {
      setFilteredReports(
        reports.filter(
          report =>
            report.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.scanType.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [reports, searchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewReport = reportId => {
    navigate(`/reports/${reportId}`);
  };

  const getSeverityChip = score => {
    let color = 'success';
    let label = 'Low';

    if (score > 70) {
      color = 'error';
      label = 'High';
    } else if (score > 40) {
      color = 'warning';
      label = 'Medium';
    }

    return <Chip label={label} color={color} size="small" />;
  };

  if (loading) return <Loader />;
  if (error) return <Alert severity="error" message={error} />;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Security Reports
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/scans/new')}>
          New Scan
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by domain or scan type..."
          variant="outlined"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <FilterListIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table aria-label="security reports table">
          <TableHead>
            <TableRow>
              <TableCell>Domain</TableCell>
              <TableCell>Scan Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Risk Score</TableCell>
              <TableCell>Vulnerabilities</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map(report => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.domain}</TableCell>
                  <TableCell>{report.scanType}</TableCell>
                  <TableCell>{formatDate(report.createdAt)}</TableCell>
                  <TableCell>
                    {getSeverityChip(report.riskScore)} {report.riskScore}/100
                  </TableCell>
                  <TableCell>{report.vulnerabilitiesCount}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleViewReport(report.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            {filteredReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No reports found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default ReportList;
