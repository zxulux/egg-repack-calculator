import { z } from "zod";
import superjson from "superjson";
import type { Selectable } from "kysely";
import type { Entries } from "../../helpers/schema";
import { EggTypeArrayValues } from "../../helpers/schema";

export const schema = z
  .object({
    sessionId: z.string().uuid(),
    eggType: z.enum(EggTypeArrayValues),
    eggsDamaged: z.number().int().min(0),
    missingEggs: z.number().int().min(0).default(0),
  })
  .superRefine((data, ctx) => {
    const max = data.eggType === "large_white_flat" ? 30 : 12;
    if (data.eggsDamaged > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: max,
        type: "number",
        inclusive: true,
        message: `Damaged eggs cannot exceed carton size (${max}) for ${data.eggType}`,
      });
    }
    if (data.eggsDamaged + data.missingEggs > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: max,
        type: "number",
        inclusive: true,
        message: `Total of damaged and missing eggs cannot exceed carton size (${max}) for ${data.eggType}`,
      });
    }
  });

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<Entries>;

export const postEntryAdd = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const result = await fetch(`/_api/entry/add`, {
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