import React, { useState, useEffect } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Skeleton } from "./Skeleton";
import { EGG_TYPES_LIST } from "../helpers/eggConfig";
import { useSaveLeftovers, useLastCompletedTallies } from "../helpers/useSessionApi";
import type { EggType } from "../helpers/schema";
import styles from "./LeftoverEntry.module.css";

interface LeftoverEntryProps {
  sessionId: string;
  className?: string;
  onComplete: () => void;
  initialRepackedCounts?: Partial<Record<EggType, number>>;
  initialDamagedCounts?: Partial<Record<EggType, number>>;
  initialCombinedCount?: number;
  onCancel?: () => void;
}

export const LeftoverEntry = ({
  sessionId,
  className,
  onComplete,
  initialRepackedCounts,
  initialDamagedCounts,
  initialCombinedCount,
  onCancel,
}: LeftoverEntryProps) => {
  const isEditMode =
    initialRepackedCounts !== undefined ||
    initialDamagedCounts !== undefined ||
    initialCombinedCount !== undefined;

  const [step, setStep] = useState<0 | 1 | 2>(isEditMode ? 1 : 0);
  const lastTalliesQuery = useLastCompletedTallies();

  useEffect(() => {
    if (step === 0 && lastTalliesQuery.isSuccess && lastTalliesQuery.data && !lastTalliesQuery.data.found) {
      setStep(1);
    }
  }, [step, lastTalliesQuery.isSuccess, lastTalliesQuery.data]);
  const [repackedCounts, setRepackedCounts] = useState<Partial<Record<EggType, string>>>(() => {
    const res: Partial<Record<EggType, string>> = {};
    if (initialRepackedCounts) {
      for (const [key, val] of Object.entries(initialRepackedCounts)) {
        res[key as EggType] = val !== undefined && val !== null ? val.toString() : "";
      }
    }
    return res;
  });
  const [damagedCounts, setDamagedCounts] = useState<Partial<Record<EggType, string>>>(() => {
    const res: Partial<Record<EggType, string>> = {};
    if (initialDamagedCounts) {
      for (const [key, val] of Object.entries(initialDamagedCounts)) {
        res[key as EggType] = val !== undefined && val !== null ? val.toString() : "";
      }
    }
    return res;
  });
  const [combinedCount, setCombinedCount] = useState<string>(
    initialCombinedCount !== undefined && initialCombinedCount !== null
      ? initialCombinedCount.toString()
      : ""
  );

  const saveLeftovers = useSaveLeftovers();

  const getNum = (val: string | undefined, max?: number): number => {
    const num = parseInt(val || "0", 10);
    const parsed = isNaN(num) || num < 0 ? 0 : num;
    return max !== undefined ? Math.min(parsed, max) : parsed;
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleSkip = () => {
    if (onCancel) {
      onCancel();
    } else {
      onComplete();
    }
  };

  const handleConfirm = () => {
    const leftoversPayload = EGG_TYPES_LIST.map((type) => ({
      eggType: type.id,
      repackedCount: getNum(repackedCounts[type.id], type.size - 1),
      damagedCount: getNum(damagedCounts[type.id], type.size - 1),
    }));

    saveLeftovers.mutate(
      {
        sessionId,
        leftovers: leftoversPayload,
                combinedLargeRepacked: Math.min(getNum(combinedCount), 11),
      },
      {
        onSuccess: () => {
          onComplete();
        },
      }
    );
  };

  const activeLeftovers = EGG_TYPES_LIST.filter(
    (type) => getNum(repackedCounts[type.id], type.size - 1) > 0 || getNum(damagedCounts[type.id], type.size - 1) > 0
  );
  const hasCombined = getNum(combinedCount) > 0;
  const hasAnyLeftovers = activeLeftovers.length > 0 || hasCombined;

  const handleEditPrevious = () => {
    const data = lastTalliesQuery.data;
    if (data?.found) {
      const newRepacked: Partial<Record<EggType, string>> = {};
      const newDamaged: Partial<Record<EggType, string>> = {};
      for (const type of EGG_TYPES_LIST) {
        const tally = data.tallies[type.id];
        if (tally.repacked > 0) newRepacked[type.id] = String(Math.min(tally.repacked, type.size - 1));
        if (tally.damaged > 0) newDamaged[type.id] = String(Math.min(tally.damaged, type.size - 1));
      }
      setRepackedCounts(newRepacked);
      setDamagedCounts(newDamaged);
      setCombinedCount(String(Math.min(data.combinedLargeWhiteRepacked, 11)));
    }
    setStep(1);
  };

  const handleUsePrevious = () => {
    const data = lastTalliesQuery.data;
    if (!data?.found) return;
    const leftoversPayload = EGG_TYPES_LIST.map((type) => {
      const tally = data.tallies[type.id];
      return {
        eggType: type.id,
        repackedCount: Math.min(tally.repacked, type.size - 1),
        damagedCount: Math.min(tally.damaged, type.size - 1),
      };
    });

    saveLeftovers.mutate(
      {
        sessionId,
        leftovers: leftoversPayload,
        combinedLargeRepacked: Math.min(data.combinedLargeWhiteRepacked, 11),
      },
      {
        onSuccess: () => {
          onComplete();
        },
      }
    );
  };

  if (step === 0) {
    if (lastTalliesQuery.isPending) {
      return (
        <div className={`${styles.container} ${className || ""}`}>
          <div className={styles.header}>
            <Skeleton style={{ width: "250px", height: "2rem" }} />
            <Skeleton style={{ width: "200px", height: "1.25rem" }} />
          </div>
          <div className={styles.summaryList}>
            <Skeleton style={{ height: "4.5rem" }} />
            <Skeleton style={{ height: "4.5rem" }} />
          </div>
        </div>
      );
    }

    if (lastTalliesQuery.isSuccess && lastTalliesQuery.data.found) {
      const data = lastTalliesQuery.data;
      const activePreviousLeftovers = EGG_TYPES_LIST.filter(
        (type) => data.tallies[type.id].repacked > 0 || data.tallies[type.id].damaged > 0
      );
      const hasPreviousCombined = data.combinedLargeWhiteRepacked > 0;
      const hasAnyPrevious = activePreviousLeftovers.length > 0 || hasPreviousCombined;

      return (
        <div className={`${styles.container} ${className || ""}`}>
          <div className={styles.header}>
            <h2 className={styles.title}>Leftovers from Last Session</h2>
            <p className={styles.subtitle}>Are these numbers correct?</p>
            <p className={styles.completedAt}>
              Session completed:{" "}
              {new Intl.DateTimeFormat(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(data.completedAt))}
            </p>
          </div>

          <div className={styles.summaryList}>
            {activePreviousLeftovers.map((type) => {
              const repacked = Math.min(data.tallies[type.id].repacked, type.size - 1);
              const damaged = Math.min(data.tallies[type.id].damaged, type.size - 1);
              return (
                <div key={type.id} className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>{type.name}</span>
                  <div className={styles.summaryCounts}>
                    <span className={styles.summaryCountGroup}>
                      <span className={styles.summaryCountLabel}>Repacked</span>
                                          <span className={styles.summaryCount}>({repacked})</span>
                    </span>
                    <span className={styles.summaryCountGroup}>
                      <span className={styles.summaryCountLabel}>Damaged</span>
                      <span className={`${styles.summaryCount} ${styles.summaryCountDamaged}`}>({damaged})</span>
                    </span>
                  </div>
                </div>
              );
            })}
            {hasPreviousCombined && (
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Combined Large White</span>
                <div className={styles.summaryCounts}>
                  <span className={styles.summaryCountGroup}>
                    <span className={styles.summaryCountLabel}>Repacked</span>
                                        <span className={styles.summaryCount}>({Math.min(data.combinedLargeWhiteRepacked, 11)})</span>
                  </span>
                </div>
              </div>
            )}
            {!hasAnyPrevious && (
              <div className={styles.emptySummary}>No leftovers from last session.</div>
            )}
          </div>

          <div className={styles.actionsStacked}>
            <Button
              className={styles.btn}
              onClick={handleUsePrevious}
              disabled={saveLeftovers.isPending}
            >
              {saveLeftovers.isPending ? "Saving..." : "Yes, Use These"}
            </Button>
            <Button
              variant="outline"
              className={styles.btn}
              onClick={handleEditPrevious}
              disabled={saveLeftovers.isPending}
            >
              No, Let Me Edit
            </Button>
            <Button
              variant="ghost"
              className={styles.btn}
              onClick={handleSkip}
              disabled={saveLeftovers.isPending}
            >
              No Leftovers
            </Button>
          </div>
        </div>
      );
    }
    return null;
  }

  if (step === 2) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>Are these numbers correct?</h2>
          <p className={styles.subtitle}>
            Confirm your leftover counts before {isEditMode ? "saving" : "starting"}.
          </p>
        </div>

        <div className={styles.summaryList}>
          {activeLeftovers.map((type) => {
            const repacked = getNum(repackedCounts[type.id], type.size - 1);
            const damaged = getNum(damagedCounts[type.id], type.size - 1);
            return (
              <div key={type.id} className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{type.name}</span>
                <div className={styles.summaryCounts}>
                  <span className={styles.summaryCountGroup}>
                    <span className={styles.summaryCountLabel}>Repacked</span>
                    <span className={styles.summaryCount}>{repacked}</span>
                  </span>
                  <span className={styles.summaryCountGroup}>
                    <span className={styles.summaryCountLabel}>Damaged</span>
                    <span className={`${styles.summaryCount} ${styles.summaryCountDamaged}`}>{damaged}</span>
                  </span>
                </div>
              </div>
            );
          })}
          {hasCombined && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Combined Large White</span>
              <div className={styles.summaryCounts}>
                <span className={styles.summaryCountGroup}>
                  <span className={styles.summaryCountLabel}>Repacked</span>
                  <span className={styles.summaryCount}>{getNum(combinedCount)}</span>
                </span>
              </div>
            </div>
          )}
          {!hasAnyLeftovers && (
            <div className={styles.emptySummary}>No leftovers entered.</div>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            variant="outline"
            className={styles.btn}
            onClick={() => setStep(1)}
            disabled={saveLeftovers.isPending}
          >
            Go Back
          </Button>
          <Button
            className={styles.btn}
            onClick={handleConfirm}
            disabled={saveLeftovers.isPending}
          >
            {saveLeftovers.isPending ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{isEditMode ? "Edit Leftovers" : "Leftover Eggs"}</h2>
        <p className={styles.subtitle}>
          {isEditMode
            ? "Update your leftover counts."
            : "How many eggs are leftover from the last session?"}
        </p>
      </div>

      <div className={styles.form}>
        <div className={styles.columnHeaders}>
          <span className={styles.columnHeaderLabel} />
          <div className={styles.columnHeaderInputs}>
            <span className={styles.columnHeader}>Repacked</span>
            <span className={styles.columnHeader}>Damaged</span>
          </div>
        </div>

        {EGG_TYPES_LIST.map((type) => (
          <div key={type.id} className={styles.row}>
            <div className={styles.labelContainer}>
              <span className={styles.label}>{type.name}</span>
            </div>
            <div className={styles.inputGroup}>
              <Input
                type="number"
                min="0"
                max={type.size - 1}
                placeholder="0"
                className={styles.input}
                value={repackedCounts[type.id] || ""}
                onChange={(e) =>
                  setRepackedCounts((prev) => ({ ...prev, [type.id]: e.target.value }))
                }
              />
              <Input
                type="number"
                min="0"
                max={type.size - 1}
                placeholder="0"
                className={`${styles.input} ${styles.inputDamaged}`}
                value={damagedCounts[type.id] || ""}
                onChange={(e) =>
                  setDamagedCounts((prev) => ({ ...prev, [type.id]: e.target.value }))
                }
              />
            </div>
          </div>
        ))}

        <div className={styles.row}>
          <div className={styles.labelContainer}>
            <span className={styles.label}>Combined Large White</span>
            <span className={styles.info}>
              For combined large white and large white flat repacks
            </span>
          </div>
          <div className={styles.inputGroup}>
            <Input
              type="number"
              min="0"
              placeholder="0"
                            className={styles.input}
              max={11}
              value={combinedCount}
              onChange={(e) => setCombinedCount(e.target.value)}
            />
            <div className={styles.inputPlaceholder} />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" className={styles.btn} onClick={handleSkip}>
          {isEditMode ? "Cancel" : "Skip"}
        </Button>
        <Button className={styles.btn} onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
};