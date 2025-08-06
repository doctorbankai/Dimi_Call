# Implementation Plan

- [x] 1. Implement DevTools IPC handlers in main process


  - Add `devtools:enable`, `devtools:disable`, and `devtools:is-enabled` handlers to electron/main.ts
  - Implement logic to manage DevTools state in the main window
  - Add proper error handling for cases where main window is not available
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_



- [ ] 2. Extend preload API with DevTools methods
  - Add devTools object to ElectronAPI interface in electron/preload.ts
  - Implement enable, disable, and isEnabled methods using ipcRenderer.invoke


  - Ensure proper TypeScript typing for the new APIs
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Update DevToolsService to use new IPC APIs
  - Modify enableDevTools() method to use window.electronAPI.devTools.enable()

  - Modify disableDevTools() method to use window.electronAPI.devTools.disable()
  - Update isDevToolsEnabledInElectron() to use the new API
  - Add proper error handling and fallbacks for API unavailability
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_

- [x] 4. Implement keyboard shortcut management with user preferences


  - Modify the before-input-event handler in electron/main.ts
  - Check DevTools enabled state before opening DevTools on Ctrl+Shift+I
  - Ensure DevTools still open automatically in development mode
  - Add logging for debugging shortcut behavior
  - _Requirements: 1.2, 1.4, 3.1, 3.2_



- [ ] 5. Add DevTools state restoration on application startup
  - Read DevTools preferences from localStorage on app startup
  - Apply the saved DevTools state to the main window
  - Ensure proper initialization order (after window creation)


  - Handle cases where localStorage is not available or corrupted
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 6. Implement automatic DevTools activation for beta versions
  - Modify BetaOptInSettings component to auto-enable DevTools when beta is activated


  - Update the beta preferences change handler to sync DevTools state
  - Ensure DevTools checkbox reflects the automatic activation
  - Add logic to not force-disable DevTools when beta is deactivated
  - _Requirements: 4.1, 4.2, 4.3_




- [ ] 7. Add comprehensive error handling and logging
  - Add try-catch blocks around all DevTools operations
  - Implement proper error messages for user feedback
  - Add console logging for debugging DevTools state changes
  - Handle edge cases like window not ready or IPC failures
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2_

- [ ] 8. Create unit tests for DevTools functionality
  - Write tests for DevToolsService methods with mocked IPC calls
  - Test error handling scenarios and fallback behaviors
  - Test localStorage persistence and state restoration
  - Mock electron APIs for testing in Node.js environment
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

- [ ] 9. Create integration tests for DevTools workflow
  - Test complete activation/deactivation flow from UI to Electron
  - Test keyboard shortcut functionality with different states
  - Test beta version integration with DevTools auto-activation
  - Test application restart and state persistence
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2, 4.3_