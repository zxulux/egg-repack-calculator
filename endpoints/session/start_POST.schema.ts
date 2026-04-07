import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Sessions } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Sessions>;

export const postSessionStart = async (body?: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/session/start`, {
    method: "POST",
    body: superjson.stringify(body || {}),
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