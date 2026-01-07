import { useEffect, useRef, createContext, useContext } from "react";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";
import { usePermissions } from "../permissions/usePermissions";

const TesterContext = createContext(null);

export function useTesterTracking() {
  return useContext(TesterContext);
}

export default function TesterTracker({ children }) {
  const { user, isTester } = usePermissions();
  const location = useLocation();
  const sessionIdRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Session starten
  useEffect(() => {
    if (isTester && !sessionIdRef.current) {
      startTestSession();
    }
    
    // Session beenden beim Verlassen
    return () => {
      if (sessionIdRef.current) {
        endTestSession();
      }
    };
  }, [isTester]);
  
  // Seiten-Tracking
  useEffect(() => {
    if (isTester && sessionIdRef.current) {
      trackPageVisit();
    }
  }, [location.pathname]);
  
  const startTestSession = async () => {
    try {
      const response = await base44.functions.invoke('startTestSession', {});
      sessionIdRef.current = response.data.sessionId;
      startTimeRef.current = Date.now();
    } catch (error) {
      console.error("Failed to start test session:", error);
    }
  };
  
  const trackPageVisit = async () => {
    if (!sessionIdRef.current) return;
    
    const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    startTimeRef.current = Date.now();
    
    try {
      await base44.functions.invoke('trackTestActivity', {
        sessionId: sessionIdRef.current,
        activityType: 'page_visit',
        activityData: {
          page: location.pathname,
          duration: Math.round(duration / 1000) // Sekunden
        }
      });
    } catch (error) {
      console.error("Failed to track page visit:", error);
    }
  };
  
  const trackAction = async (actionType, target, resource = null, resourceId = null) => {
    if (!isTester || !sessionIdRef.current) return;
    
    try {
      await base44.functions.invoke('trackTestActivity', {
        sessionId: sessionIdRef.current,
        activityType: 'action',
        activityData: {
          type: actionType,
          target,
          resource,
          resourceId,
          page: location.pathname
        }
      });
    } catch (error) {
      console.error("Failed to track action:", error);
    }
  };
  
  const trackFeatureTest = async (feature) => {
    if (!isTester || !sessionIdRef.current) return;
    
    try {
      await base44.functions.invoke('trackTestActivity', {
        sessionId: sessionIdRef.current,
        activityType: 'feature_test',
        activityData: { feature }
      });
    } catch (error) {
      console.error("Failed to track feature test:", error);
    }
  };
  
  const endTestSession = async () => {
    if (!sessionIdRef.current) return;
    
    try {
      await base44.functions.invoke('endTestSession', {
        sessionId: sessionIdRef.current,
        feedback: null
      });
      sessionIdRef.current = null;
    } catch (error) {
      console.error("Failed to end test session:", error);
    }
  };
  
  return (
    <TesterContext.Provider value={{ trackAction, trackFeatureTest }}>
      {children}
    </TesterContext.Provider>
  );
}