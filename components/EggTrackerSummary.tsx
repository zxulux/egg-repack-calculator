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
  

  return (
    <div className={styles.summaryContainer}>
      <header className={styles.header}>
        <div className={styles.iconWrapper}>
          <ClipboardCheck className={styles.icon} strokeWidth={1.5} />
        </div>
        <h2 className={styles.title}>Counting Complete</h2>
        <p className={styles.subtitle}>
          Session ID: {sessionData.session.id.slice(0, 8)}...
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
                  <div className={styles.statValue}>{tallies.repackedCartons}</div>
                </div>

                <div className={styles.numericCol}>
                  <div className={styles.statValue}>{leftoverRepacked}</div>
                </div>

                <div className={styles.numericCol}>
                  <div className={styles.statValueDamaged}>
                    {tallies.damagedCartons}
                  </div>
                </div>
                
                <div className={styles.numericCol}>
                  <div className={styles.statValueDamaged}>
                    {leftoverDamaged}
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
              <div className={styles.statValue}>
                {Math.floor(sessionData.combinedLargeWhiteRepacked / 12)}
              </div>
            </div>
            <div className={styles.numericCol}>
              <div className={styles.statValue}>
                {sessionData.combinedLargeWhiteRepacked % 12}
              </div>
            </div>
            <div className={styles.numericCol}></div>
            <div className={styles.numericCol}></div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button size="lg" className={styles.homeBtn} onClick={onHome}>
          Start New Session
        </Button>
      </div>
    </div>
  );
};