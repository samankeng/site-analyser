import api from './api';

/**
 * Service for managing security scans
 */
const scanService = {
  /**
   * Initiate a new security scan
   * @param {string} url - Target URL to scan
   * @param {Object} [options] - Scan configuration options
   * @param {string} [options.scanType='complete'] - Type of scan (complete, quick, custom)
   * @param {Array<string>} [options.modules] - Specific modules to scan for custom scans
   * @param {number} [options.depth] - Crawl depth for the scan
   * @param {boolean} [options.authentication] - Whether to use authentication
   * @param {Object} [options.authConfig] - Authentication configuration
   * @returns {Promise} Initiated scan details
   */
  startScan: async (url, options = {}) => {
    try {
      const response = await api.post('/scans/start', {
        url,
        ...options,
      });
      return response.data;
    } catch (error) {
      console.error('Start scan error:', error.response?.data || error.message);

      // Handle common error cases
      if (error.response?.status === 400) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          'Invalid URL or scan parameters.';
        throw new Error(errorMessage);
      }

      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to start scan. Please check the URL and try again.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Get scan status and progress
   * @param {string} scanId - ID of the scan
   * @returns {Promise} Scan status details including progress percentage and current stage
   */
  getScanStatus: async scanId => {
    try {
      const response = await api.get(`/scans/${scanId}/status`);
      return response.data;
    } catch (error) {
      console.error('Get scan status error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Scan with ID ${scanId} was not found.`);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to get scan status.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Poll scan status until complete
   * @param {string} scanId - ID of the scan
   * @param {number} [interval=2000] - Polling interval in milliseconds
   * @param {number} [timeout=600000] - Maximum time to poll in milliseconds (10 min default)
   * @param {Function} [onProgress] - Optional callback for progress updates
   * @returns {Promise} Final scan status
   */
  pollScanStatus: async (scanId, interval = 2000, timeout = 600000, onProgress) => {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          // Check if we've exceeded the timeout
          if (Date.now() - startTime > timeout) {
            reject(new Error('Scan status polling timed out'));
            return;
          }

          const statusData = await scanService.getScanStatus(scanId);

          // Call progress callback if provided
          if (onProgress && typeof onProgress === 'function') {
            onProgress(statusData);
          }

          if (
            statusData.status === 'completed' ||
            statusData.status === 'failed' ||
            statusData.status === 'cancelled'
          ) {
            resolve(statusData);
            return;
          }

          // Continue polling
          setTimeout(checkStatus, interval);
        } catch (error) {
          reject(error);
        }
      };

      checkStatus();
    });
  },

  /**
   * Retrieve full scan results
   * @param {string} scanId - ID of the completed scan
   * @returns {Promise} Comprehensive scan results
   */
  getScanResults: async scanId => {
    try {
      const response = await api.get(`/scans/${scanId}/results`);
      return response.data;
    } catch (error) {
      console.error('Get scan results error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Scan results for ID ${scanId} were not found.`);
      }

      if (error.response?.status === 400) {
        throw new Error('Scan is still in progress or failed to complete.');
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to retrieve scan results.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Cancel an ongoing scan
   * @param {string} scanId - ID of the scan to cancel
   * @returns {Promise} Cancellation confirmation
   */
  cancelScan: async scanId => {
    try {
      const response = await api.post(`/scans/${scanId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel scan error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Scan with ID ${scanId} was not found.`);
      }

      if (error.response?.status === 400) {
        throw new Error('Cannot cancel scan that has already completed or failed.');
      }

      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Failed to cancel scan.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Fetch recent scan history
   * @param {Object} [params] - Optional query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Number of scans per page
   * @param {string} [params.sortBy='date'] - Sort scans by field
   * @param {string} [params.order='desc'] - Sort order
   * @param {string} [params.status] - Filter by scan status
   * @param {string} [params.domain] - Filter by domain
   * @returns {Promise} List of recent scans
   */
  getScanHistory: async (params = {}) => {
    try {
      const response = await api.get('/scans/history', { params });
      return response.data;
    } catch (error) {
      console.error('Get scan history error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to retrieve scan history.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Get detailed scan analysis
   * @param {string} scanId - ID of the scan
   * @param {string} [section] - Optional specific section of analysis to retrieve
   * @returns {Promise} Detailed scan analysis
   */
  getScanAnalysis: async (scanId, section) => {
    try {
      let url = `/scans/${scanId}/analysis`;
      if (section) {
        url += `/${section}`;
      }

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Get scan analysis error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Scan analysis for ID ${scanId} was not found.`);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to retrieve scan analysis.';

      throw new Error(errorMessage);
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

      if (error.response?.status === 404) {
        throw new Error(`Original scan with ID ${scanId} was not found.`);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to initiate rescan.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Create a scan profile for reuse
   * @param {Object} profileData - Scan profile configuration
   * @param {string} profileData.name - Profile name
   * @param {string} profileData.description - Profile description
   * @param {Object} profileData.scanConfig - Scan configuration
   * @returns {Promise} Created scan profile
   */
  createScanProfile: async profileData => {
    try {
      const response = await api.post('/scans/profiles', profileData);
      return response.data;
    } catch (error) {
      console.error('Create scan profile error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to create scan profile.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Get all saved scan profiles
   * @returns {Promise} List of scan profiles
   */
  getScanProfiles: async () => {
    try {
      const response = await api.get('/scans/profiles');
      return response.data;
    } catch (error) {
      console.error('Get scan profiles error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to retrieve scan profiles.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Update a scan profile
   * @param {string} profileId - ID of the profile to update
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} Updated scan profile
   */
  updateScanProfile: async (profileId, profileData) => {
    try {
      const response = await api.put(`/scans/profiles/${profileId}`, profileData);
      return response.data;
    } catch (error) {
      console.error('Update scan profile error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Scan profile with ID ${profileId} was not found.`);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update scan profile.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Delete a scan profile
   * @param {string} profileId - ID of the profile to delete
   * @returns {Promise} Deletion confirmation
   */
  deleteScanProfile: async profileId => {
    try {
      const response = await api.delete(`/scans/profiles/${profileId}`);
      return response.data;
    } catch (error) {
      console.error('Delete scan profile error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Scan profile with ID ${profileId} was not found.`);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to delete scan profile.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Start a scan using a saved profile
   * @param {string} url - Target URL to scan
   * @param {string} profileId - ID of the scan profile to use
   * @param {Object} [overrides] - Optional parameter overrides
   * @returns {Promise} Initiated scan details
   */
  startProfileScan: async (url, profileId, overrides = {}) => {
    try {
      const response = await api.post('/scans/start-with-profile', {
        url,
        profileId,
        overrides,
      });
      return response.data;
    } catch (error) {
      console.error('Start profile scan error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Scan profile with ID ${profileId} was not found.`);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to start scan with profile.';

      throw new Error(errorMessage);
    }
  },
};

export default scanService;
