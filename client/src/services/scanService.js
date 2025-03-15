import api from './api';

const scanService = {
  /**
   * Initiate a new security scan
   * @param {string} url - Target URL to scan
   * @param {Object} [options] - Scan configuration options
   * @returns {Promise} Initiated scan details
   */
  startScan: async (url, options = {}) => {
    try {
      const response = await api.post('/scans/start', { 
        url, 
        ...options 
      });
      return response.data;
    } catch (error) {
      console.error('Start scan error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get scan status and progress
   * @param {string} scanId - ID of the scan
   * @returns {Promise} Scan status details
   */
  getScanStatus: async (scanId) => {
    try {
      const response = await api.get(`/scans/${scanId}/status`);
      return response.data;
    } catch (error) {
      console.error('Get scan status error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Retrieve full scan results
   * @param {string} scanId - ID of the completed scan
   * @returns {Promise} Comprehensive scan results
   */
  getScanResults: async (scanId) => {
    try {
      const response = await api.get(`/scans/${scanId}/results`);
      return response.data;
    } catch (error) {
      console.error('Get scan results error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Cancel an ongoing scan
   * @param {string} scanId - ID of the scan to cancel
   * @returns {Promise} Cancellation confirmation
   */
  cancelScan: async (scanId) => {
    try {
      const response = await api.post(`/scans/${scanId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel scan error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetch recent scan history
   * @param {Object} [params] - Optional query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Number of scans per page
   * @param {string} [params.sortBy='date'] - Sort scans by field
   * @param {string} [params.order='desc'] - Sort order
   * @returns {Promise} List of recent scans
   */
  getScanHistory: async (params = {}) => {
    try {
      const response = await api.get('/scans/history', { params });
      return response.data;
    } catch (error) {
      console.error('Get scan history error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get detailed scan analysis
   * @param {string} scanId - ID of the scan
   * @returns {Promise} Detailed scan analysis
   */
  getScanAnalysis: async (scanId) => {
    try {
      const response = await api.get(`/scans/${scanId}/analysis`);
      return response.data;
    } catch (error) {
      console.error('Get scan analysis error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Rescan a previously scanned URL
   * @param {string} scanId - ID of the previous scan
   * @param {Object} [options] - Optional rescan configuration
   * @returns {Promise} New scan details
   */
  rescan: async (scanId, options = {}) => {
    try {
      const response = await api.post(`/scans/${scanId}/rescan`, options);
      return response.data;
    } catch (error) {
      console.error('Rescan error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default scanService;
