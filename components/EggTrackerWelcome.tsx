import React from "react";
import { Egg } from "lucide-react";
import { Button } from "./Button";
import { useStartSession } from "../helpers/useSessionApi";
import type { Sessions } from "../helpers/schema";
import type { Selectable } from "kysely";
import styles from "./EggTrackerWelcome.module.css";

interface Props {
  onSessionStart: (sessionId: string) => void;
  latestSession: Selectable<Sessions> | null;
  isLoading: boolean;
}

export const EggTrackerWelcome = ({
  onSessionStart,
  latestSession,
  isLoading,
}: Props) => {
  const startSession = useStartSession();

  const handleStartNew = () => {
    startSession.mutate(undefined, {
      onSuccess: (data) => {
        onSessionStart(data.id);
      },
    });
  };

  const handleResume = () => {
    if (latestSession && !latestSession.isComplete) {
      onSessionStart(latestSession.id);
    }
  };

  const canResume = latestSession && !latestSession.isComplete;

  return (
    <div className={styles.welcomeContainer}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Egg className={styles.icon} strokeWidth={1.5} />
        </div>
                <h1 className={styles.title}>Egg Repack Calculator</h1>
        <p className={styles.subtitle}>by Matt M</p>
      </div>

      <div className={styles.actions}>
        <Button
          size="lg"
          className={styles.actionButton}
          onClick={handleStartNew}
          disabled={startSession.isPending || isLoading}
        >
          {startSession.isPending ? "Starting..." : "Start New Session"}
        </Button>

        <Button
          size="lg"
          variant="secondary"
          className={styles.actionButton}
          onClick={handleResume}
          disabled={!canResume || isLoading}
        >
          Resume Last Session
        </Button>
      </div>

      {latestSession && latestSession.isComplete && (
        <p className={styles.statusText}>
          Last session was completed. Start a new one.
        </p>
      )}
    </div>
  );
};