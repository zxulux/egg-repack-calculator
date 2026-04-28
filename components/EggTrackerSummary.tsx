import React from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "./Button";
import { Separator } from "./Separator";
import { EGG_TYPES_LIST } from "../helpers/eggConfig";
import type { OutputType as SessionData } from "../endpoints/session/get_GET.schema";
import styles from "./EggTrackerSummary.module.css";

interface Props {
  sessionData: SessionData;
  onHome: () => void;
}

export const EggTrackerSummary = ({ sessionData, onHome }: Props) => {
  const totalRepacked = sessionData.entries.reduce((sum, entry) => sum + entry.eggsRepacked, 0) +
    sessionData.adjustments
      .filter((adj) => !adj.isLeftover)
      .reduce((sum, adj) => sum + adj.repackedDelta, 0);

  let rateDisplay = "N/A";
  if (sessionData.session.completedAt && sessionData.session.createdAt) {
    const start = new Date(sessionData.session.createdAt).getTime();
    const end = new Date(sessionData.session.completedAt).getTime();
    const durationMs = end - start;
    const durationMinutes = durationMs / 60000;
    if (durationMinutes > 0) {
      rateDisplay = (totalRepacked / durationMinutes).toFixed(2);
    }
  }

  return (
    <div className={styles.summaryContainer}>
      <header className={styles.header}>
        <div className={styles.iconWrapper}>
          <ClipboardCheck className={styles.icon} strokeWidth={1.5} />
        </div>
        <h2 className={styles.title}>Counting Complete</h2>
                <p className={styles.subtitle}>
          Started: {new Date(sessionData.session.createdAt).toLocaleString()} <br />
          Completed: {sessionData.session.completedAt ? new Date(sessionData.session.completedAt).toLocaleString() : "In progress"}
        </p>
      </header>

      <div className={styles.resultsCard}>
        <div className={styles.tableHeader}>
          <span>Egg Type</span>
          <span className={styles.numericCol}>Repacked (Ctns)</span>
          <span className={styles.numericCol}>Leftover</span>
          <span className={styles.numericCol}>Damaged (Ctns)</span>
          <span className={styles.numericCol}>Leftover</span>
        </div>
        <Separator className={styles.separator} />

        <div className={styles.tableBody}>
          {EGG_TYPES_LIST.map((config) => {
            const tallies = sessionData.tallies[config.id];
            const leftoverRepacked = tallies.repacked % config.size;
            const leftoverDamaged = tallies.damaged % config.size;

            return (
              <div key={config.id} className={styles.tableRow}>
                <div className={styles.typeCol}>
                  <div
                    className={styles.swatch}
                    style={{ backgroundColor: config.colorVar }}
                  />
                  <div className={styles.typeNameBlock}>
                    <span className={styles.typeName}>{config.name}</span>
                  </div>
                </div>

                <div className={styles.numericCol}>
                  <div className={styles.statValueCarton}>{tallies.repackedCartons}</div>
                </div>

                <div className={styles.numericCol}>
                                    <div className={styles.statValue}>({leftoverRepacked})</div>

                </div>

                <div className={styles.numericCol}>
                  <div className={styles.statValueCartonDamaged}>
                    {tallies.damagedCartons}
                  </div>
                </div>
                
                <div className={styles.numericCol}>
                                    <div className={styles.statValueDamaged}>
                    ({leftoverDamaged})
                  </div>
                </div>
              </div>
            );
          })}
                  <Separator className={styles.separator} />
          <div className={styles.combinedLabel}>Combined</div>
          <div className={styles.tableRow} style={{ borderBottom: 'none' }}>
            <div className={styles.typeCol}>
              <div
                className={styles.swatch}
                style={{ backgroundColor: 'var(--info)' }}
              />
              <div className={styles.typeNameBlock}>
                <span className={styles.typeName}>Large White + Large White Flat</span>
              </div>
            </div>
            <div className={styles.numericCol}>
              <div className={styles.statValueCarton}>
                {Math.floor(sessionData.combinedLargeWhiteRepacked / 12)}
              </div>
            </div>
            <div className={styles.numericCol}>
              <div className={styles.statValue}>
                                ({sessionData.combinedLargeWhiteRepacked % 12})
              </div>
            </div>
                        <div className={`${styles.numericCol} ${styles.hiddenCol}`}></div>
            <div className={`${styles.numericCol} ${styles.hiddenCol}`}></div>
          </div>
        </div>
      </div>

      <div className={styles.rateContainer}>
        <div className={styles.rateLabel}>Eggs repacked per minute</div>
        <div className={styles.rateValue}>{rateDisplay}</div>
      </div>

      <div className={styles.actions}>
        <Button size="lg" className={styles.homeBtn} onClick={onHome}>
          Start New Session
        </Button>
      </div>
    </div>
  );
};