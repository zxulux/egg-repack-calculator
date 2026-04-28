import { OutputType } from "./lastCompletedTallies_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { EggTypeArrayValues, EggType } from "../../helpers/schema";

const CARTON_SIZE: Record<EggType, number> = {
  extra_large_white: 12,
  large_white: 12,
  large_brown: 12,
  medium_white: 12,
  large_white_flat: 30,
};

const COMBINED_LARGE_WHITE_TYPES = ["large_white", "large_white_flat"] as const;

export async function handle(request: Request) {
  try {
    const session = await db
      .selectFrom("sessions")
      .selectAll()
      .where("isComplete", "=", true)
      .orderBy("completedAt", "desc")
      .limit(1)
      .executeTakeFirst();

    if (!session) {
      return new Response(superjson.stringify({ found: false } satisfies OutputType));
    }

    const entries = await db
      .selectFrom("entries")
      .selectAll()
      .where("sessionId", "=", session.id)
      .execute();

    const adjustments = await db
      .selectFrom("adjustments")
      .selectAll()
      .where("sessionId", "=", session.id)
      .execute();

    // Compute full tallies (repacked + damaged) per egg type
    const totals = {} as Record<EggType, { repacked: number; damaged: number }>;
    for (const t of EggTypeArrayValues) {
      totals[t] = { repacked: 0, damaged: 0 };
    }

    for (const entry of entries) {
      totals[entry.eggType].repacked += entry.eggsRepacked;
      totals[entry.eggType].damaged += entry.eggsDamaged;
    }

    for (const adj of adjustments) {
      totals[adj.eggType].repacked += adj.repackedDelta;
      totals[adj.eggType].damaged += adj.damagedDelta;
    }

    // Compute leftover remainder for each egg type
    const tallies = {} as Record<EggType, { repacked: number; damaged: number }>;
    for (const t of EggTypeArrayValues) {
      tallies[t] = {
        repacked: totals[t].repacked % CARTON_SIZE[t],
        damaged: totals[t].damaged % CARTON_SIZE[t],
      };
    }

    // Compute combinedLargeWhiteRepacked the same way as session/get_GET:
    // Sum entries repacked for large_white and large_white_flat
    let combinedLargeWhiteRepacked = 0;
    for (const entry of entries) {
      if (COMBINED_LARGE_WHITE_TYPES.includes(entry.eggType as typeof COMBINED_LARGE_WHITE_TYPES[number])) {
        combinedLargeWhiteRepacked += entry.eggsRepacked;
      }
    }
    // Add only non-leftover adjustment repackedDeltas for large_white and large_white_flat
    for (const adj of adjustments) {
      if (
        COMBINED_LARGE_WHITE_TYPES.includes(adj.eggType as typeof COMBINED_LARGE_WHITE_TYPES[number]) &&
        !adj.isLeftover
      ) {
        combinedLargeWhiteRepacked += adj.repackedDelta;
      }
    }
    // Add the session's stored leftover combined large repacked
    combinedLargeWhiteRepacked += session.leftoverCombinedLargeRepacked;

    // Return the leftover remainder (mod 12, since combined large white uses 12-egg cartons)
    const combinedLargeWhiteLeftover = combinedLargeWhiteRepacked % 12;

    console.log(
      `[lastCompletedTallies_GET] session ${session.id}: combinedLargeWhiteRepacked=${combinedLargeWhiteRepacked}, leftover=${combinedLargeWhiteLeftover}`
    );

    return new Response(
      superjson.stringify({
        found: true,
        tallies,
        combinedLargeWhiteRepacked: combinedLargeWhiteLeftover,
        completedAt: session.completedAt ?? new Date(),
      } satisfies OutputType)
    );
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}