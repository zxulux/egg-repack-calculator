import React, { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { EGG_TYPES_LIST } from "../helpers/eggConfig";
import { useSaveLeftovers } from "../helpers/useSessionApi";
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

  const [step, setStep] = useState<1 | 2>(1);
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