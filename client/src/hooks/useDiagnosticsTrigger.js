import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Hook to detect triple-clicks for showing diagnostics panel
 * @param {number} clickThreshold - Number of clicks needed to trigger (default: 3)
 * @param {number} timeWindow - Time window in ms for clicks to be counted together (default: 500ms)
 * @param {string} keyboardShortcut - Keyboard shortcut to toggle panel (default: 'ctrl+shift+d')
 * @returns {Object} - Object containing isDiagnosticsPanelOpen and methods to control panel
 */
const useDiagnosticsTrigger = (clickThreshold = 3, timeWindow = 500, keyboardShortcut = 'ctrl+shift+d') => {
  const [isDiagnosticsPanelOpen, setIsDiagnosticsPanelOpen] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const [clickIndicator, setClickIndicator] = useState(null);
  const indicatorTimerRef = useRef(null);
  
  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
      }
      if (indicatorTimerRef.current) {
        clearTimeout(indicatorTimerRef.current);
      }
      // Remove indicator if it exists
      removeClickIndicator();
    };
  }, []);
  
  // Create a visual click indicator
  const createClickIndicator = (e) => {
    // Remove any existing indicator
    removeClickIndicator();
    
    // Create indicator element
    const indicator = document.createElement('div');
    indicator.id = 'diagnostic-click-indicator';
    indicator.style.position = 'fixed';
    indicator.style.width = '30px';
    indicator.style.height = '30px';
    indicator.style.borderRadius = '50%';
    indicator.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
    indicator.style.border = '2px solid rgba(0, 255, 0, 0.8)';
    indicator.style.display = 'flex';
    indicator.style.justifyContent = 'center';
    indicator.style.alignItems = 'center';
    indicator.style.fontWeight = 'bold';
    indicator.style.fontSize = '16px';
    indicator.style.color = 'white';
    indicator.style.transform = 'translate(-50%, -50%)';
    indicator.style.pointerEvents = 'none';
    indicator.style.zIndex = 10000;
    indicator.style.opacity = 0.8;
    
    // Position at click location
    indicator.style.left = `${e.clientX}px`;
    indicator.style.top = `${e.clientY}px`;
    
    // Show current click count
    indicator.textContent = clickCountRef.current;
    
    // Append to document
    document.body.appendChild(indicator);
    
    // Store reference
    setClickIndicator(indicator);
    
    // Set timeout to remove indicator
    if (indicatorTimerRef.current) {
      clearTimeout(indicatorTimerRef.current);
    }
    indicatorTimerRef.current = setTimeout(() => {
      removeClickIndicator();
    }, timeWindow + 500); // Slightly longer than the click detection window
  };
  
  // Remove click indicator
  const removeClickIndicator = () => {
    const existingIndicator = document.getElementById('diagnostic-click-indicator');
    if (existingIndicator) {
      document.body.removeChild(existingIndicator);
    }
    setClickIndicator(null);
  };
  
  // Update click indicator count
  const updateClickIndicator = () => {
    if (clickIndicator) {
      clickIndicator.textContent = clickCountRef.current;
      
      // Make it more noticeable as clicks increase
      if (clickCountRef.current === clickThreshold - 1) {
        clickIndicator.style.backgroundColor = 'rgba(255, 165, 0, 0.7)'; // Orange
        clickIndicator.style.border = '2px solid rgba(255, 165, 0, 0.9)';
      } else if (clickCountRef.current >= clickThreshold) {
        clickIndicator.style.backgroundColor = 'rgba(0, 128, 255, 0.7)'; // Blue
        clickIndicator.style.border = '2px solid rgba(0, 128, 255, 0.9)';
      }
    }
  };
  
  // Handle global clicks to detect triple-clicks
  const handleGlobalClick = useCallback((e) => {
    // Increment click count
    clickCountRef.current += 1;
    
    // Show or update visual indicator
    if (clickCountRef.current === 1) {
      createClickIndicator(e);
    } else {
      updateClickIndicator();
    }
    
    // Clear any existing timer
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    
    // Set new timer to reset click count after timeWindow
    clickTimerRef.current = setTimeout(() => {
      // If threshold was reached, toggle diagnostics panel
      if (clickCountRef.current >= clickThreshold) {
        setIsDiagnosticsPanelOpen(prevState => !prevState);
      }
      
      // Reset click count
      clickCountRef.current = 0;
    }, timeWindow);
  }, [clickThreshold, timeWindow, clickIndicator]);
  
  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e) => {
    // Parse keyboard shortcut
    const shortcutParts = keyboardShortcut.toLowerCase().split('+');
    const needsCtrl = shortcutParts.includes('ctrl');
    const needsShift = shortcutParts.includes('shift');
    const needsAlt = shortcutParts.includes('alt');
    const key = shortcutParts.filter(p => !['ctrl', 'shift', 'alt'].includes(p)).join('');
    
    // Check if the pressed key matches the shortcut
    if (
      (e.key === key || e.key.toLowerCase() === key) && 
      (!needsCtrl || e.ctrlKey) &&
      (!needsShift || e.shiftKey) &&
      (!needsAlt || e.altKey)
    ) {
      e.preventDefault(); // Prevent default browser behavior
      setIsDiagnosticsPanelOpen(prevState => !prevState);
    }
  }, [keyboardShortcut]);
  
  // Add and remove event listeners
  useEffect(() => {
    document.addEventListener('click', handleGlobalClick);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleGlobalClick, handleKeyDown]);
  
  // Method to manually close panel
  const closeDiagnosticsPanel = useCallback(() => {
    setIsDiagnosticsPanelOpen(false);
  }, []);
  
  // Method to manually open panel
  const openDiagnosticsPanel = useCallback(() => {
    setIsDiagnosticsPanelOpen(true);
  }, []);
  
  return {
    isDiagnosticsPanelOpen,
    closeDiagnosticsPanel,
    openDiagnosticsPanel
  };
};

export default useDiagnosticsTrigger; 