import { schema, OutputType } from "./complete_POST.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const json = superjson.parse(await request.text());
    const validated = schema.parse(json);

    const updatedSession = await db
      .updateTable("sessions")
      .set({
        isComplete: true,
        completedAt: new Date(),
      })
      .where("id", "=", validated.sessionId)
      .returningAll()
      .executeTakeFirstOrThrow();

    return new Response(superjson.stringify(updatedSession satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}