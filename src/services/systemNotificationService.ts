import type { DesktopNotificationPayload } from "@/notifications/types";

type ShowNotificationResult = { success: boolean };

const hasWindow = typeof window !== "undefined";

const isElectronEnvironment = (): boolean => {
  if (!hasWindow) {
    return false;
  }
  return Boolean((window as any).electronAPI);
};

const showViaElectron = async (payload: DesktopNotificationPayload): Promise<boolean> => {
  if (!isElectronEnvironment()) {
    return false;
  }
  try {
    const result = await (window as any).electronAPI?.showNotification?.(payload);
    if (typeof result === "boolean") {
      return result;
    }
    if (result && typeof result === "object") {
      return Boolean((result as ShowNotificationResult).success);
    }
  } catch (error) {
    console.error("[systemNotificationService] Échec notification Electron", error);
  }
  return false;
};

const showViaBrowserAPI = async (payload: DesktopNotificationPayload): Promise<boolean> => {
  if (!hasWindow || typeof Notification === "undefined") {
    return false;
  }

  const permission = Notification.permission;
  if (permission === "granted") {
    new Notification(payload.title, {
      body: payload.body,
      tag: payload.tag,
    });
    return true;
  }

  if (permission !== "denied" && Notification.requestPermission) {
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") {
        new Notification(payload.title, {
          body: payload.body,
          tag: payload.tag,
        });
        return true;
      }
    } catch (error) {
      console.error("[systemNotificationService] Permission notification refusée", error);
    }
  }
  return false;
};

export const systemNotificationService = {
  async ensurePermission(): Promise<boolean> {
    if (!hasWindow || typeof Notification === "undefined") {
      return isElectronEnvironment();
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      return result === "granted";
    } catch (error) {
      console.error("[systemNotificationService] Impossible de demander la permission", error);
      return false;
    }
  },

  async show(payload: DesktopNotificationPayload): Promise<boolean> {
    const viaElectron = await showViaElectron(payload);
    if (viaElectron) {
      return true;
    }
    const viaBrowser = await showViaBrowserAPI(payload);
    return viaBrowser;
  },
};
