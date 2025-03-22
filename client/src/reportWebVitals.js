/**
 * Report Web Vitals metrics
 * Updated for React 19 and latest web-vitals package
 *
 * @param {Function} onPerfEntry - Callback function to report metrics
 * @param {Object} options - Optional configuration options
 * @returns {Promise|undefined} - Promise that resolves when metrics are collected
 */
const reportWebVitals = (onPerfEntry, options = {}) => {
  if (onPerfEntry && typeof onPerfEntry === 'function') {
    // Enhanced options for web-vitals reporting
    const reportOptions = {
      reportAllChanges: options.reportAllChanges || false,
      attribution: options.attribution || true,
      durationThreshold: options.durationThreshold || 0,
    };

    // Dynamic import for better code splitting
    return import('web-vitals').then(
      ({
        onCLS,
        onFID,
        onFCP,
        onLCP,
        onTTFB,
        // New metrics in latest web-vitals
        onINP,
        onFCP_I,
        onFP,
      }) => {
        // Core Web Vitals
        onCLS(onPerfEntry, reportOptions);
        onFID(onPerfEntry, reportOptions);
        onFCP(onPerfEntry, reportOptions);
        onLCP(onPerfEntry, reportOptions);
        onTTFB(onPerfEntry, reportOptions);

        // Additional metrics available in newer versions
        if (onINP) {
          onINP(onPerfEntry, reportOptions); // Interaction to Next Paint
        }

        if (onFCP_I) {
          onFCP_I(onPerfEntry, reportOptions); // First Contentful Paint Interaction
        }

        if (onFP) {
          onFP(onPerfEntry, reportOptions); // First Paint
        }

        // Return a resolved promise to enable chaining
        return Promise.resolve();
      }
    );
  }
  return undefined;
};

/**
 * Utility to send vitals to analytics services
 * @param {Object} metric - Web Vitals metric
 */
export const sendToAnalytics = metric => {
  // Format metric for analytics
  const { name, value, delta, id, navigationType, rating, entries } = metric;

  // Example analytics format
  const analyticsData = {
    name,
    value: Math.round(value * 100) / 100, // Round to 2 decimal places
    delta: Math.round(delta * 100) / 100,
    id,
    navigationType,
    rating, // 'good', 'needs-improvement', or 'poor'
    // Additional data for debugging
    entryType: entries[0]?.entryType,
    timestamp: performance.now(),
    userAgent: navigator.userAgent,
  };

  // Send to your analytics service
  // Example: Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      non_interaction: true,
      ...analyticsData,
    });
  }

  // Console log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Web Vitals]', analyticsData);
  }
};

export default reportWebVitals;
