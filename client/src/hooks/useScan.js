import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  startScanAction, 
  cancelScanAction, 
  fetchScanResultsAction 
} from '../store/actions/scanActions';

/**
 * Custom hook for managing security scan operations
 * @returns {Object} Scan-related state and methods
 */
const useScan = () => {
  const dispatch = useDispatch();
  const { 
    currentScan, 
    scanHistory, 
    loading, 
    error 
  } = useSelector(state => state.scans);

  // Start a new scan
  const startScan = useCallback(async (url, options = {}) => {
    try {
      const scan = await dispatch(startScanAction(url, options));
      return scan;
    } catch (err) {
      console.error('Scan initiation failed', err);
      return null;
    }
  }, [dispatch]);

  // Cancel an ongoing scan
  const cancelScan = useCallback(async (scanId) => {
    try {
      await dispatch(cancelScanAction(scanId));
      return true;
    } catch (err) {
      console.error('Scan cancellation failed', err);
      return false;
    }
  }, [dispatch]);

  // Fetch scan results
  const fetchScanResults = useCallback(async (scanId) => {
    try {
      const results = await dispatch(fetchScanResultsAction(scanId));
      return results;
    } catch (err) {
      console.error('Fetching scan results failed', err);
      return null;
    }
  }, [dispatch]);

  // Real-time scan progress tracking
  const [scanProgress, setScanProgress] = useState(null);

  useEffect(() => {
    // Optional: Set up WebSocket or polling for real-time updates
    if (currentScan && currentScan.status === 'in_progress') {
      const progressInterval = setInterval(() => {
        // Simulate or fetch real-time progress
        // In a real app, this would come from backend
        setScanProgress({
          progress: currentScan.progress,
          status: currentScan.status
        });
      }, 5000);

      return () => clearInterval(progressInterval);
    }
  }, [currentScan]);

  // List recent scans
  const getRecentScans = useCallback((limit = 10) => {
    return scanHistory.slice(0, limit);
  }, [scanHistory]);

  return {
    // Current scan state
    currentScan,
    scanProgress,

    // Scan history
    scanHistory,
    getRecentScans,

    // Loading and error states
    loading,
    error,

    // Scan operations
    startScan,
    cancelScan,
    fetchScanResults
  };
};

export default useScan;
