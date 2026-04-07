import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Sessions, Entries, Adjustments, EggType } from "../../helpers/schema";

export const schema = z.object({
  sessionId: z.string().uuid(),
});

export type InputType = z.infer<typeof schema>;

export type ComputedTally = {
  repacked: number;
  rawRepacked: number;
  damaged: number;
  repackedCartons: number;
  damagedCartons: number;
};

export type ComputedTallies = Record<EggType, ComputedTally>;

export type OutputType = {
  session: Selectable<Sessions>;
  entries: Selectable<Entries>[];
  adjustments: Selectable<Adjustments>[];
  tallies: ComputedTallies;
  combinedLargeWhiteRepacked: number;
};

export const getSessionGet = async (query: InputType, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(query);
  const params = new URLSearchParams({ sessionId: validated.sessionId });

  const result = await fetch(`/_api/session/get?${params.toString()}`, {
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