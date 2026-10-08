import { z } from "zod";

export const createOrderSchema = z
  .object({
    recipeId: z
      .number({ message: "Select a recipe" })
      .int("Select a recipe")
      .positive("Select a recipe"),

    targetQty: z
      .number({ message: "Quantity must be a number" })
      .int("Quantity must be a whole number")
      .positive("Quantity must be greater than 0")
      .max(100000, "Quantity is too large"),

    fabricRollId: z
      .string({ message: "Fabric roll ID is required" })
      .trim()
      .min(3, "Fabric roll ID is too short")
      .max(50, "Fabric roll ID is too long")
      .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - or _ only"),

    actualFabricYds: z
      .number({ message: "Fabric used must be a number" })
      .positive("Fabric used must be greater than 0")
      .max(1000000, "Fabric used is too large")
      .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use at most 2 decimal places"),
  })
  .strict(); // rejects unknown keys such as status or createdBy

  const fabricYds = z
  .number({ message: "Fabric used must be a number" })
  .positive("Fabric used must be greater than 0")
  .max(1000000, "Fabric used is too large")
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, "Use at most 2 decimal places");

export const countSchema = z
  .object({
    counts: z
      .array(
        z
          .object({
            componentId: z.number().int().positive(),
            actualQty: z
              .number({ message: "Count must be a number" })
              .int("Count must be a whole number")
              .min(0, "Count cannot be negative")
              .max(10_000_000, "Count is too large"),
          })
          .strict(),
      )
      .min(1, "No counts provided")
      .max(50),
  })
  .strict();

export const rejectSchema = z
  .object({
    reason: z
      .string({ message: "A rejection reason is required" })
      .trim()
      .min(5, "Reason must be at least 5 characters")
      .max(500, "Reason is too long"),
  })
  .strict();

export const resubmitSchema = z.object({ actualFabricYds: fabricYds }).strict();