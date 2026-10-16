import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Cookie, Shield, Check, X, Settings2 } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    proctoringTelemetry: true,
  });

  useEffect(() => {
    const consent = localStorage.getItem("nexus_cookie_consent");
    if (!consent) {
      // Delay display slightly for smooth page entry
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const consentData = {
      necessary: true,
      analytics: true,
      proctoringTelemetry: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("nexus_cookie_consent", JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    const consentData = {
      necessary: true,
      analytics: false,
      proctoringTelemetry: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("nexus_cookie_consent", JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    const consentData = {
      ...preferences,
      necessary: true, // Always true
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem("nexus_cookie_consent", JSON.stringify(consentData));
    setIsVisible(false);
    setShowPreferences(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-4xl sm:bottom-6 sm:left-6 sm:right-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 p-5 sm:p-6 text-white shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        
        {!showPreferences ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary border border-primary/30">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Cookie & Privacy Preferences
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 border border-emerald-500/30">
                    GDPR / Academic Integrity
                  </span>
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  We use cookies and secure local storage to keep your session authenticated, monitor active exam security, and analyze platform performance. Learn more in our{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreferences(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Customize
              </button>
              <button
                type="button"
                onClick={handleAcceptEssential}
                className="rounded-xl border border-slate-700 bg-transparent px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-bold text-white">Customize Cookie Preferences</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {/* Necessary */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Strictly Necessary</span>
                  <span className="text-[10px] font-semibold bg-primary/20 text-primary px-2 py-0.5 rounded">
                    Required
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Authentication tokens, CSRF protection, and exam route security.
                </p>
              </div>

              {/* Analytics */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Performance Analytics</span>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Anonymized page latency and compiler performance telemetry.
                </p>
              </div>

              {/* Proctoring */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Proctoring Telemetry</span>
                  <input
                    type="checkbox"
                    checked={preferences.proctoringTelemetry}
                    onChange={(e) => setPreferences({ ...preferences, proctoringTelemetry: e.target.checked })}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Real-time heartbeat synchronization for live proctored tests.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                className="rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary/90 shadow-md"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
