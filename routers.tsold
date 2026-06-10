import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createPet,
  getPetsByUserId,
  getPetById,
  updatePet,
  deletePet,
  createEmergencyContact,
  getEmergencyContactsByPetId,
  updateEmergencyContact,
  deleteEmergencyContact,
  createSubscription,
  getActiveSubscriptionByUserId,
  updateSubscription,
  createContactSubmission,
  getContactSubmissions,
  getPetsByAddress,
  getAddressDataForResponder,
  logResponderAccess,
  createResponderAccount,
  getResponderByEmail,
  verifyResponderAccount,
  updateResponderLastAccess,
  updateUserProfile,
  getMembershipCounter,
  incrementSignupCounter,
  isFreeSignupAvailable,
  getRemainingFreeSlots,
  createFamilyMember,
  getFamilyMembersByUserId,
  updateFamilyMember,
  deleteFamilyMember,
  addMedicalHistoryEntry,
  getMedicalHistoryByPetId,
  deleteMedicalHistoryEntry,
  addSocialChallenge,
  getSocialChallengesByPetId,
  updateSocialChallenge,
  deleteSocialChallenge,
} from "./db";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import {
  createCheckoutSession,
  getCustomerSubscriptionStatus,
} from "./stripe-handler";
import {
  getStripeCustomerByUserId,
  getPaymentHistoryForUser,
  getActiveSubscriptionForUser,
} from "./stripe-db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * User Profile Management
   */
  users: router({
    getProfile: protectedProcedure.query(({ ctx }) => ctx.user),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) => updateUserProfile(ctx.user.id, input)),
  }),

  /**
   * Pet Management
   */
  pets: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          breed: z.string().optional(),
          age: z.number().optional(),
          color: z.string().optional(),
          microchipId: z.string().optional(),
          medicalInfo: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        createPet({
          userId: ctx.user.id,
          ...input,
        })
      ),

    uploadPhoto: protectedProcedure
      .input(
        z.object({
          petId: z.number(),
          fileName: z.string(),
          fileBuffer: z.instanceof(Buffer),
          mimeType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify pet belongs to user
        const pet = await getPetById(input.petId);
        if (!pet || pet.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        // Upload to S3
        const fileKey = `pets/${ctx.user.id}/${input.petId}/${Date.now()}-${input.fileName}`;
        const { url, key } = await storagePut(fileKey, input.fileBuffer, input.mimeType);

        // Update pet with photo URL
        await updatePet(input.petId, {
          photoUrl: url,
          photoKey: key,
        });

        return { url, key };
      }),

    list: protectedProcedure.query(({ ctx }) => getPetsByUserId(ctx.user.id)),

    getById: protectedProcedure
      .input(z.object({ petId: z.number() }))
      .query(async ({ ctx, input }) => {
        const pet = await getPetById(input.petId);
        if (!pet || pet.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        return pet;
      }),

    update: protectedProcedure
      .input(
        z.object({
          petId: z.number(),
          name: z.string().optional(),
          breed: z.string().optional(),
          age: z.number().optional(),
          color: z.string().optional(),
          microchipId: z.string().optional(),
          medicalInfo: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const pet = await getPetById(input.petId);
        if (!pet || pet.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        const { petId, ...updates } = input;
        return updatePet(petId, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ petId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const pet = await getPetById(input.petId);
        if (!pet || pet.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        return deletePet(input.petId);
      }),
  }),

  /**
   * Emergency Contacts
   */
  emergencyContacts: router({
    create: protectedProcedure
      .input(
        z.object({
          petId: z.number(),
          contactName: z.string(),
          phone: z.string(),
          relationship: z.string(),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const pet = await getPetById(input.petId);
        if (!pet || pet.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        return createEmergencyContact(input);
      }),

    listByPet: protectedProcedure
      .input(z.object({ petId: z.number() }))
      .query(async ({ ctx, input }) => {
        const pet = await getPetById(input.petId);
        if (!pet || pet.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        return getEmergencyContactsByPetId(input.petId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          contactId: z.number(),
          petId: z.number(),
          contactName: z.string().optional(),
          phone: z.string().optional(),
          relationship: z.string().optional(),
          email: z.string().email().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const pet = await getPetById(input.petId);
        if (!pet || pet.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        const { contactId, petId, ...updates } = input;
        return updateEmergencyContact(contactId, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ contactId: z.number(), petId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const pet = await getPetById(input.petId);
        if (!pet || pet.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        return deleteEmergencyContact(input.contactId);
      }),
  }),

  /**
   * Subscriptions
   */
  subscriptions: router({
    create: protectedProcedure
      .input(
        z.object({
          planType: z.enum(["basic", "premium", "enterprise"]),
          price: z.string(),
          renewalDate: z.date(),
        })
      )
      .mutation(({ ctx, input }) =>
        createSubscription({
          userId: ctx.user.id,
          ...input,
        })
      ),

    getActive: protectedProcedure.query(({ ctx }) =>
      getActiveSubscriptionByUserId(ctx.user.id)
    ),

    update: protectedProcedure
      .input(
        z.object({
          subscriptionId: z.number(),
          planType: z.enum(["basic", "premium", "enterprise"]).optional(),
          status: z.enum(["active", "paused", "cancelled"]).optional(),
        })
      )
      .mutation(({ input }) => {
        const { subscriptionId, ...updates } = input;
        return updateSubscription(subscriptionId, updates);
      })
  }),

  /**
   * Membership & Free Tier Management
   */
  membership: router({
    isFreeAvailable: publicProcedure.query(async () => {
      return await isFreeSignupAvailable();
    }),

    getRemainingFreeSlots: publicProcedure.query(async () => {
      return await getRemainingFreeSlots();
    }),

    getMembershipCounter: publicProcedure.query(async () => {
      return await getMembershipCounter();
    }),

    claimFreeSlot: protectedProcedure.mutation(async ({ ctx }) => {
      const isFree = await isFreeSignupAvailable();
      if (!isFree) {
        throw new Error("Free membership slots have been exhausted");
      }

      // Increment the free signup counter
      await incrementSignupCounter();

      // Create a free subscription record
      const renewalDate = new Date();
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);

      await createSubscription({
        userId: ctx.user.id,
        planType: "basic",
        price: "0.00",
        status: "active",
        renewalDate,
      });

      return {
        success: true,
        message: "Free membership activated!",
      };
    }),
  }),

  /**
   * Contact Form Submissions
   */
  contact: router({
    submit: publicProcedure
      .input(
        z.object({
          name: z.string(),
          email: z.string().email(),
          phone: z.string().optional(),
          message: z.string(),
          inquiryType: z.enum(["general", "investor", "partnership"]).default("general"),
        })
      )
      .mutation(async ({ input }) => {
        const submission = await createContactSubmission(input);

        // Notify owner
        try {
          await notifyOwner({
            title: `New ${input.inquiryType} inquiry from ${input.name}`,
            content: `Email: ${input.email}\nPhone: ${input.phone || "N/A"}\n\nMessage:\n${input.message}`,
          });
        } catch (error) {
          console.error("Failed to notify owner:", error);
        }

        return submission;
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      // Only admin can view submissions
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return getContactSubmissions(100);
    }),
  }),

  /**
   * Emergency Responder Portal
   */
  responder: router({
    /**
     * Query address for emergency response
     */
    queryAddress: publicProcedure
      .input(
        z.object({
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
          responderId: z.number().optional(), // For logging purposes
        })
      )
      .query(async ({ input }) => {
        // Get all pets at this address
        const pets = await getPetsByAddress(input.address, input.city, input.state, input.zipCode);

        // Log the access if responderId provided
        if (input.responderId) {
          await logResponderAccess({
            responderId: input.responderId,
            addressQueried: `${input.address}, ${input.city}, ${input.state} ${input.zipCode}`,
            petsFound: pets.length,
          });

          // Update responder's last access time
          await updateResponderLastAccess(input.responderId);
        }

        return {
          address: `${input.address}, ${input.city}, ${input.state} ${input.zipCode}`,
          petsFound: pets.length,
          pets,
        };
      }),

    /**
     * Get full address data (pets + emergency contacts + household info)
     */
    getAddressData: publicProcedure
      .input(
        z.object({
          address: z.string(),
          city: z.string(),
          state: z.string(),
          zipCode: z.string(),
          responderId: z.number().optional(),
        })
      )
      .query(async ({ input }) => {
        const data = await getAddressDataForResponder(
          input.address,
          input.city,
          input.state,
          input.zipCode
        );

        // Log the access if responderId provided
        if (input.responderId && data) {
          const totalPets = data.households.reduce((sum, h) => sum + h.pets.length, 0);
          await logResponderAccess({
            responderId: input.responderId,
            addressQueried: `${input.address}, ${input.city}, ${input.state} ${input.zipCode}`,
            petsFound: totalPets,
          });

          await updateResponderLastAccess(input.responderId);
        }

        return data;
      }),

    /**
     * Register a new responder (creates unverified account)
     */
    register: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          agency: z.string(),
          agencyId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        // Check if responder already exists
        const existing = await getResponderByEmail(input.email);
        if (existing) {
          throw new Error("Responder account already exists");
        }

        // Generate verification token
        const verificationToken = Math.random().toString(36).substring(2, 15);

        const result = await createResponderAccount({
          email: input.email,
          agency: input.agency,
          agencyId: input.agencyId,
          isVerified: false,
          verificationToken,
          accessLevel: "viewer",
        });

        // TODO: Send verification email with token

        return {
          success: true,
          message: "Verification email sent",
        };
      }),

    /**
     * Verify responder account with token
     */
    verify: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          verificationToken: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const responder = await getResponderByEmail(input.email);
        if (!responder) {
          throw new Error("Responder not found");
        }

        if (responder.verificationToken !== input.verificationToken) {
          throw new Error("Invalid verification token");
        }

        const result = await verifyResponderAccount(responder.id);
        return {
          success: true,
          responder: result?.[0],
        };
      }),
  }),

  /**
   * Stripe Payment Management
   */
  stripe: router({
    createCheckout: protectedProcedure
      .input(
        z.object({
          planType: z.enum(["pet_profile", "medical_records", "behavioral_challenges"]),
          origin: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const session = await createCheckoutSession(
          ctx.user.id,
          ctx.user.email || "",
          ctx.user.name || "User",
          input.planType,
          input.origin
        );
        return {
          checkoutUrl: session.url,
          sessionId: session.id,
        };
      }),

    getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
      const customer = await getStripeCustomerByUserId(ctx.user.id);
      if (!customer) {
        return null;
      }

      const subscription = await getCustomerSubscriptionStatus(
        customer.stripeCustomerId
      );
      return subscription;
    }),

    getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
      return await getPaymentHistoryForUser(ctx.user.id);
    }),

    getActiveSubscription: protectedProcedure.query(async ({ ctx }) => {
      return await getActiveSubscriptionForUser(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
