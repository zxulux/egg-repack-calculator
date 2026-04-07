import { z } from "zod";
import superjson from "superjson";
import { EggTypeArrayValues } from "../../helpers/schema";

export const schema = z.object({
  sessionId: z.string().uuid(),
  eggType: z.enum(EggTypeArrayValues),
  repackedDelta: z.number().int(),
  damagedDelta: z.number().int(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
};

export const postTallyAdjust = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/tally/adjust`, {
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