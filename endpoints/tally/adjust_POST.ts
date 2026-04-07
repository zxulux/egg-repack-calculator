import { schema, OutputType } from "./adjust_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";

async function computeCurrentTallies(
  sessionId: string,
  eggType: string
): Promise<{ repacked: number; damaged: number }> {
  const entriesResult = await db
    .selectFrom("entries")
    .select([
      db.fn.sum<number>("eggsRepacked").as("totalRepacked"),
      db.fn.sum<number>("eggsDamaged").as("totalDamaged"),
    ])
    .where("sessionId", "=", sessionId)
        .where("eggType", "=", eggType as any)
    .executeTakeFirst();

  const adjustmentsResult = await db
    .selectFrom("adjustments")
    .select([
      db.fn.sum<number>("repackedDelta").as("totalRepackedDelta"),
      db.fn.sum<number>("damagedDelta").as("totalDamagedDelta"),
    ])
    .where("sessionId", "=", sessionId)
        .where("eggType", "=", eggType as any)
    .executeTakeFirst();

  const repacked =
    Number(entriesResult?.totalRepacked ?? 0) +
    Number(adjustmentsResult?.totalRepackedDelta ?? 0);
  const damaged =
    Number(entriesResult?.totalDamaged ?? 0) +
    Number(adjustmentsResult?.totalDamagedDelta ?? 0);

  return { repacked, damaged };
}

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validated = schema.parse(json);

    const current = await computeCurrentTallies(validated.sessionId, validated.eggType);

    const newRepacked = current.repacked + validated.repackedDelta;
    const newDamaged = current.damaged + validated.damagedDelta;

    if (newRepacked < 0) {
      return new Response(
        superjson.stringify({
          error: `Adjustment would bring repacked count below zero (current: ${current.repacked}, delta: ${validated.repackedDelta}).`,
        }),
        { status: 400 }
      );
    }

    if (newDamaged < 0) {
      return new Response(
        superjson.stringify({
          error: `Adjustment would bring damaged count below zero (current: ${current.damaged}, delta: ${validated.damagedDelta}).`,
        }),
        { status: 400 }
      );
    }

    await db
      .insertInto("adjustments")
      .values({
        id: crypto.randomUUID(),
        sessionId: validated.sessionId,
        eggType: validated.eggType,
        repackedDelta: validated.repackedDelta,
        damagedDelta: validated.damagedDelta,
      })
      .execute();

    console.log(
      `[tally/adjust] sessionId=${validated.sessionId} eggType=${validated.eggType} repackedDelta=${validated.repackedDelta} damagedDelta=${validated.damagedDelta} newRepacked=${newRepacked} newDamaged=${newDamaged}`
    );

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}