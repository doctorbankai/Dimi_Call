import { useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing cleanup operations and preventing memory leaks
 * Provides automatic cleanup of refs, timers, and subscriptions
 */

interface CleanupRef {
  // Timers
  timers: Set<NodeJS.Timeout>;
  intervals: Set<NodeJS.Timeout>;
  
  // Event listeners
  eventListeners: Map<EventTarget, Map<string, EventListenerOrEventListenerObject>>;
  
  // Abort controllers for async operations
  abortControllers: Set<AbortController>;
  
  // Custom cleanup functions
  cleanupFunctions: Set<() => void>;
  
  // Refs that need cleanup
  refs: Set<{ current: any }>;
}

interface CleanupActions {
  // Timer management
  addTimer: (timer: NodeJS.Timeout) => void;
  addInterval: (interval: NodeJS.Timeout) => void;
  clearAllTimers: () => void;
  
  // Event listener management
  addEventListener: <K extends keyof WindowEventMap>(
    target: EventTarget,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeAllEventListeners: () => void;
  
  // Abort controller management
  createAbortController: () => AbortController;
  abortAll: () => void;
  
  // Custom cleanup
  addCleanup: (cleanup: () => void) => void;
  
  // Manual cleanup trigger
  cleanup: () => void;
  
  // Check if component is still mounted
  isMounted: () => boolean;
}

export const useCleanupRef = (): CleanupActions => {
  const cleanupRef = useRef<CleanupRef>({
    timers: new Set(),
    intervals: new Set(),
    eventListeners: new Map(),
    abortControllers: new Set(),
    cleanupFunctions: new Set(),
    refs: new Set(),
  });
  
  const mountedRef = useRef(true);
  
  // Cleanup all resources
  const cleanup = useCallback(() => {
    const { timers, intervals, eventListeners, abortControllers, cleanupFunctions } = cleanupRef.current;
    
    // Clear all timers
    timers.forEach(timer => clearTimeout(timer));
    timers.clear();
    
    // Clear all intervals
    intervals.forEach(interval => clearInterval(interval));
    intervals.clear();
    
    // Remove all event listeners
    eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        try {
          target.removeEventListener(type, listener);
        } catch (error) {
          console.warn('Failed to remove event listener:', error);
        }
      });
    });
    eventListeners.clear();
    
    // Abort all pending requests
    abortControllers.forEach(controller => {
      try {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      } catch (error) {
        console.warn('Failed to abort controller:', error);
      }
    });
    abortControllers.clear();
    
    // Execute custom cleanup functions
    cleanupFunctions.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.warn('Error in custom cleanup function:', error);
      }
    });
    cleanupFunctions.clear();
    
  }, []);
  
  // Timer management
  const addTimer = useCallback((timer: NodeJS.Timeout) => {
    cleanupRef.current.timers.add(timer);
  }, []);
  
  const addInterval = useCallback((interval: NodeJS.Timeout) => {
    cleanupRef.current.intervals.add(interval);
  }, []);
  
  const clearAllTimers = useCallback(() => {
    const { timers, intervals } = cleanupRef.current;
    timers.forEach(timer => clearTimeout(timer));
    intervals.forEach(interval => clearInterval(interval));
    timers.clear();
    intervals.clear();
  }, []);
  
  // Event listener management
  const addEventListener = useCallback(<K extends keyof WindowEventMap>(
    target: EventTarget,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) => {
    try {
      target.addEventListener(type as string, listener as EventListener, options);
      
      // Store for cleanup
      if (!cleanupRef.current.eventListeners.has(target)) {
        cleanupRef.current.eventListeners.set(target, new Map());
      }
      cleanupRef.current.eventListeners.get(target)!.set(type as string, listener as EventListener);
    } catch (error) {
      console.warn('Failed to add event listener:', error);
    }
  }, []);
  
  const removeAllEventListeners = useCallback(() => {
    const { eventListeners } = cleanupRef.current;
    eventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, type) => {
        try {
          target.removeEventListener(type, listener);
        } catch (error) {
          console.warn('Failed to remove event listener:', error);
        }
      });
    });
    eventListeners.clear();
  }, []);
  
  // Abort controller management
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    cleanupRef.current.abortControllers.add(controller);
    return controller;
  }, []);
  
  const abortAll = useCallback(() => {
    cleanupRef.current.abortControllers.forEach(controller => {
      try {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      } catch (error) {
        console.warn('Failed to abort controller:', error);
      }
    });
    cleanupRef.current.abortControllers.clear();
  }, []);
  
  // Custom cleanup management
  const addCleanup = useCallback((cleanupFn: () => void) => {
    cleanupRef.current.cleanupFunctions.add(cleanupFn);
  }, []);
  
  // Mounted check
  const isMounted = useCallback(() => {
    return mountedRef.current;
  }, []);
  
  // Effect to handle component unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);
  
  return {
    addTimer,
    addInterval,
    clearAllTimers,
    addEventListener,
    removeAllEventListeners,
    createAbortController,
    abortAll,
    addCleanup,
    cleanup,
    isMounted,
  };
};

/**
 * Extended hook that provides common cleanup patterns for table components
 */
export const useTableCleanup = () => {
  const cleanup = useCleanupRef();
  
  // Safe setTimeout that's automatically cleaned up
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      if (cleanup.isMounted()) {
        callback();
      }
    }, delay);
    
    cleanup.addTimer(timer);
    return timer;
  }, [cleanup]);
  
  // Safe setInterval that's automatically cleaned up
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(() => {
      if (cleanup.isMounted()) {
        callback();
      }
    }, delay);
    
    cleanup.addInterval(interval);
    return interval;
  }, [cleanup]);
  
  // Safe async operation with abort signal
  const safeAsync = useCallback(async <T>(
    asyncFn: (signal: AbortSignal) => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ) => {
    const controller = cleanup.createAbortController();
    
    try {
      const result = await asyncFn(controller.signal);
      
      if (cleanup.isMounted() && !controller.signal.aborted) {
        onSuccess?.(result);
      }
    } catch (error) {
      if (cleanup.isMounted() && !controller.signal.aborted) {
        onError?.(error as Error);
      }
    }
  }, [cleanup]);
  
  // Safe event listener with automatic cleanup
  const safeEventListener = useCallback(<K extends keyof WindowEventMap>(
    target: EventTarget,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ) => {
    const wrappedListener = (ev: Event) => {
      if (cleanup.isMounted()) {
        listener.call(target as any, ev as any);
      }
    };
    
    cleanup.addEventListener(target, type, wrappedListener as any, options);
  }, [cleanup]);
  
  // Debounced function with cleanup
  const createDebouncedCallback = useCallback(<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
  ): T => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const debouncedFn = ((...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = safeSetTimeout(() => {
        callback(...args);
      }, delay);
    }) as T;
    
    // Add cleanup for the debounced function
    cleanup.addCleanup(() => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
    
    return debouncedFn;
  }, [cleanup, safeSetTimeout]);
  
  return {
    ...cleanup,
    safeSetTimeout,
    safeSetInterval,
    safeAsync,
    safeEventListener,
    createDebouncedCallback,
  };
};

export default useCleanupRef;