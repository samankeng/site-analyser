import { useState, useEffect } from 'react';

/**
 * Custom hook to track window size and responsiveness
 * @returns {Object} Current window dimensions and device type
 */
const useWindowSize = () => {
  // Initialize state with default values
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Determine device type based on width
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setWindowSize({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop
      });
    }
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler immediately so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount

  return windowSize;
};

export default useWindowSize;
