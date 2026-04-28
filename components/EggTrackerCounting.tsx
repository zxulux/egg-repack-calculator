import React, { useState, useEffect, useRef } from "react";
import { Check, AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./Dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./Sheet";
import {
  useAddEntry,
  useUndoEntry,
  useCompleteSession,
} from "../helpers/useSessionApi";
import { EGG_TYPES_LIST, EGG_TYPE_CONFIG } from "../helpers/eggConfig";
import { LeftoverEntry } from "./LeftoverEntry";
import type { OutputType as SessionData } from "../endpoints/session/get_GET.schema";
import type { Selectable } from "kysely";
import type { Entries, Adjustments, EggType } from "../helpers/schema";
import styles from "./EggTrackerCounting.module.css";

interface Props {
  sessionData: SessionData;
}

type RecentEntryItem =
  | { kind: "entry"; createdAt: Date; data: Selectable<Entries> }
  | { kind: "adjustment"; createdAt: Date; data: Selectable<Adjustments> }
  | { kind: "leftover"; createdAt: Date; data: Selectable<Adjustments>[]; combinedCount: number };

export const EggTrackerCounting = ({ sessionData }: Props) => {
  const [selectedType, setSelectedType] = useState<EggType | null>(null);
  const [selectedDamaged, setSelectedDamaged] = useState<number | null>(null);
  const [missingEggsCount, setMissingEggsCount] = useState<number>(0);
  const [isMissingPickerOpen, setIsMissingPickerOpen] = useState(false);
  const [selectedUndoId, setSelectedUndoId] = useState<string | null>(null);
  const [isAllEntriesSheetOpen, setIsAllEntriesSheetOpen] = useState(false);
  const [isLeftoverEditOpen, setIsLeftoverEditOpen] = useState(false);

  const addEntry = useAddEntry();
  const undoEntry = useUndoEntry();
  const completeSession = useCompleteSession();

    const entrySectionRef = useRef<HTMLElement>(null);
    const prevLastEntryIdRef = useRef<string | null | undefined>(undefined);

  const handleTypeSelect = (typeId: EggType) => {
    setSelectedType(typeId);
    setSelectedDamaged(null);
    setMissingEggsCount(0);
    setIsMissingPickerOpen(false);

    // Scroll to bottom after the entry section renders
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  const handleComplete = () => {
    if (window.confirm("Are you sure you want to complete this counting session?")) {
      completeSession.mutate({ sessionId: sessionData.session.id });
    }
  };

  const handleSubmitEntry = () => {
    if (!selectedType || selectedDamaged === null) return;

    addEntry.mutate(
      {
        sessionId: sessionData.session.id,
        eggType: selectedType,
        eggsDamaged: selectedDamaged,
        missingEggs: missingEggsCount,
      },
      {
              onSuccess: () => {
                    setSelectedDamaged(null);
          setMissingEggsCount(0);
          setIsMissingPickerOpen(false);
        },
      }
    );
  };

  const handleMissingSelect = (count: number) => {
    setMissingEggsCount(count);
    setIsMissingPickerOpen(false);
  };

  const activeConfig = selectedType ? EGG_TYPE_CONFIG[selectedType] : null;

  // Merge entries and adjustments into a single recent list
  const nonLeftoverAdjustments = sessionData.adjustments.filter(a => !a.isLeftover);
  const leftoverAdjustments = sessionData.adjustments.filter(a => a.isLeftover);

  const allItems: RecentEntryItem[] = [
    ...sessionData.entries.map((e) => ({
      kind: "entry" as const,
      createdAt: new Date(e.createdAt),
      data: e,
    })),
    ...nonLeftoverAdjustments.map((a) => ({
      kind: "adjustment" as const,
      createdAt: new Date(a.createdAt),
      data: a,
    })),
  ];

  if (leftoverAdjustments.length > 0 || sessionData.session.leftoverCombinedLargeRepacked > 0) {
    const earliestDate = leftoverAdjustments.length > 0 
      ? new Date(Math.min(...leftoverAdjustments.map(a => new Date(a.createdAt).getTime())))
      : new Date(sessionData.session.createdAt);
    
    allItems.push({
      kind: "leftover",
      createdAt: earliestDate,
      data: leftoverAdjustments,
      combinedCount: sessionData.session.leftoverCombinedLargeRepacked
    });
  }

  allItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const recentItems = allItems.slice(0, 3);

  const formatTime = (dateStr: string | Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(dateStr));
  };

    // Scroll to bottom when a new "last entry" appears for the selected type
  const lastEntryForSelectedType = selectedType
    ? sessionData.entries
        .filter((e) => e.eggType === selectedType)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  useEffect(() => {
    const currentId = lastEntryForSelectedType?.id ?? null;
    if (prevLastEntryIdRef.current !== undefined && currentId !== null && currentId !== prevLastEntryIdRef.current) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
    prevLastEntryIdRef.current = currentId;
  }, [lastEntryForSelectedType?.id]);

  // Compute max allowed damaged for current type (considering missing eggs selected)
  const maxDamagedForType = activeConfig
    ? activeConfig.size - missingEggsCount
    : 0;

  // Determine if the current selectedDamaged becomes invalid after a missing eggs change
  useEffect(() => {
    if (selectedDamaged !== null && selectedDamaged > maxDamagedForType) {
      setSelectedDamaged(null);
    }
  }, [missingEggsCount, maxDamagedForType, selectedDamaged]);

  const renderItem = (item: RecentEntryItem) => {
    if (item.kind === "leftover") {
      return (
        <div
          key="leftover-group"
          className={`${styles.recentItem} ${styles.recentItemLeftover} ${styles.recentItemClickable}`}
          onClick={() => setIsLeftoverEditOpen(true)}
        >
          <div className={styles.recentTime}>
            {formatTime(item.createdAt)}
          </div>
          <div className={styles.recentType}>
            Leftovers
            <span className={styles.leftoverBadge}>Leftover</span>
          </div>
          <div className={styles.recentTallyLeftover}>
            {item.data.map(adj => {
              if (adj.repackedDelta === 0 && adj.damagedDelta === 0) return null;
              return (
                <div key={adj.id} className={styles.leftoverSummaryRow}>
                  <span className={styles.leftoverSummaryType}>{EGG_TYPE_CONFIG[adj.eggType]?.name}:</span>
                  {adj.repackedDelta > 0 && <span>+{adj.repackedDelta} R</span>}
                  {adj.damagedDelta > 0 && <span className={styles.damagedText}>+{adj.damagedDelta} D</span>}
                </div>
              );
            })}
            {item.combinedCount > 0 && (
              <div className={styles.leftoverSummaryRow}>
                <span className={styles.leftoverSummaryType}>Combined LW:</span>
                <span>+{item.combinedCount} R</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    const isEntry = item.kind === "entry";
    const id = item.data.id;
    const isSelected = selectedUndoId === id;

    const handleItemClick = () => {
      if (!isSelected) setSelectedUndoId(id);
    };

    const handleCancel = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedUndoId(null);
    };

    const handleConfirm = (e: React.MouseEvent) => {
      e.stopPropagation();
      undoEntry.mutate({
        sessionId: sessionData.session.id,
        ...(isEntry ? { entryId: id } : { adjustmentId: id })
      }, {
        onSuccess: () => {
          setSelectedUndoId(null);
        }
      });
    };

    if (isSelected) {
      return (
        <div key={`${item.kind}-${id}`} className={`${styles.recentItem} ${styles.undoPromptItem}`}>
          <span className={styles.undoPromptText}>Undo this entry?</span>
          <div className={styles.undoPromptActions}>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={undoEntry.isPending}>
              Keep
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirm} disabled={undoEntry.isPending}>
              Undo
            </Button>
          </div>
        </div>
      );
    }

    if (isEntry) {
      const entry = item.data as Selectable<Entries>;
      return (
        <div key={`entry-${entry.id}`} className={`${styles.recentItem} ${styles.recentItemClickable}`} onClick={handleItemClick}>
          <div className={styles.recentTime}>
            {formatTime(entry.createdAt)}
          </div>
          <div className={styles.recentType}>
            {EGG_TYPE_CONFIG[entry.eggType]?.name}
          </div>
          <div className={styles.recentTally}>
            {entry.eggsRepacked > 0 && (
              <span>+{entry.eggsRepacked} Repacked</span>
            )}
            {entry.eggsDamaged > 0 && (
              <span className={styles.damagedText}>
                +{entry.eggsDamaged} Damaged
              </span>
            )}
          </div>
        </div>
      );
    } else {
      const adj = item.data as Selectable<Adjustments>;
      return (
        <div
          key={`adj-${adj.id}`}
          className={`${styles.recentItem} ${styles.recentItemAdjust} ${styles.recentItemClickable}`}
          onClick={handleItemClick}
        >
          <div className={styles.recentTime}>
            {formatTime(adj.createdAt)}
          </div>
          <div className={styles.recentType}>
            {EGG_TYPE_CONFIG[adj.eggType]?.name}
            <span className={styles.adjustBadge}>Adjust</span>
          </div>
          <div className={styles.recentTally}>
            {adj.repackedDelta !== 0 && (
              <span
                className={
                  adj.repackedDelta < 0 ? styles.damagedText : ""
                }
              >
                {adj.repackedDelta > 0 ? "+" : ""}
                {adj.repackedDelta} Repacked
              </span>
            )}
            {adj.damagedDelta !== 0 && (
              <span className={styles.damagedText}>
                {adj.damagedDelta > 0 ? "+" : ""}
                {adj.damagedDelta} Damaged
              </span>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className={styles.countingContainer}>
      <header className={styles.header}>
        <div className={styles.sessionInfo}>
          <span className={styles.sessionLabel}>Session Active</span>
          <span className={styles.sessionId}>
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).format(new Date(sessionData.session.createdAt))}
          </span>
        </div>
        <div className={styles.headerActions}>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className={styles.helpBtn}>
                ?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Instructions</DialogTitle>
              </DialogHeader>
              <ol className={styles.instructionList}>
                <li>Enter leftover eggs from last session (see egg tracking sheet)</li>
                <li>Select type of egg to repack</li>
                <li>Enter missing eggs, if any</li>
                <li>Repack eggs into appropriate cartons</li>
                <li>Enter number of damaged eggs left</li>
                <li>Repeat steps 2-5 until all eggs repacked</li>
                <li>Press complete (at top)</li>
                <li>Record repacked, damaged, and leftover on egg tracking sheet</li>
                <li>Put repacked eggs shelf for sale</li>
                <li>Dispose of damaged eggs</li>
              </ol>
              <p className={styles.instructionNote}>
                <strong>Note:</strong> Repacks must have an expiry date. Use the earliest date from cartons repacked.
              </p>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            onClick={handleComplete}
            className={styles.completeBtn}
            disabled={completeSession.isPending}
          >
            <Check size={18} /> Complete
          </Button>
        </div>
      </header>

      <section className={styles.typeSelection}>
        <h2 className={styles.sectionTitle}>Select Egg Type</h2>
        <div className={styles.grid}>
          {EGG_TYPES_LIST.map((config) => {
            const isSelected = selectedType === config.id;
            const tallies = sessionData.tallies[config.id];

            return (
              <button
                key={config.id}
                className={`${styles.typeCard} ${
                  isSelected ? styles.typeCardSelected : ""
                }`}
                style={
                  {
                    "--card-color": config.colorVar,
                  } as React.CSSProperties
                }
                onClick={() => handleTypeSelect(config.id)}
              >
                <span className={styles.cardTitle}>{config.name}</span>
                <div className={styles.cardTallies}>
                  <Badge variant="outline" className={styles.tallyBadge}>
                    <span className={styles.tallyLabel}>
                      Repacked: {tallies.repacked}
                    </span>
                  </Badge>
                  <Badge variant="destructive" className={styles.tallyBadge}>
                    <span className={styles.tallyLabel}>
                      Damaged: {tallies.damaged}
                    </span>
                  </Badge>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.recentSection}>
        <h2 className={styles.sectionTitle}>Recent Entries</h2>
        {allItems.length === 0 ? (
          <p className={styles.emptyText}>No entries yet</p>
        ) : (
          <>
            <div className={styles.recentList}>
              {recentItems.map(renderItem)}
            </div>
            {allItems.length > 3 && (
              <Button
                variant="outline"
                className={styles.viewAllBtn}
                onClick={() => setIsAllEntriesSheetOpen(true)}
              >
                View All Entries ({allItems.length})
              </Button>
            )}
          </>
        )}
      </section>

      {activeConfig && (
        <section className={styles.entrySection} ref={entrySectionRef}>
          <div className={styles.entryHeader}>
            <h3 className={styles.entryTitle}>{activeConfig.name} Entry</h3>
            <div className={styles.missingEggsControl}>
              {missingEggsCount > 0 && (
                <span className={styles.missingEggsBadge}>
                  Missing: {missingEggsCount}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMissingPickerOpen((v) => !v)}
                className={styles.missingBtn}
              >
                <AlertTriangle size={14} />
                Missing Eggs
              </Button>
            </div>
          </div>

          {isMissingPickerOpen && (
            <div className={styles.missingPickerPanel}>
              <p className={styles.missingPickerLabel}>
                How many eggs are missing from the carton?
              </p>
              <div className={styles.missingPickerGrid}>
                {Array.from(
                  { length: activeConfig.size },
                  (_, i) => i + 1
                ).map((n) => (
                  <button
                    key={n}
                    className={`${styles.missingPickerBtn} ${
                      missingEggsCount === n ? styles.missingPickerBtnSelected : ""
                    }`}
                    onClick={() => handleMissingSelect(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {missingEggsCount > 0 && (
                <button
                  className={styles.clearMissingBtn}
                  onClick={() => {
                    setMissingEggsCount(0);
                    setIsMissingPickerOpen(false);
                  }}
                >
                  Clear (set to 0)
                </button>
              )}
            </div>
          )}

          <p className={styles.promptText}>
            How many damaged eggs left after repacking?
          </p>

          <div
            className={`${styles.numberGrid} ${
              activeConfig.size > 12 ? styles.numberGridLarge : ""
            }`}
          >
            {Array.from({ length: activeConfig.size + 1 }, (_, i) => i).map(
              (n) => {
                const isDisabled = n > maxDamagedForType;
                return (
                  <button
                    key={n}
                    className={`${styles.numberBtn} ${
                      selectedDamaged === n ? styles.numberBtnSelected : ""
                    } ${isDisabled ? styles.numberBtnDisabled : ""}`}
                    onClick={() => {
                      if (!isDisabled) setSelectedDamaged(n);
                    }}
                    disabled={isDisabled}
                  >
                    {n}
                  </button>
                );
              }
            )}
          </div>

                              <p className={styles.lastEntryHint}>
            {(() => {
              const lastEntryForType = sessionData.entries
                .filter((e) => e.eggType === selectedType)
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
              if (!lastEntryForType) return "\u00A0";
              return `Last: +${lastEntryForType.eggsRepacked} Repacked, +${lastEntryForType.eggsDamaged} Damaged`;
            })()}
          </p>

          <Button
            size="lg"
            className={styles.submitBtn}
            disabled={selectedDamaged === null || addEntry.isPending}
            onClick={handleSubmitEntry}
          >
            {addEntry.isPending
              ? "Adding..."
              : selectedDamaged !== null
              ? `Add: ${activeConfig.size - selectedDamaged - missingEggsCount} Repacked, ${selectedDamaged + missingEggsCount} Damaged`
              : "Select damaged count"}
          </Button>
        </section>
      )}

      <Sheet open={isAllEntriesSheetOpen} onOpenChange={setIsAllEntriesSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>All Entries</SheetTitle>
            <SheetDescription>
              Tap any entry to undo it.
            </SheetDescription>
          </SheetHeader>
          <div className={styles.sheetContent}>
            {allItems.map(renderItem)}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isLeftoverEditOpen} onOpenChange={setIsLeftoverEditOpen}>
        <SheetContent side="bottom" style={{ height: "auto", maxHeight: "90vh" }}>
          <div style={{ padding: "1.5rem" }}>
            <LeftoverEntry
              sessionId={sessionData.session.id}
              initialRepackedCounts={Object.fromEntries(
                sessionData.adjustments.filter((a) => a.isLeftover).map((a) => [a.eggType, a.repackedDelta])
              )}
              initialDamagedCounts={Object.fromEntries(
                sessionData.adjustments.filter((a) => a.isLeftover).map((a) => [a.eggType, a.damagedDelta])
              )}
              initialCombinedCount={sessionData.session.leftoverCombinedLargeRepacked}
              onComplete={() => setIsLeftoverEditOpen(false)}
              onCancel={() => setIsLeftoverEditOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};