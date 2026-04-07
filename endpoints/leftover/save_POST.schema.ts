import { z } from "zod";
import superjson from "superjson";
import { EggTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  sessionId: z.string().uuid(),
  leftovers: z.array(
    z.object({
      eggType: z.enum(EggTypeArrayValues),
      repackedCount: z.number().int().min(0),
      damagedCount: z.number().int().min(0),
    })
  ),
  combinedLargeRepacked: z.number().int().min(0),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
};

export const postLeftoverSave = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/leftover/save`, {
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