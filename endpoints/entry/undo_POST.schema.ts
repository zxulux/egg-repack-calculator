import { z } from "zod";
import superjson from "superjson";

export const schema = z
  .object({
    sessionId: z.string().uuid(),
    entryId: z.string().uuid().optional(),
    adjustmentId: z.string().uuid().optional(),
  })
  .refine(
    (data) => !(data.entryId && data.adjustmentId),
    { message: "Only one of entryId or adjustmentId can be provided at a time" }
  );

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
};

export const postEntryUndo = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validated = schema.parse(body);
  const result = await fetch(`/_api/entry/undo`, {
    method: "POST",
    body: superjson.stringify(validated),
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