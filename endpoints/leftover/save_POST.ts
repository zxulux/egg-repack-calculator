import { schema, OutputType } from "./save_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validated = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      // 1. Update the combined large repacked count on the session
      await trx
        .updateTable("sessions")
        .set({ leftoverCombinedLargeRepacked: validated.combinedLargeRepacked })
        .where("id", "=", validated.sessionId)
        .execute();

      // 2. Delete existing leftover adjustments for this session to ensure idempotency
      await trx
        .deleteFrom("adjustments")
        .where("sessionId", "=", validated.sessionId)
        .where("isLeftover", "=", true)
        .execute();

      // 3. Insert adjustments for each leftover with repackedCount > 0 OR damagedCount > 0
      const adjustmentsToInsert = validated.leftovers
        .filter((l) => l.repackedCount > 0 || l.damagedCount > 0)
        .map((l) => ({
          id: crypto.randomUUID(),
          sessionId: validated.sessionId,
          eggType: l.eggType,
          repackedDelta: l.repackedCount,
          damagedDelta: l.damagedCount,
          isLeftover: true,
        }));

      if (adjustmentsToInsert.length > 0) {
        await trx.insertInto("adjustments").values(adjustmentsToInsert).execute();
      }
    });

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    console.error("[leftover/save] Error saving leftovers:", error);
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}