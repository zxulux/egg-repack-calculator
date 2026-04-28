import { z } from "zod";
import superjson from "superjson";
import { EggType } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type LastCompletedTalliesResult = {
  found: true;
  tallies: Record<EggType, { repacked: number; damaged: number }>;
  combinedLargeWhiteRepacked: number;
  completedAt: Date;
} | {
  found: false;
};

export type OutputType = LastCompletedTalliesResult;

export const getSessionLastCompletedTalliesGet = async (init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/session/lastCompletedTallies`, {
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