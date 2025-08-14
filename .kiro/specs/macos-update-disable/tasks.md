# Implementation Plan

- [x] 1. Create PlatformUpdateService for platform-specific update configuration


  - Create new service file `src/services/PlatformUpdateService.ts`
  - Implement platform detection using `process.platform`
  - Add environment variable checking for `DISABLE_AUTO_UPDATES` and `MANUAL_UPDATE_URL`
  - Create methods for `getUpdateConfiguration()`, `isUpdateEnabled()`, and `getManualUpdateInfo()`
  - Add TypeScript interfaces for `UpdateConfiguration` and `ManualUpdateInfo`
  - Write unit tests for platform detection and configuration logic
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.1, 5.2, 5.3, 5.4_



- [ ] 2. Modify main process to conditionally initialize electron-updater
  - Update `electron/main.ts` to import and use PlatformUpdateService
  - Add conditional initialization of autoUpdater based on platform configuration
  - Skip autoUpdater setup completely when updates are disabled on macOS
  - Modify IPC event handlers to check update configuration before processing
  - Add logging for update configuration status on startup


  - Ensure existing Windows/Linux functionality remains unchanged
  - _Requirements: 1.2, 1.3, 1.4, 3.1, 3.2_

- [ ] 3. Update useAutoUpdate hook to handle disabled updates
  - Modify `src/hooks/useAutoUpdate.ts` to use PlatformUpdateService
  - Add `isUpdateEnabled` and `manualUpdateInfo` to the hook's return interface
  - Skip event listener initialization when updates are disabled


  - Set default disabled state for macOS platform
  - Ensure hook returns appropriate values for manual update information
  - Maintain backward compatibility with existing hook consumers
  - _Requirements: 1.1, 1.4, 4.1, 4.2, 4.3_

- [x] 4. Modify TitleBar component to conditionally show update badge


  - Update `src/components/TitleBar.tsx` to check `isUpdateEnabled` from useAutoUpdate hook
  - Hide update badge completely when updates are disabled on macOS
  - Ensure update badge continues to work normally on Windows and Linux
  - Preserve existing styling and animations for enabled platforms
  - Add conditional rendering logic without breaking existing functionality
  - _Requirements: 1.1, 1.4_



- [ ] 5. Update SettingsDialog to show manual update information for macOS
  - Modify `src/components/SettingsDialog.tsx` to conditionally render update section
  - Hide automatic update controls when updates are disabled
  - Create new ManualUpdateInfo component for macOS users
  - Add external link button to GitHub releases page
  - Include informative message about manual updates on macOS


  - Ensure settings dialog works normally on Windows and Linux
  - _Requirements: 2.1, 2.2, 4.1, 4.2, 4.3_

- [ ] 6. Update GitHub Actions workflow for macOS builds
  - Modify `.github/workflows/release.yml` to set `DISABLE_AUTO_UPDATES=true` for macOS builds
  - Add `MANUAL_UPDATE_URL` environment variable pointing to GitHub releases


  - Ensure Windows builds continue with normal update configuration
  - Test that environment variables are properly passed to the build process
  - Verify that macOS builds are created with update functionality disabled
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 7. Add TypeScript type definitions and interfaces
  - Create comprehensive TypeScript interfaces for all new types


  - Update existing interfaces to include new optional fields
  - Add proper JSDoc documentation for all new functions and interfaces
  - Ensure type safety across all modified components
  - Export types from appropriate index files for reusability
  - _Requirements: All requirements (type safety)_

- [x] 8. Write comprehensive tests for platform-specific behavior



  - Create unit tests for PlatformUpdateService with different platform scenarios
  - Test useAutoUpdate hook behavior on different platforms
  - Test component rendering with updates enabled/disabled
  - Create integration tests for complete update flow on each platform
  - Test environment variable handling in different build scenarios
  - Add tests for manual update information display and link functionality
  - _Requirements: All requirements (testing coverage)_

- [ ] 9. Add error handling and logging for update configuration
  - Implement robust error handling in PlatformUpdateService
  - Add logging for update configuration decisions and platform detection
  - Handle edge cases like unknown platforms or missing environment variables
  - Implement fallback behavior when configuration fails
  - Add user-friendly error messages for configuration issues
  - Ensure graceful degradation when update services are unavailable
  - _Requirements: 3.4, 4.4_

- [ ] 10. Update electron-builder configuration for conditional publishing
  - Modify electron-builder configuration to handle platform-specific publish settings
  - Ensure macOS builds don't attempt auto-update publishing when disabled
  - Maintain normal publishing behavior for Windows and Linux builds
  - Test that build artifacts are created correctly for all platforms
  - Verify that GitHub releases are published appropriately
  - _Requirements: 5.1, 5.2, 5.3, 5.4_