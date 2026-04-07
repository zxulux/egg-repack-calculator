import { schema, OutputType, ComputedTallies } from "./get_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";
import { EggTypeArrayValues } from "../../helpers/schema";

export async function handle(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") || "";
    
    const validated = schema.parse({ sessionId });

    const session = await db
      .selectFrom("sessions")
      .selectAll()
      .where("id", "=", validated.sessionId)
      .executeTakeFirst();

    if (!session) {
      throw new Error("Session not found");
    }

    const entries = await db
      .selectFrom("entries")
      .selectAll()
      .where("sessionId", "=", validated.sessionId)
      .orderBy("createdAt", "asc")
      .execute();

    const adjustments = await db
      .selectFrom("adjustments")
      .selectAll()
      .where("sessionId", "=", validated.sessionId)
      .orderBy("createdAt", "asc")
      .execute();

    // Compute tallies
    const tallies = {} as ComputedTallies;
    for (const t of EggTypeArrayValues) {
      tallies[t] = { repacked: 0, rawRepacked: 0, damaged: 0, repackedCartons: 0, damagedCartons: 0 };
    }

    for (const entry of entries) {
      tallies[entry.eggType].damaged += entry.eggsDamaged;
      tallies[entry.eggType].rawRepacked += entry.eggsRepacked;

      tallies[entry.eggType].repacked += entry.eggsRepacked;
    }

    for (const adj of adjustments) {
      tallies[adj.eggType].damaged += adj.damagedDelta;
      tallies[adj.eggType].repacked += adj.repackedDelta;
    }

    // Process cartons
    for (const type of EggTypeArrayValues) {
      const cartonSize = type === "large_white_flat" ? 30 : 12;
      tallies[type].repackedCartons = Math.floor(tallies[type].repacked / cartonSize);
      tallies[type].damagedCartons = Math.floor(tallies[type].damaged / cartonSize);
    }

    // Compute combined large white repacked:
    // Sum entries repacked for large_white and large_white_flat
    const combinedLargeWhiteTypes = ["large_white", "large_white_flat"] as const;

    let combinedLargeWhiteRepacked = 0;
    for (const entry of entries) {
      if (combinedLargeWhiteTypes.includes(entry.eggType as typeof combinedLargeWhiteTypes[number])) {
        combinedLargeWhiteRepacked += entry.eggsRepacked;
      }
    }
    // Add only non-leftover adjustment repackedDeltas for large_white and large_white_flat
    for (const adj of adjustments) {
      if (
        combinedLargeWhiteTypes.includes(adj.eggType as typeof combinedLargeWhiteTypes[number]) &&
        !adj.isLeftover
      ) {
        combinedLargeWhiteRepacked += adj.repackedDelta;
      }
    }
    // Add the session's stored leftover combined large repacked
    combinedLargeWhiteRepacked += session.leftoverCombinedLargeRepacked;

    console.log(`[session/get_GET] combinedLargeWhiteRepacked for session ${session.id}: ${combinedLargeWhiteRepacked}`);

    return new Response(
      superjson.stringify({
        session,
        entries,
        adjustments,
        tallies,
        combinedLargeWhiteRepacked,
      } satisfies OutputType)
    );
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}