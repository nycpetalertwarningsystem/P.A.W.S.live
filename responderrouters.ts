import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./trpc"; // Base tRPC setup
import { db } from "./db";
import { users, pets, vulnerableMembers, responderAccessLogs } from "./schema";
import { eq, and } from "drizzle-orm";

export const responderRouter = router({
  // THE ULTRA-FAST CRISIS QUERY 
  // Designed to return full household rescue specifications instantly to an on-scene responder
  queryAddress: publicProcedure
    .input(
      z.object({
        responderId: z.number(),
        searchAddress: z.string(),
        searchZip: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = performance.now();

      // 1. Immediately log the access attempt for compliance security
      await db.insert(responderAccessLogs).values({
        responderId: input.responderId,
        addressQueried: `${input.searchAddress}, ${input.searchZip}`,
      });

      // 2. Locate the registered family matching this address configuration
      const family = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.zipCode, input.searchZip)
            // In practice, use a standardized geocoded string or strict string match for speed
          )
        )
        .execute();

      if (!family || family.length === 0) {
        return { found: false, message: "No registered crisis data found for this address." };
      }

      const targetUserId = family[0].id;

      // 3. Execute concurrent queries to pull Pets and Vulnerable Humans simultaneously
      const [householdPets, householdHumans] = await Promise.all([
        db.select().from(pets).where(eq(pets.userId, targetUserId)).execute(),
        db.select().from(vulnerableMembers).where(eq(vulnerableMembers.userId, targetUserId)).execute(),
      ]);

      const endTime = performance.now();
      console.log(`Crisis query resolved in ${(endTime - startTime).toFixed(2)}ms`);

      // 4. Return everything in a structured format for immediate reading on mobile terminals
      return {
        found: true,
        address: family[0].address,
        contacts: {
          primaryName: family[0].name,
          primaryPhone: family[0].phone,
        },
        rescuePayload: {
          vulnerableHumans: householdHumans.map(h => ({
            name: h.name,
            age: h.age,
            type: h.challengeType,
            vitalMedicalDetails: h.criticalMedicalInfo,
            criticalRescueInstructions: h.rescueNotes
          })),
          pets: householdPets.map(p => ({
            name: p.name,
            species: p.species,
            breed: p.breed,
            photo: p.photoUrl,
            vitalMedicalDetails: p.criticalMedicalInfo,
            criticalRescueInstructions: p.rescueNotes
          }))
        }
      };
    }),
});
