import React, { useState } from "react";
import { useLatestSession, useSessionData } from "../helpers/useSessionApi";
import { EggTrackerWelcome } from "../components/EggTrackerWelcome";
import { EggTrackerCounting } from "../components/EggTrackerCounting";
import { EggTrackerSummary } from "../components/EggTrackerSummary";
import { LeftoverEntry } from "../components/LeftoverEntry";
import { Skeleton } from "../components/Skeleton";
import { Helmet } from "react-helmet";
import styles from "./_index.module.css";

export default function EggRepackTracker() {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showLeftoverEntry, setShowLeftoverEntry] = useState(false);

  const { data: latestSession, isLoading: isLatestLoading } = useLatestSession();
  const { data: sessionData, isLoading: isSessionLoading } = useSessionData(
    activeSessionId
  );

  const handleStartSession = (id: string) => {
    if (latestSession?.id === id) {
      setShowLeftoverEntry(false);
    } else {
      setShowLeftoverEntry(true);
    }
    setActiveSessionId(id);
  };

  const handleGoHome = () => {
    setActiveSessionId(null);
    setShowLeftoverEntry(false);
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Egg Repack Tracker</title>
        <meta name="theme-color" content="#2E5C40" />
      </Helmet>

      <main className={styles.main}>
        {!activeSessionId ? (
          <EggTrackerWelcome
            onSessionStart={handleStartSession}
            latestSession={latestSession || null}
            isLoading={isLatestLoading}
          />
        ) : isSessionLoading || !sessionData ? (
          <div className={styles.loadingContainer}>
            <Skeleton className={styles.loadingSkeletonTitle} />
            <Skeleton className={styles.loadingSkeletonCard} />
            <Skeleton className={styles.loadingSkeletonCard} />
          </div>
        ) : sessionData.session.isComplete ? (
          <EggTrackerSummary
            sessionData={sessionData}
            onHome={handleGoHome}
          />
        ) : showLeftoverEntry ? (
          <LeftoverEntry
            sessionId={activeSessionId}
            onComplete={() => setShowLeftoverEntry(false)}
          />
        ) : (
          <EggTrackerCounting
            sessionData={sessionData}
          />
        )}
      </main>
    </div>
  );
}