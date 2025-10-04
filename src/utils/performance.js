/**
 * Web Vitals Performance Monitoring
 * 
 * This utility helps monitor Core Web Vitals and other performance metrics
 * for better SEO and user experience.
 */

// Web Vitals metrics tracking
export const initWebVitals = () => {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Import web-vitals dynamically to avoid SSR issues
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    // Largest Contentful Paint (LCP) - Loading performance
    getLCP((metric) => {
      // console.log('LCP:', metric);
      sendToAnalytics('LCP', metric);
    });

    // First Input Delay (FID) - Interactivity
    getFID((metric) => {
      // console.log('FID:', metric);
      sendToAnalytics('FID', metric);
    });

    // Cumulative Layout Shift (CLS) - Visual stability
    getCLS((metric) => {
      // console.log('CLS:', metric);
      sendToAnalytics('CLS', metric);
    });

    // First Contentful Paint (FCP) - Loading
    getFCP((metric) => {
      // console.log('FCP:', metric);
      sendToAnalytics('FCP', metric);
    });

    // Time to First Byte (TTFB) - Server response time
    getTTFB((metric) => {
      // console.log('TTFB:', metric);
      sendToAnalytics('TTFB', metric);
    });
  }).catch(err => {
    // console.warn('Web Vitals not available:', err);
  });
};

// Send metrics to analytics service
const sendToAnalytics = (metricName, metric) => {
  // You can send to Google Analytics, your own analytics service, etc.
  if (typeof gtag !== 'undefined') {
    gtag('event', metricName, {
      event_category: 'Web Vitals',
      value: Math.round(metricName === 'CLS' ? metric.value * 1000 : metric.value),
      custom_map: { metric_id: metric.id },
      non_interaction: true,
    });
  }

  // Log to console for debugging
  // console.group(`📊 ${metricName} Metric`);
  // console.log('Value:', metric.value);
  // console.log('Delta:', metric.delta);
  // console.log('ID:', metric.id);
  // console.log('Rating:', getMetricRating(metricName, metric.value));
  // console.groupEnd();
};

// Get rating based on Core Web Vitals thresholds
const getMetricRating = (metricName, value) => {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    FCP: { good: 1800, poor: 3000 },
    TTFB: { good: 800, poor: 1800 }
  };

  const threshold = thresholds[metricName];
  if (!threshold) return 'unknown';

  if (value <= threshold.good) return '✅ Good';
  if (value <= threshold.poor) return '⚠️ Needs Improvement';
  return '❌ Poor';
};

// Performance observer for custom metrics
export const observePerformance = () => {
  if (typeof window === 'undefined' || !window.PerformanceObserver) return;

  try {
    // Observe Long Tasks (> 50ms)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // console.warn('🐌 Long Task detected:', {
        //   duration: entry.duration,
        //   startTime: entry.startTime,
        //   name: entry.name
        // });
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });

    // Observe Layout Shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      let cumulativeScore = 0;
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          cumulativeScore += entry.value;
        }
      }
      if (cumulativeScore > 0.1) {
        // console.warn('📐 Layout Shift detected:', cumulativeScore);
      }
    });
    layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });

    // Observe Largest Contentful Paint candidates
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      // console.log('🖼️ LCP Element:', lastEntry.element, 'Time:', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  } catch (error) {
    // console.warn('Performance observation not supported:', error);
  }
};

// Resource loading performance
export const monitorResourceLoading = () => {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    
    // console.group('📈 Page Load Performance');
    // console.log('DNS Lookup:', perfData.domainLookupEnd - perfData.domainLookupStart);
    // console.log('TCP Connection:', perfData.connectEnd - perfData.connectStart);
    // console.log('Server Response:', perfData.responseEnd - perfData.requestStart);
    // console.log('DOM Processing:', perfData.domContentLoadedEventEnd - perfData.responseEnd);
    // console.log('Total Load Time:', perfData.loadEventEnd - perfData.navigationStart);
    console.groupEnd();

    // Check for large resources
    const resources = performance.getEntriesByType('resource');
    const largeResources = resources.filter(resource => resource.transferSize > 1000000); // > 1MB
    
    if (largeResources.length > 0) {
      // console.warn('🚨 Large Resources detected (>1MB):', largeResources);
    }
  });
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (typeof window === 'undefined' || !performance.memory) return;

  const logMemoryUsage = () => {
    const memory = performance.memory;
    // console.log('💾 Memory Usage:', {
    //   used: `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
    //   total: `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
    //   limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`
    // });
  };

  // Log memory usage every 30 seconds
  // Uncomment for debugging: setInterval(logMemoryUsage, 30000);
};

// Bundle analyzer helper
export const analyzeBundleSize = () => {
  if (typeof window === 'undefined') return;

  // Check for large JavaScript bundles
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  scripts.forEach(script => {
    fetch(script.src, { method: 'HEAD' })
      .then(response => {
        const size = response.headers.get('content-length');
        if (size && parseInt(size) > 500000) { // > 500KB
          // console.warn('📦 Large JS Bundle:', script.src, `${Math.round(size / 1024)}KB`);
        }
      })
      .catch(() => {}); // Ignore CORS errors
  });
};

// Initialize all performance monitoring
export const initPerformanceMonitoring = () => {
  initWebVitals();
  observePerformance();
  monitorResourceLoading();
  monitorMemoryUsage();
  analyzeBundleSize();
};