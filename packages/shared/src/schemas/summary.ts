import { z } from 'zod';
import { yearMonthSchema, isoDateTimeSchema } from './common';

export const summaryQuerySchema = z.object({
  month: yearMonthSchema.optional(),
  from: isoDateTimeSchema.optional(),
  to: isoDateTimeSchema.optional(),
}).refine(
  (v) => {
    const hasMonth = !!v.month;
    const hasRange = !!v.from && !!v.to;
    return (hasMonth ? !hasRange : true) && (!hasMonth ? (v.from ? !!v.to : !v.to) : true);
  },
  { message: 'month と from/to は同時指定不可。from と to は両方必須。' }
);

export const summaryResponseSchema = z.object({
  range: z.object({
    from: isoDateTimeSchema,
    to: isoDateTimeSchema,
    month: yearMonthSchema.optional(),
  }),
  monthSavedTotalInclTax: z.number(),
  streak: z.number().int().min(0),
  countAvoided: z.number().int().min(0),
});
