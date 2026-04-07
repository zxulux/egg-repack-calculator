import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Sessions } from "../../helpers/schema";

// No input needed for fetching latest
export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

// Can return null if no sessions exist
export type OutputType = Selectable<Sessions> | null;

export const getSessionLatest = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/session/latest`, {
    method: "GET",
    ...init,
    headers: {
      "Accept": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse<{ error: string }>(await result.text());
    throw new Error(errorObject.error);
  }

  return superjson.parse<OutputType>(await result.text());
};