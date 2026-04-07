import { schema, OutputType } from "./add_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validated = schema.parse(json);

    const cartonSize = validated.eggType === "large_white_flat" ? 30 : 12;
    const totalDamagedAndMissing = validated.eggsDamaged + validated.missingEggs;
    const eggsRepacked = cartonSize - totalDamagedAndMissing;
    // Store total (damaged + missing) as eggsDamaged in the entries table
    const eggsDamagedStored = totalDamagedAndMissing;

    console.log(
      `Adding entry: type=${validated.eggType}, damaged=${validated.eggsDamaged}, missing=${validated.missingEggs}, repacked=${eggsRepacked}, storedDamaged=${eggsDamagedStored}`
    );

    const newEntry = await db
      .insertInto("entries")
      .values({
        id: crypto.randomUUID(),
        sessionId: validated.sessionId,
        eggType: validated.eggType,
        eggsRepacked,
        eggsDamaged: eggsDamagedStored,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(newEntry satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}