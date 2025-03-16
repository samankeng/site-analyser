const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const logger = require('../../utils/logger');

/**
 * Scanner for analyzing website content
 */
class ContentScanner {
  /**
   * Initialize content scanner
   */
  constructor() {
    this.userAgent = 'SiteAnalyzer/1.0';
    
    // Define content issues to check for
    this.contentChecks = {
      // SEO issues
      seo: {
        missingTitle: {
          check: ($) => !$('title').length || !$('title').text().trim(),
          title: 'Missing Page Title',
          description: 'The page does not have a title tag or it is empty.',
          severity: 'Medium',
          recommendation: 'Add a descriptive title tag to improve SEO and accessibility.'
        },
        missingMetaDescription: {
          check: ($) => !$('meta[name="description"]').length || !$('meta[name="description"]').attr('content'),
          title: 'Missing Meta Description',
          description: 'The page does not have a meta description tag or it is empty.',
          severity: 'Low',
          recommendation: 'Add a meta description tag with relevant content to improve SEO.'
        },
        shortContent: {
          check: ($) => {
            const text = $('body').text().trim();
            return text.length < 300;
          },
          title: 'Low Content Volume',
          description: 'The page has very little text content, which may impact SEO.',
          severity: 'Low',
          recommendation: 'Add more relevant content to improve SEO and provide value to visitors.'
        },
        multipleH1: {
          check: ($) => $('h1').length > 1,
          title: 'Multiple H1 Tags',
          description: 'The page has multiple H1 tags, which is not recommended for SEO.',
          severity: 'Low',
          recommendation: 'Use only one H1 tag per page and structure other headings properly.'
        }
      },
      
      // Accessibility issues
      accessibility: {
        missingAltText: {
          check: ($) => {
            const images = $('img:not([alt])');
            return images.length > 0;
          },
          title: 'Images Missing Alt Text',
          description: 'Some images on the page do not have alt text, which is important for accessibility.',
          severity: 'Medium',
          recommendation: 'Add descriptive alt text to all images.'
        },
        lowContrast: {
          check: ($) => {
            // This is a simplified check that looks for potentially problematic CSS
            const styles = $('style').text();
            const inlineStyles = $('[style]').map((i, el) => $(el).attr('style')).get().join(' ');
            const allStyles = styles + ' ' + inlineStyles;
            
            // Look for light text colors combined with light backgrounds or dark with dark
            return (
              (allStyles.includes('color: #fff') && allStyles.includes('background: #f')) ||
              (allStyles.includes('color: white') && allStyles.includes('background: #f')) ||
              (allStyles.includes('color: #000') && allStyles.includes('background: #0')) ||
              (allStyles.includes('color: black') && allStyles.includes('background: #0'))
            );
          },
          title: 'Potential Low Contrast',
          description: 'The page may have low contrast text that is difficult to read.',
          severity: 'Low',
          recommendation: 'Ensure text has sufficient contrast with its background (WCAG 2.1 AA requires at least 4.5:1 for normal text).'
        },
        missingLabelForInput: {
          check: ($) => {
            const inputs = $('input, select, textarea');
            let missingLabels = 0;
            
            inputs.each((i, el) => {
              const id = $(el).attr('id');
              if (id && !$(`label[for="${id}"]`).length) {
                missingLabels++;
              }
            });
            
            return missingLabels > 0;
          },
          title: 'Form Inputs Missing Labels',
          description: 'Some form inputs do not have properly associated label elements.',
          severity: 'Medium',
          recommendation: 'Ensure all form controls have associated labels using the for attribute.'
        }
      },
      
      // Security and privacy issues
      security: {
        insecureLinks: {
          check: ($) => {
            const links = $('a[href^="http:"]');
            return links.length > 0;
          },
          title: 'Insecure Links',
          description: 'The page contains links to non-HTTPS URLs.',
          severity: 'Medium',
          recommendation: 'Update links to use HTTPS instead of HTTP where available.'
        },
        missingPrivacyPolicy: {
          check: ($) => {
            const text = $('body').text().toLowerCase();
            const links = $('a').map((i, el) => $(el).text().toLowerCase()).get().join(' ');
            
            return !(
              text.includes('privacy policy') || 
              links.includes('privacy policy') || 
              links.includes('privacy')
            );
          },
          title: 'Missing Privacy Policy',
          description: 'The site does not appear to have a privacy policy link.',
          severity: 'Medium',
          recommendation: 'Add a privacy policy page and link to it from the footer or main navigation.'
        }
      },
      
      // Performance issues
      performance: {
        largeImages: {
          check: ($) => {
            const largeImages = $('img[width][height]').filter((i, el) => {
              const width = parseInt($(el).attr('width'), 10) || 0;
              const height = parseInt($(el).attr('height'), 10) || 0;
              return width > 1000 || height > 1000;
            });
            
            return largeImages.length > 0;
          },
          title: 'Large Images',
          description: 'The page contains very large images that may slow down page loading.',
          severity: 'Low',
          recommendation: 'Optimize images and use appropriately sized images for different devices.'
        },
        excessiveScripts: {
          check: ($) => $('script').length > 15,
          title: 'Excessive Scripts',
          description: 'The page loads an excessive number of JavaScript files.',
          severity: 'Low',
          recommendation: 'Consider bundling JavaScript files and removing unnecessary scripts to improve page loading time.'
        }
      }
    };
    
    logger.info('ContentScanner initialized');
  }

  /**
   * Perform content analysis scan
   * @param {string} url - URL to scan
   * @param {number} depthFactor - Scan depth factor (1.0 is standard)
   * @returns {Promise<Object>} Scan results
   */
  async scan(url, depthFactor = 1.0) {
    logger.info(`Starting content scan for ${url}`);
    
    try {
      // Parse URL
      const parsedUrl = new URL(url);
      const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
      
      // Set up result structure
      const contentResult = {
        score: 0,
        findings: [],
        metadata: new Map(),
        rawData: {}
      };
      
      // Fetch main page
      const mainPageData = await this.fetchPage(url);
      contentResult.rawData.mainPage = {
        url,
        status: mainPageData.status,
        headers: mainPageData.headers
      };
      
      // Parse HTML
      const $ = cheerio.load(mainPageData.data);
      
      // Extract metadata
      const metadata = this.extractMetadata($, url);
      contentResult.metadata.set('pageMetadata', metadata);
      
      // Run content checks
      this.runContentChecks($, contentResult);
      
      // Check for additional pages if depth factor allows
      if (depthFactor >= 1.0) {
        // Extract links to internal pages
        const internalLinks = this.extractInternalLinks($, baseUrl);
        
        // Determine how many additional pages to check
        const pagesToCheck = depthFactor < 1.5 ? 3 : 5;
        const pagesToScan = internalLinks.slice(0, pagesToCheck);
        
        // Scan additional pages
        if (pagesToScan.length > 0) {
          contentResult.metadata.set('additionalPagesScanned', pagesToScan.length);
          
          for (const pageUrl of pagesToScan) {
            try {
              const pageData = await this.fetchPage(pageUrl);
              const page$ = cheerio.load(pageData.data);
              
              // Run checks on this page too
              this.runContentChecks(page$, contentResult, pageUrl);
            } catch (error) {
              logger.error(`Error scanning page ${pageUrl}: ${error.message}`);
            }
          }
        }
      }
      
      // Calculate score
      contentResult.score = this.calculateScore(contentResult);
      
      logger.info(`Content scan completed for ${url}`);
      return contentResult;
    } catch (error) {
      logger.error(`Content scan error for ${url}: ${error.message}`);
      
      // Return partial results if possible
      return {
        score: 0,
        findings: [{
          title: 'Content Scan Failed',
          description: `Could not complete content scan: ${error.message}`,
          severity: 'Medium',
          recommendation: 'Verify that the server is accessible and properly configured.'
        }],
        metadata: new Map(),
        rawData: { error: error.message }
      };
    }
  }

  /**
   * Fetch a web page
   * @param {string} url - URL to fetch
   * @returns {Promise<Object>} Page data
   */
  async fetchPage(url) {
    try {
      const response = await axios({
        method: 'GET',
        url,
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000,
        maxRedirects: 5
      });
      
      return {
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      logger.error(`Error fetching ${url}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract metadata from HTML
   * @param {Object} $ - Cheerio instance
   * @param {string} url - URL of the page
   * @returns {Object} Metadata
   */
  extractMetadata($, url) {
    const metadata = {
      title: $('title').text().trim(),
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      robots: $('meta[name="robots"]').attr('content') || '',
      ogTitle: $('meta[property="og:title"]').attr('content') || '',
      ogDescription: $('meta[property="og:description"]').attr('content') || '',
      ogImage: $('meta[property="og:image"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      h1Count: $('h1').length,
      wordCount: $('body').text().trim().split(/\s+/).length,
      linkCount: $('a').length,
      imageCount: $('img').length,
      language: $('html').attr('lang') || ''
    };
    
    return metadata;
  }

  /**
   * Extract internal links from HTML
   * @param {Object} $ - Cheerio instance
   * @param {string} baseUrl - Base URL of the site
   * @returns {Array<string>} Internal links
   */
  extractInternalLinks($, baseUrl) {
    const links = new Set();
    
    $('a[href]').each((i, element) => {
      try {
        const href = $(element).attr('href');
        
        // Skip empty, javascript:, mailto:, tel:, and anchor links
        if (!href || 
            href.startsWith('javascript:') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') || 
            href.startsWith('#')) {
          return;
        }
        
        // Convert to absolute URL if needed
        let absoluteUrl;
        try {
          absoluteUrl = new URL(href, baseUrl).href;
        } catch (e) {
          return; // Skip invalid URLs
        }
        
        // Only include URLs from the same domain and not the same as base URL
        if (absoluteUrl.startsWith(baseUrl) && absoluteUrl !== baseUrl && !absoluteUrl.includes('#')) {
          links.add(absoluteUrl);
        }
      } catch (error) {
        // Skip problematic links
      }
    });
    
    return [...links];
  }

  /**
   * Run content checks on a page
   * @param {Object} $ - Cheerio instance
   * @param {Object} contentResult - Result object to populate
   * @param {string} pageUrl - URL of the page being checked
   */
  runContentChecks($, contentResult, pageUrl = null) {
    // Track which findings we've already recorded
    const existingFindings = new Set(
      contentResult.findings.map(f => f.title)
    );
    
    // Run each category of checks
    Object.keys(this.contentChecks).forEach(category => {
      const checks = this.contentChecks[category];
      
      Object.keys(checks).forEach(checkName => {
        const check = checks[checkName];
        
        // Skip if we already have this finding (to avoid duplicates from multiple pages)
        if (existingFindings.has(check.title)) {
          return;
        }
        
        // Run the check
        const issue = check.check($);
        
        if (issue) {
          const finding = {
            title: check.title,
            description: check.description,
            severity: check.severity,
            recommendation: check.recommendation
          };
          
          // Add page URL if checking additional pages
          if (pageUrl) {
            finding.location = pageUrl;
          }
          
          contentResult.findings.push(finding);
          existingFindings.add(check.title);
        }
      });
    });
  }

  /**
   * Calculate overall score based on findings
   * @param {Object} contentResult - Result object with findings
   * @returns {number} Score from 0-100
   */
  calculateScore(contentResult) {
    // Start with a perfect score
    let score = 100;
    
    // Deduct points based on finding severity
    const deductions = {
      'Critical': 25,
      'High': 15,
      'Medium': 10,
      'Low': 5,
      'Info': 0
    };
    
    contentResult.findings.forEach(finding => {
      score -= deductions[finding.severity] || 0;
    });
    
    // Ensure score is within 0-100
    return Math.max(0, Math.min(100, score));
  }
}

module.exports = ContentScanner;