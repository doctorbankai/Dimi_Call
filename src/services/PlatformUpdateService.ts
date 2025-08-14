/**
 * Service for managing platform-specific update configuration
 * Handles disabling updates on macOS while preserving functionality on other platforms
 */

export interface UpdateConfiguration {
  enabled: boolean;
  platform: 'darwin' | 'win32' | 'linux';
  reason?: string;
  manualUpdateUrl?: string;
  buildEnvironment?: 'github-actions' | 'local' | 'unknown';
}

export interface ManualUpdateInfo {
  url: string;
  message: string;
  platform: string;
  version: string;
}

export class PlatformUpdateService {
  private static configuration: UpdateConfiguration | null = null;

  /**
   * Get the update configuration for the current platform
   */
  static getUpdateConfiguration(): UpdateConfiguration {
    if (this.configuration) {
      return this.configuration;
    }

    try {
      const platform = process.platform as 'darwin' | 'win32' | 'linux';
      
      // Validate platform
      if (!['darwin', 'win32', 'linux'].includes(platform)) {
        console.warn(`[PlatformUpdateService] Unknown platform: ${platform}, disabling updates for safety`);
        this.configuration = {
          enabled: false,
          platform: platform as any,
          reason: `Unknown platform '${platform}', updates disabled for safety`,
          manualUpdateUrl: 'https://github.com/your-repo/releases',
          buildEnvironment: 'unknown'
        };
        return this.configuration;
      }

      const disableUpdates = process.env.DISABLE_AUTO_UPDATES === 'true';
      const forceEnable = process.env.FORCE_ENABLE_UPDATES === 'true';
      let manualUpdateUrl = process.env.MANUAL_UPDATE_URL || 'https://github.com/your-repo/releases';
      
      // Validate manual update URL
      try {
        new URL(manualUpdateUrl);
      } catch (urlError) {
        console.warn(`[PlatformUpdateService] Invalid MANUAL_UPDATE_URL: ${manualUpdateUrl}, using default`);
        manualUpdateUrl = 'https://github.com/your-repo/releases';
      }
      
      // Determine build environment
      let buildEnvironment: 'github-actions' | 'local' | 'unknown' = 'unknown';
      try {
        if (process.env.GITHUB_ACTIONS === 'true') {
          buildEnvironment = 'github-actions';
        } else if (process.env.NODE_ENV === 'development') {
          buildEnvironment = 'local';
        }
      } catch (envError) {
        console.warn(`[PlatformUpdateService] Error reading environment variables:`, envError);
      }

      let enabled = true;
      let reason: string | undefined;

      // Disable updates on macOS by default, unless forced to enable
      if (platform === 'darwin' && !forceEnable) {
        enabled = false;
        reason = 'Updates disabled on macOS due to notarization requirements';
      }

      // Override with explicit disable flag
      if (disableUpdates && !forceEnable) {
        enabled = false;
        reason = 'Updates explicitly disabled via environment variable';
      }

      this.configuration = {
        enabled,
        platform,
        reason,
        manualUpdateUrl,
        buildEnvironment
      };

      console.log(`[PlatformUpdateService] Configuration: ${JSON.stringify(this.configuration)}`);
      return this.configuration;
      
    } catch (error) {
      console.error(`[PlatformUpdateService] Error creating configuration:`, error);
      
      // Fallback configuration - disable updates for safety
      this.configuration = {
        enabled: false,
        platform: 'linux', // Safe default
        reason: `Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        manualUpdateUrl: 'https://github.com/your-repo/releases',
        buildEnvironment: 'unknown'
      };
      
      return this.configuration;
    }
  }

  /**
   * Check if updates are enabled for the current platform
   */
  static isUpdateEnabled(): boolean {
    return this.getUpdateConfiguration().enabled;
  }

  /**
   * Get manual update information for platforms where auto-updates are disabled
   */
  static getManualUpdateInfo(): ManualUpdateInfo | null {
    try {
      const config = this.getUpdateConfiguration();
      
      if (config.enabled) {
        return null; // No manual update info needed when auto-updates are enabled
      }

      let version = '1.0.0'; // Default version
      try {
        version = process.env.npm_package_version || '1.0.0';
      } catch (versionError) {
        console.warn(`[PlatformUpdateService] Error reading version:`, versionError);
      }
      
      const manualUpdateInfo: ManualUpdateInfo = {
        url: config.manualUpdateUrl || 'https://github.com/your-repo/releases',
        message: config.platform === 'darwin' 
          ? 'Les mises à jour automatiques ne sont pas disponibles sur macOS. Téléchargez la dernière version manuellement depuis GitHub.'
          : 'Les mises à jour automatiques sont désactivées. Téléchargez la dernière version manuellement depuis GitHub.',
        platform: config.platform,
        version
      };

      console.log(`[PlatformUpdateService] Manual update info generated:`, manualUpdateInfo);
      return manualUpdateInfo;
      
    } catch (error) {
      console.error(`[PlatformUpdateService] Error generating manual update info:`, error);
      
      // Return fallback manual update info
      return {
        url: 'https://github.com/your-repo/releases',
        message: 'Les mises à jour automatiques ne sont pas disponibles. Visitez GitHub pour télécharger la dernière version.',
        platform: 'unknown',
        version: '1.0.0'
      };
    }
  }

  /**
   * Reset the cached configuration (useful for testing)
   */
  static resetConfiguration(): void {
    this.configuration = null;
  }
}