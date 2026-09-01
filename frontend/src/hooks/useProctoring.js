import { useEffect, useRef, useCallback, useState } from 'react';
import api from '../services/api';
import { getSocket } from '../services/socket';

const CRITICAL_TYPES = new Set(['devtools', 'programmatic_injection', 'unauthorized_extension']);

export default function useProctoring({ examId, enabled = false, maxViolations = 3, onRestricted, onAutoSubmit }) {
  const [violations, setViolations] = useState([]);
  const [violationCount, setViolationCount] = useState(0);
  const [restricted, setRestricted] = useState(false);
  const countRef = useRef(0);
  const lastKeypressTimeRef = useRef(0);
  const rapidKeystrokeCountRef = useRef(0);
  const lastViolationTimeMap = useRef(new Map());

  // 300ms Micro-Batching Buffer
  const batchQueueRef = useRef([]);
  const batchTimerRef = useRef(null);

  const flushBatch = useCallback(() => {
    if (batchTimerRef.current) {
      clearTimeout(batchTimerRef.current);
      batchTimerRef.current = null;
    }

    if (batchQueueRef.current.length === 0) return;

    const eventsToEmit = [...batchQueueRef.current];
    batchQueueRef.current = [];

    const socket = getSocket();
    if (socket && eventsToEmit.length > 0) {
      socket.emit('proctor_batch_events', { examId, events: eventsToEmit });
    }
  }, [examId]);

  const seqRef = useRef(0);

  const logViolation = useCallback(async (type, severity = 'medium', details = '') => {
    if (!enabled || restricted) return;

    // Client-side debounce: ignore identical non-critical violation types within 300ms
    const now = Date.now();
    const lastTime = lastViolationTimeMap.current.get(type) || 0;
    if (now - lastTime < 300 && !CRITICAL_TYPES.has(type)) return;
    lastViolationTimeMap.current.set(type, now);

    countRef.current += 1;
    seqRef.current += 1;
    const count = countRef.current;
    const eventId = `${examId || 'exam'}_${now}_${seqRef.current}`;
    const eventObj = { eventId, type, severity, details, count, timestamp: new Date().toISOString() };

    setViolationCount(count);
    setViolations(prev => [...prev, { eventId, type, severity, details, timestamp: new Date() }]);

    const isCritical = CRITICAL_TYPES.has(type);
    const socket = getSocket();

    if (isCritical) {
      // Immediate bypass for critical violations
      if (socket) socket.emit('violation', eventObj);
    } else {
      // Buffer into 300ms batch queue
      batchQueueRef.current.push(eventObj);
      if (!batchTimerRef.current) {
        batchTimerRef.current = setTimeout(flushBatch, 300);
      }
    }

    try {
      const res = await api.post('/violations', { examId, type, severity, details });
      if (res.data?.restricted) {
        setRestricted(true);
        flushBatch();
        if (onRestricted) onRestricted(res.data.message);
        if (onAutoSubmit) onAutoSubmit('Max violations exceeded');
      }
    } catch (e) {
      console.warn('[Proctoring] Failed to log violation:', e.message);
    }
  }, [examId, enabled, restricted, onRestricted, onAutoSubmit, flushBatch]);

  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const handleVisibility = () => {
      if (document.hidden) logViolation('tab_switch', 'high', 'Tab switched / minimized');
    };

    const handleBlur = () => logViolation('window_blur', 'high', 'Window lost focus');

    const handleFullscreen = () => {};

    const preventEvent = (name) => (e) => {
      e.preventDefault();
      logViolation('copy_paste', 'medium', `${name} attempted`);
    };

    const handleCopy = preventEvent('Copy');
    const handlePaste = preventEvent('Paste');
    const handleCut = preventEvent('Cut');
    const handleDrag = preventEvent('Drag');
    const handleDrop = preventEvent('Drop');

    const handleContext = (e) => {
      e.preventDefault();
    };

    const handleKeydown = (e) => {
      const now = Date.now();
      if (now - lastKeypressTimeRef.current < 20) {
        rapidKeystrokeCountRef.current += 1;
        if (rapidKeystrokeCountRef.current > 10) {
          e.preventDefault();
          logViolation('programmatic_injection', 'critical', 'Impossibly fast typing detected (Ghosting)');
          return;
        }
      } else {
        rapidKeystrokeCountRef.current = 0;
      }
      lastKeypressTimeRef.current = now;

      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        logViolation('devtools', 'critical', 'DevTools shortcut detected');
        return;
      }
      if (e.ctrlKey && (e.key === 'Tab' || e.key === 't' || e.key === 'T' || e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        logViolation('keyboard_shortcut', 'high', `Ctrl+${e.key} detected`);
        return;
      }
      if (e.altKey && e.key === 'Tab') {
        logViolation('keyboard_shortcut', 'high', 'Alt+Tab detected');
        return;
      }
      if (e.ctrlKey && ['c', 'v', 'x', 'a', 'C', 'V', 'X', 'A'].includes(e.key)) {
        e.preventDefault(); 
        logViolation('copy_paste', 'medium', `Ctrl+${e.key.toUpperCase()} detected`); 
      }
    };

    let lastW = window.innerWidth, lastH = window.innerHeight;
    const handleResize = () => {
      const dw = Math.abs(window.innerWidth - lastW);
      const dh = Math.abs(window.innerHeight - lastH);
      if (dw > 200 || dh > 200) {
        logViolation('screen_resize', 'medium', `Significant resize: ${dw}x${dh}`);
      }
      lastW = window.innerWidth;
      lastH = window.innerHeight;
    };

    const preventSelection = (e) => {
      e.preventDefault();
    };

    // ── Debounced, low-overhead MutationObserver ─────────────────────────────
    let mutationRaf = null;
    let pendingMutations = [];

    const processMutations = () => {
      if (!isMounted) return;
      let suspiciousFound = false;

      for (let i = 0; i < pendingMutations.length; i++) {
        const added = pendingMutations[i].addedNodes;
        for (let j = 0; j < added.length; j++) {
          const node = added[j];
          if (node.nodeType === 1) { // ELEMENT_NODE
            const name = node.nodeName;
            if (name === 'IFRAME' || name.startsWith('GRAMMARLY-') || name.startsWith('CHATGPT-')) {
              suspiciousFound = true;
              break;
            }
            const idOrClass = ((node.id || '') + ' ' + (node.className || '')).toLowerCase();
            if (idOrClass.includes('grammarly') || idOrClass.includes('chatgpt') || idOrClass.includes('solver')) {
              suspiciousFound = true;
              break;
            }
          }
        }
        if (suspiciousFound) break;
      }

      pendingMutations = [];
      mutationRaf = null;

      if (suspiciousFound) {
        logViolation('unauthorized_extension', 'high', 'Suspicious DOM injection detected');
      }
    };

    const observer = new MutationObserver((mutations) => {
      pendingMutations.push(...mutations);
      if (!mutationRaf) {
        mutationRaf = requestAnimationFrame(processMutations);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);
    document.addEventListener('dragstart', handleDrag);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('selectstart', preventSelection);
    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false;
      flushBatch();
      if (mutationRaf) cancelAnimationFrame(mutationRaf);
      observer.disconnect();

      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
      document.removeEventListener('dragstart', handleDrag);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('selectstart', preventSelection);
      window.removeEventListener('resize', handleResize);

      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [enabled, logViolation, flushBatch]);

  return { violations, violationCount, restricted, logViolation, flushBatch };
}
