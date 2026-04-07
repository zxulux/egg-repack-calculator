import { schema, OutputType } from "./undo_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validated = schema.parse(json);

    if (validated.adjustmentId) {
      // Delete a specific adjustment, verifying it belongs to the session
      const adjustment = await db
        .selectFrom("adjustments")
        .select("id")
        .where("id", "=", validated.adjustmentId)
        .where("sessionId", "=", validated.sessionId)
        .executeTakeFirst();

      if (!adjustment) {
        return new Response(
          superjson.stringify({ error: "Adjustment not found or does not belong to this session" }),
          { status: 404 }
        );
      }

      await db
        .deleteFrom("adjustments")
        .where("id", "=", validated.adjustmentId)
        .execute();

      console.log(`Deleted adjustment ${validated.adjustmentId} for session ${validated.sessionId}`);
    } else if (validated.entryId) {
      // Delete a specific entry, verifying it belongs to the session
      const entry = await db
        .selectFrom("entries")
        .select("id")
        .where("id", "=", validated.entryId)
        .where("sessionId", "=", validated.sessionId)
        .executeTakeFirst();

      if (!entry) {
        return new Response(
          superjson.stringify({ error: "Entry not found or does not belong to this session" }),
          { status: 404 }
        );
      }

      await db
        .deleteFrom("entries")
        .where("id", "=", validated.entryId)
        .execute();

      console.log(`Deleted entry ${validated.entryId} for session ${validated.sessionId}`);
    } else {
      // Fall back to deleting the most recent entry
      const latest = await db
        .selectFrom("entries")
        .select("id")
        .where("sessionId", "=", validated.sessionId)
        .orderBy("createdAt", "desc")
        .limit(1)
        .executeTakeFirst();

      if (latest) {
        await db
          .deleteFrom("entries")
          .where("id", "=", latest.id)
          .execute();

        console.log(`Deleted most recent entry ${latest.id} for session ${validated.sessionId}`);
      } else {
        console.log(`No entries found to undo for session ${validated.sessionId}`);
      }
    }

    return new Response(superjson.stringify({ success: true } satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}