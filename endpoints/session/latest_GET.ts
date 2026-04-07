import { OutputType } from "./latest_GET.schema";
import superjson from "superjson";
import { db } from "../../helpers/db";

export async function handle(request: Request) {
  try {
    const latestSession = await db
      .selectFrom("sessions")
      .selectAll()
      .orderBy("createdAt", "desc")
      .limit(1)
      .executeTakeFirst();

    return new Response(superjson.stringify((latestSession ?? null) satisfies OutputType));
  } catch (error) {
    return new Response(
      superjson.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400 }
    );
  }
}