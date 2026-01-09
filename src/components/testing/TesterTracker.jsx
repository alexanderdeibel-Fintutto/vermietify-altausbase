import { useEffect, useRef, createContext, useContext } from "react";
import { usePermissions } from "../permissions/usePermissions";
import { base44 } from "@/api/base44Client";
import { useLocation } from "react-router-dom";

const TesterContext = createContext(null);

export function useTesterTracking() {
  return useContext(TesterContext);
}

export default function TesterTracker({ children }) {
  const { user, isTester } = usePermissions();
  const location = useLocation();
  const sessionIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const lastTrackRef = useRef(null);
  const debounceRef = useRef(null);
  const hasInitializedRef = useRef(false);
  
  // Session starten - nur einmal
  useEffect(() => {
    if (isTester && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const savedSession = sessionStorage.getItem('tester_session_id');
      if (savedSession) {
        sessionIdRef.current = savedSession;
        startTimeRef.current = Date.now();
      } else {
        startTestSession();
      }
    }
    
    return () => {
      if (sessionIdRef.current && debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Seiten-Tracking mit Debounce
  useEffect(() => {
    if (isTester && sessionIdRef.current) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        trackPageVisit();
      }, 500);
    }
  }, [location.pathname]);
  
  const startTestSession = async () => {
    try {
      const result = await base44.functions.invoke('startTestSession', {});
      sessionIdRef.current = result.data.session_id;
      startTimeRef.current = Date.now();
      sessionStorage.setItem('tester_session_id', result.data.session_id);
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
        session_id: sessionIdRef.current,
        activity_type: 'page_visit',
        data: {
          url: window.location.href,
          title: document.title
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
        session_id: sessionIdRef.current,
        activity_type: 'action',
        data: {
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
        session_id: sessionIdRef.current,
        activity_type: 'feature_tested',
        data: { feature }
      });
    } catch (error) {
      console.error("Failed to track feature test:", error);
    }
  };
  
  const endTestSession = async () => {
    if (!sessionIdRef.current) return;
    
    try {
      await base44.functions.invoke('endTestSession', {
        session_id: sessionIdRef.current,
        feedback_rating: null,
        notes: null
      });
      sessionStorage.removeItem('tester_session_id');
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