import { useEffect } from "react";
import { Smartphone } from "lucide-react";
import styles from "./OrientationBlocker.module.css";

export const OrientationBlocker = () => {
  useEffect(() => {
    try {
      if (screen.orientation && "lock" in screen.orientation) {
        // Attempt to lock to portrait mode
        // Note: this method may not be available on all devices or may require fullscreen
        const lockPromise = (screen.orientation as any).lock("portrait");
        if (lockPromise && typeof lockPromise.catch === "function") {
          lockPromise.catch(() => {
            // Silently catch errors if the lock is not allowed
          });
        }
      }
    } catch (e) {
      // Ignore any other synchronous errors
    }
  }, []);

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <Smartphone size={64} className={styles.icon} strokeWidth={1.5} />
        <h2 className={styles.title}>Please rotate your device</h2>
        <p className={styles.description}>
          For the best experience, this app is designed to be used in portrait
          mode.
        </p>
      </div>
    </div>
  );
};