import api from './api';

/**
 * Service for managing reports
 */
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

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch reports. Please try again.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Get detailed report by ID
   * @param {string} reportId - ID of the report
   * @returns {Promise} Detailed report data
   */
  getReportById: async reportId => {
    try {
      const response = await api.get(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Fetch report details error:', error.response?.data || error.message);

      // Specific handling for not found errors
      if (error.response?.status === 404) {
        throw new Error(`Report with ID ${reportId} was not found.`);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch report details.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Generate a new report from a scan
   * @param {string} scanId - ID of the scan to generate report from
   * @param {Object} [options] - Report generation options
   * @param {string} [options.format='full'] - Report format ('full', 'summary', 'custom')
   * @param {Array} [options.sections] - Sections to include for custom reports
   * @returns {Promise} Generated report data
   */
  generateReport: async (scanId, options = {}) => {
    try {
      const response = await api.post('/reports/generate', {
        scanId,
        format: options.format || 'full',
        sections: options.sections,
      });
      return response.data;
    } catch (error) {
      console.error('Generate report error:', error.response?.data || error.message);

      // Specific handling for not found scan
      if (error.response?.status === 404) {
        throw new Error(`Scan with ID ${scanId} was not found.`);
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to generate report. The scan may be invalid or incomplete.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Export report in a specific format
   * @param {string} reportId - ID of the report to export
   * @param {string} format - Export format (pdf, html, json, csv)
   * @param {string} [filename] - Custom filename for the download
   * @returns {Promise} Exported report data or download link
   */
  exportReport: async (reportId, format = 'pdf', filename) => {
    try {
      const response = await api.get(`/reports/${reportId}/export`, {
        params: { format },
        responseType: 'blob', // For file downloads
      });

      // Get filename from Content-Disposition header if exists
      let defaultFilename = `report_${reportId}.${format}`;
      const contentDisposition = response.headers?.['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          defaultFilename = filenameMatch[1];
        }
      }

      // Create a download link for the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename || defaultFilename);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error('Export report error:', error.response?.data || error.message);

      // For blob responses, we need to parse the error message
      if (error.response?.data instanceof Blob) {
        try {
          const blobText = await new Response(error.response.data).text();
          const errorData = JSON.parse(blobText);
          throw new Error(errorData.message || errorData.error || 'Failed to export report');
        } catch (parseError) {
          // If we can't parse the error, use a generic message
          throw new Error('Failed to export report. The format may be invalid.');
        }
      }

      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Failed to export report.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Delete a report
   * @param {string} reportId - ID of the report to delete
   * @returns {Promise} Deletion confirmation
   */
  deleteReport: async reportId => {
    try {
      const response = await api.delete(`/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Delete report error:', error.response?.data || error.message);

      // Specific handling for not found errors
      if (error.response?.status === 404) {
        throw new Error(`Report with ID ${reportId} was not found or already deleted.`);
      }

      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Failed to delete report.';

      throw new Error(errorMessage);
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
  searchReports: async searchParams => {
    try {
      const response = await api.get('/reports/search', { params: searchParams });
      return response.data;
    } catch (error) {
      console.error('Search reports error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Failed to search reports.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Share report with others
   * @param {string} reportId - ID of the report to share
   * @param {Object} shareOptions - Sharing options
   * @param {Array<string>} [shareOptions.emails] - List of email addresses to share with
   * @param {boolean} [shareOptions.generatePublicLink=false] - Generate a public access link
   * @param {number} [shareOptions.expiryDays] - Number of days until link expires
   * @returns {Promise} Sharing details including access link if requested
   */
  shareReport: async (reportId, shareOptions) => {
    try {
      const response = await api.post(`/reports/${reportId}/share`, shareOptions);
      return response.data;
    } catch (error) {
      console.error('Share report error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message || error.response?.data?.error || 'Failed to share report.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Schedule periodic report generation
   * @param {Object} scheduleData - Schedule configuration
   * @param {string} scheduleData.scanProfileId - ID of scan profile to use
   * @param {string} scheduleData.frequency - Frequency ('daily', 'weekly', 'monthly')
   * @param {string} [scheduleData.dayOfWeek] - Day of week for weekly reports (0-6, 0 is Sunday)
   * @param {string} [scheduleData.dayOfMonth] - Day of month for monthly reports (1-31)
   * @param {string} scheduleData.time - Time in HH:MM format
   * @param {Array<string>} [scheduleData.recipients] - Email recipients
   * @returns {Promise} Schedule confirmation
   */
  scheduleReport: async scheduleData => {
    try {
      const response = await api.post('/reports/schedule', scheduleData);
      return response.data;
    } catch (error) {
      console.error('Schedule report error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to schedule report.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Get scheduled reports
   * @returns {Promise} List of scheduled reports
   */
  getScheduledReports: async () => {
    try {
      const response = await api.get('/reports/schedule');
      return response.data;
    } catch (error) {
      console.error('Get scheduled reports error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to fetch scheduled reports.';

      throw new Error(errorMessage);
    }
  },

  /**
   * Cancel a scheduled report
   * @param {string} scheduleId - ID of the scheduled report
   * @returns {Promise} Cancellation confirmation
   */
  cancelScheduledReport: async scheduleId => {
    try {
      const response = await api.delete(`/reports/schedule/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Cancel scheduled report error:', error.response?.data || error.message);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to cancel scheduled report.';

      throw new Error(errorMessage);
    }
  },
};

export default reportService;
