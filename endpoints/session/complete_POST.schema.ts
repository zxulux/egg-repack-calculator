import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Sessions } from "../../helpers/schema";

export const schema = z.object({
  sessionId: z.string().uuid(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Sessions>;

export const postSessionComplete = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/session/complete`, {
    method: "POST",
    body: superjson.stringify(body),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};