import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";

export async function initializeNativeApp() {
  if (!Capacitor.isNativePlatform()) return;

  document.documentElement.classList.add("native-app");
  document.documentElement.dataset.nativePlatform = Capacitor.getPlatform();

  await Promise.allSettled([
    StatusBar.setStyle({ style: Style.Dark }),
    StatusBar.setBackgroundColor({ color: "#f7fbfc" }),
    StatusBar.setOverlaysWebView({ overlay: false }),
    Keyboard.setResizeMode({ mode: KeyboardResize.Native }),
  ]);

  await App.addListener("backButton", async ({ canGoBack }) => {
    const openDialog = document.querySelector('[role="dialog"][data-state="open"]');
    if (openDialog) {
      const closeButton = openDialog.querySelector<HTMLButtonElement>(
        'button[aria-label^="关闭"], button[title="关闭"], [data-dialog-close]',
      );
      if (closeButton) {
        closeButton.click();
      } else {
        openDialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      }
      return;
    }
    if (canGoBack || window.history.length > 1) {
      window.history.back();
      return;
    }
    await App.exitApp();
  });

  await SplashScreen.hide();
}
