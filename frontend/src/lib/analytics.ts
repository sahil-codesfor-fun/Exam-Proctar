/**
 * Code Nexus Telemetry & Analytics Engine
 * Privacy-first: Respects GDPR/CCPA cookie consent preferences
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

interface ConsentData {
  necessary: boolean;
  analytics: boolean;
  proctoringTelemetry: boolean;
  timestamp: string;
}

export function isAnalyticsAllowed(): boolean {
  try {
    const raw = localStorage.getItem("nexus_cookie_consent");
    if (!raw) return false;
    const data: ConsentData = JSON.parse(raw);
    return Boolean(data.analytics);
  } catch {
    return false;
  }
}

/**
 * Initializes Google Analytics or custom telemetry if consented and GA_ID is configured
 */
export function initAnalytics(measurementId?: string) {
  if (!isAnalyticsAllowed()) {
    if (import.meta.env.DEV) {
      console.log("[Analytics] Disabled by user cookie consent settings.");
    }
    return;
  }

  const gaId = measurementId || (import.meta.env.VITE_GA_MEASUREMENT_ID as string);
  if (gaId && typeof window !== "undefined") {
    // Inject Google Analytics gtag.js script dynamically
    if (!document.getElementById("ga-gtag")) {
      const script = document.createElement("script");
      script.id = "ga-gtag";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer?.push(args);
      }
      window.gtag = gtag;
      gtag("js", new Date());
      gtag("config", gaId, { send_page_view: false });
    }
  }

  // Measure Core Web Vitals and Page Performance
  if (typeof window !== "undefined" && "performance" in window) {
    window.addEventListener("load", () => {
      setTimeout(() => {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        if (nav) {
          const loadTime = Math.round(nav.loadEventEnd - nav.startTime);
          const ttfb = Math.round(nav.responseStart - nav.requestStart);
          const domReady = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
          
          if (import.meta.env.DEV) {
            console.log(`⚡ [Page Speed] Load: ${loadTime}ms | TTFB: ${ttfb}ms | DOM: ${domReady}ms`);
          }
          trackEvent("Performance", "page_load_timing", `${loadTime}ms`, loadTime);
        }
      }, 0);
    });
  }
}

/**
 * Tracks a pageview on route change
 */
export function trackPageView(path: string, title?: string) {
  if (!isAnalyticsAllowed()) return;

  const pageTitle = title || document.title;

  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "page_view", {
      page_path: path,
      page_title: pageTitle,
    });
  }

  if (import.meta.env.DEV) {
    console.log(`📊 [Analytics PageView] Path: ${path} | Title: ${pageTitle}`);
  }
}

/**
 * Tracks custom user actions (e.g. login, exam launch, compiler run)
 */
export function trackEvent(category: string, action: string, label?: string, value?: number) {
  if (!isAnalyticsAllowed()) return;

  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }

  if (import.meta.env.DEV) {
    console.log(`📊 [Analytics Event] [${category}] ${action}${label ? ` - ${label}` : ""}`);
  }
}
