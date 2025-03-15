import api from './api';

const reportService = {
  /**
   * Fetch list of reports
   * @param {Object} [params] - Optional query parameters
   * @param {number} [params.page=1] - Page number
   * @param {number} [params.limit=10] - Number of reports per page
   * @param {string} [params.sortBy='date'] - Sort reports by field
   * @param {string} [params.order='desc'] - Sort order
   * @returns {Promise} List of reports
   */
  getReports: async (params = {}) => {
    try {
      const response = await api.get('/reports', { params });
      return response.data;
    } catch (error) {
      console.error('Fetch reports error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get detailed report by ID
   * @param {string} reportId - ID of the report
   * @returns {Promise} Detailed report data
   */
  getReportById: async (reportId) => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Fetch report details error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Generate a new report from a scan
   * @param {string} scanId - ID of the scan to generate report from
   * @returns {Promise} Generated report data
   */
  generateReport: async (scanId) => {
    try {
      const response = await api.post('/reports/generate', { scanId });
      return response.data;
    } catch (error) {
      console.error('Generate report error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Export report in a specific format
   * @param {string} reportId - ID of the report to export
   * @param {string} format - Export format (pdf, html, json)
   * @returns {Promise} Exported report data or download link
   */
  exportReport: async (reportId, format = 'pdf') => {
    try {
      const response = await api.get(`/reports/${reportId}/export`, {
        params: { format },
        responseType: 'blob' // For file downloads
      });
      
      // Create a download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      
      return response.data;
    } catch (error) {
      console.error('Export report error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete a report
   * @param {string} reportId - ID of the report to delete
   * @returns {Promise} Deletion confirmation
   */
  deleteReport: async (reportId) => {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Delete report error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Search reports
   * @param {Object} searchParams - Search criteria
   * @param {string} [searchParams.query] - Search query
   * @param {string} [searchParams.domain] - Domain to filter
   * @param {string} [searchParams.startDate] - Start date filter
   * @param {string} [searchParams.endDate] - End date filter
   * @returns {Promise} Filtered reports
   */
  searchReports: async (searchParams) => {
    try {
      const response = await api.get('/reports/search', { params: searchParams });
      return response.data;
    } catch (error) {
      console.error('Search reports error:', error.response?.data || error.message);
      throw error;
    }
  }
};

export default reportService;
