import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  pets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getPetsByUserId } = await import("./db");
      return getPetsByUserId(ctx.user.id);
    }),
    get: protectedProcedure.input((z: any) => z.object({ petId: z.number() })).query(async ({ input }) => {
      const { getPetById } = await import("./db");
      return getPetById(input.petId);
    }),
    create: protectedProcedure
      .input((z: any) => z.object({
        name: z.string(),
        species: z.string(),
        breed: z.string().optional(),
        age: z.number().optional(),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createPet } = await import("./db");
        return createPet({
          userId: ctx.user.id,
          ...input,
        });
      }),
    update: protectedProcedure
      .input((z: any) => z.object({
        petId: z.number(),
        name: z.string().optional(),
        species: z.string().optional(),
        breed: z.string().optional(),
        age: z.number().optional(),
        description: z.string().optional(),
        photoUrl: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updatePet } = await import("./db");
        return updatePet(input.petId, input);
      }),
    delete: protectedProcedure
      .input((z: any) => z.object({ petId: z.number() }))
      .mutation(async ({ input }) => {
        const { deletePet } = await import("./db");
        return deletePet(input.petId);
      }),
  }),

  alerts: router({
    getThresholds: protectedProcedure
      .input((z: any) => z.object({ petId: z.number() }))
      .query(async ({ input }) => {
        const { getAlertThresholdsByPetId } = await import("./db");
        return getAlertThresholdsByPetId(input.petId);
      }),
    setThreshold: protectedProcedure
      .input((z: any) => z.object({
        petId: z.number(),
        alertType: z.string(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
        enabled: z.boolean().default(true),
        notificationMethods: z.array(z.string()).default(["in_app"]),
      }))
      .mutation(async ({ input }) => {
        const { createAlertThreshold } = await import("./db");
        return createAlertThreshold({
          petId: input.petId,
          alertType: input.alertType,
          minValue: input.minValue,
          maxValue: input.maxValue,
          enabled: input.enabled ? 1 : 0,
          notificationMethods: JSON.stringify(input.notificationMethods),
        });
      }),
    getHistory: protectedProcedure
      .input((z: any) => z.object({ petId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        const { getAlertHistoryByPetId } = await import("./db");
        return getAlertHistoryByPetId(input.petId, input.limit);
      }),
    acknowledgeAlert: protectedProcedure
      .input((z: any) => z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        const { acknowledgeAlert } = await import("./db");
        return acknowledgeAlert(input.alertId);
      }),
  }),

  notifications: router({
    list: protectedProcedure
      .input((z: any) => z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        const { getNotificationsByUserId } = await import("./db");
        return getNotificationsByUserId(ctx.user.id, input.limit);
      }),
    markAsRead: protectedProcedure
      .input((z: any) => z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        const { markNotificationAsRead } = await import("./db");
        return markNotificationAsRead(input.notificationId);
      }),
  }),
});

export type AppRouter = typeof appRouter;
