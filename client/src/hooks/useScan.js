import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  initiateScan as startScanAction,
  cancelScan as cancelScanAction,
  getScanResults as fetchScanResultsAction,
} from '../store/actions/scanActions';
import scanService from '../services/scanService';

/**
 * Scan status constants
 */
const SCAN_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Custom hook for managing security scan operations
 * @returns {Object} Scan-related state and methods
 */
const useScan = () => {
  const dispatch = useDispatch();
  const { currentScan, scanHistory = [], loading, error } = useSelector(state => state.scans);

  // Start a new scan
  const startScan = useCallback(
    async (url, options = {}) => {
      try {
        const scanData = {
          url,
          options,
        };
        
        const result = await dispatch(startScanAction(scanData));
        return result.payload;
      } catch (err) {
        console.error('Scan initiation failed', err);
        return null;
      }
    },
    [dispatch]
  );

  // Cancel an ongoing scan
  const cancelScan = useCallback(
    async scanId => {
      try {
        await dispatch(cancelScanAction(scanId));
        return true;
      } catch (err) {
        console.error('Scan cancellation failed', err);
        return false;
      }
    },
    [dispatch]
  );

  // Fetch scan results
  const fetchScanResults = useCallback(
    async scanId => {
      try {
        const results = await dispatch(fetchScanResultsAction(scanId));
        return results.payload;
      } catch (err) {
        console.error('Fetching scan results failed', err);
        return null;
      }
    },
    [dispatch]
  );

  // Real-time scan progress tracking
  const [scanProgress, setScanProgress] = useState(null);

  useEffect(() => {
    // Optional: Set up WebSocket or polling for real-time updates
    if (currentScan && currentScan.status === SCAN_STATUS.IN_PROGRESS) {
      const progressInterval = setInterval(() => {
        // Simulate or fetch real-time progress
        // In a real app, this would come from backend
        setScanProgress({
          progress: currentScan.progress,
          status: currentScan.status,
        });
      }, 5000);

      return () => clearInterval(progressInterval);
    }
  }, [currentScan]);

  // List recent scans
  const getRecentScans = useCallback(
    async (limit = 10) => {
      try {
        const response = await scanService.getRecentScans(limit);
        const scans = response.data || [];
        return scans;
      } catch (err) {
        console.error('Failed to fetch recent scans', err);
        return [];
      }
    },
    [] // Empty dependency array to prevent recreation on every render
  );

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
    fetchScanResults,
  };
};

export default useScan;