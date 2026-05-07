import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as blazeface from '@tensorflow-models/blazeface';

export default function useAIVision({ enabled = false, onViolation }) {
  const videoRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [streamActive, setStreamActive] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const models = useRef({ coco: null, face: null });
  const intervalRef = useRef(null);

  // Load AI Models
  useEffect(() => {
    let isMounted = true;
    if (enabled && !modelsLoaded) {
      Promise.all([
        cocoSsd.load({ base: 'lite_mobilenet_v2' }),
        blazeface.load()
      ]).then(([coco, face]) => {
        if (isMounted) {
          models.current = { coco, face };
          setModelsLoaded(true);
        }
      }).catch(err => {
        console.error("Failed to load AI models:", err);
      });
    }
    return () => { isMounted = false; };
  }, [enabled, modelsLoaded]);

  // Start Webcam
  useEffect(() => {
    let stream = null;
    if (enabled && videoRef.current && !streamActive) {
      navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              setStreamActive(true);
            };
          }
        })
        .catch(err => {
          console.error("Camera access denied:", err);
          onViolation('no_camera', 'critical', 'Camera access denied or device not found');
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      setStreamActive(false);
    };
  }, [enabled, streamActive, onViolation]);

  // AI Analysis Loop
  const analyzeFrame = useCallback(async () => {
    if (!videoRef.current || !models.current.coco || !models.current.face || videoRef.current.readyState !== 4) return;

    try {
      const video = videoRef.current;
      const currentAlerts = [];
      
      // Face Detection
      const faces = await models.current.face.estimateFaces(video, false);
      if (faces.length === 0) {
        currentAlerts.push({ type: 'no_face', msg: 'No face detected in frame' });
        onViolation('no_face', 'high', 'No face detected in frame');
      } else if (faces.length > 1) {
        currentAlerts.push({ type: 'multiple_faces', msg: `Detected ${faces.length} faces` });
        onViolation('multiple_faces', 'critical', `Detected ${faces.length} faces in frame`);
      }

      // Object Detection
      const predictions = await models.current.coco.detect(video);
      const prohibited = ['cell phone', 'book', 'laptop'];
      
      predictions.forEach(p => {
        if (prohibited.includes(p.class) && p.score > 0.6) {
          currentAlerts.push({ type: 'prohibited_object', msg: `Detected: ${p.class}` });
          onViolation('prohibited_object', 'critical', `Detected: ${p.class} (${Math.round(p.score * 100)}%)`);
        }
      });

      setAlerts(currentAlerts);
    } catch (e) {
      console.error("AI Analysis Error:", e);
    }
  }, [onViolation]);

  useEffect(() => {
    if (enabled && modelsLoaded && streamActive) {
      intervalRef.current = setInterval(analyzeFrame, 1500); // Analyze every 1.5 seconds
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, modelsLoaded, streamActive, analyzeFrame]);

  return { videoRef, modelsLoaded, streamActive, alerts };
}
