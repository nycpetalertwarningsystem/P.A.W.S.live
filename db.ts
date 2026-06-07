import { eq, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  pets,
  emergencyContacts,
  subscriptions,
  responderAccounts,
  responderAccessLogs,
  contactSubmissions,
  membershipCounter,
  familyMembers,
  petMedicalHistory,
  petSocialChallenges,
  InsertPet,
  InsertEmergencyContact,
  InsertSubscription,
  InsertResponderAccount,
  InsertResponderAccessLog,
  InsertContactSubmission,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * User Management
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    // Handle phone and address fields
    if (user.phone !== undefined) {
      values.phone = user.phone;
      updateSet.phone = user.phone;
    }
    if (user.address !== undefined) {
      values.address = user.address;
      updateSet.address = user.address;
    }
    if (user.city !== undefined) {
      values.city = user.city;
      updateSet.city = user.city;
    }
    if (user.state !== undefined) {
      values.state = user.state;
      updateSet.state = user.state;
    }
    if (user.zipCode !== undefined) {
      values.zipCode = user.zipCode;
      updateSet.zipCode = user.zipCode;
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(
  userId: number,
  updates: Partial<InsertUser>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(users).set(updates).where(eq(users.id, userId));
  return getUserById(userId);
}

/**
 * Pet Management
 */
export async function createPet(pet: InsertPet) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(pets).values(pet);
  return result;
}

export async function getPetsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(pets).where(eq(pets.userId, userId));
}

export async function getPetById(petId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(pets).where(eq(pets.id, petId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePet(petId: number, updates: Partial<InsertPet>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(pets).set(updates).where(eq(pets.id, petId));
  return getPetById(petId);
}

export async function deletePet(petId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(pets).where(eq(pets.id, petId));
  return true;
}

/**
 * Emergency Contacts
 */
export async function createEmergencyContact(contact: InsertEmergencyContact) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(emergencyContacts).values(contact);
  return result;
}

export async function getEmergencyContactsByPetId(petId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(emergencyContacts).where(eq(emergencyContacts.petId, petId));
}

export async function updateEmergencyContact(
  contactId: number,
  updates: Partial<InsertEmergencyContact>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(emergencyContacts).set(updates).where(eq(emergencyContacts.id, contactId));
  return db.select().from(emergencyContacts).where(eq(emergencyContacts.id, contactId)).limit(1);
}

export async function deleteEmergencyContact(contactId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(emergencyContacts).where(eq(emergencyContacts.id, contactId));
  return true;
}

/**
 * Subscriptions
 */
export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(subscriptions).values(subscription);
  return result;
}

export async function getActiveSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateSubscription(
  subscriptionId: number,
  updates: Partial<InsertSubscription>
) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(subscriptions).set(updates).where(eq(subscriptions.id, subscriptionId));
  return db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
}

/**
 * Responder Accounts
 */
export async function createResponderAccount(account: InsertResponderAccount) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(responderAccounts).values(account);
  return result;
}

export async function getResponderByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(responderAccounts)
    .where(eq(responderAccounts.email, email))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function verifyResponderAccount(responderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(responderAccounts)
    .set({ isVerified: true, verificationToken: null })
    .where(eq(responderAccounts.id, responderId));

  return db.select().from(responderAccounts).where(eq(responderAccounts.id, responderId)).limit(1);
}

export async function updateResponderLastAccess(responderId: number) {
  const db = await getDb();
  if (!db) return undefined;

  await db
    .update(responderAccounts)
    .set({ lastAccessedAt: new Date() })
    .where(eq(responderAccounts.id, responderId));
}

/**
 * Responder Access Logs
 */
export async function logResponderAccess(log: InsertResponderAccessLog) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(responderAccessLogs).values(log);
  return result;
}

/**
 * Contact Submissions
 */
export async function createContactSubmission(submission: InsertContactSubmission) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(contactSubmissions).values(submission);
  return result;
}

export async function getContactSubmissions(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(contactSubmissions).orderBy(contactSubmissions.createdAt).limit(limit);
}

/**
 * Address-based Pet Lookup (for Emergency Responders)
 */
export async function getPetsByAddress(address: string, city: string, state: string, zipCode: string) {
  const db = await getDb();
  if (!db) return [];

  // Get users at this address
  const usersAtAddress = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.address, address),
        eq(users.city, city),
        eq(users.state, state),
        eq(users.zipCode, zipCode)
      )
    );

  if (usersAtAddress.length === 0) return [];

  // Get all pets for these users
  const userIds = usersAtAddress.map((u) => u.id);
  const allPets = await db.select().from(pets).where(eq(pets.userId, userIds[0]));

  return allPets;
}

/**
 * Get Full Address Data (for Emergency Responders)
 */
export async function getAddressDataForResponder(
  address: string,
  city: string,
  state: string,
  zipCode: string
) {
  const db = await getDb();
  if (!db) return null;

  // Get users at this address
  const usersAtAddress = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.address, address),
        eq(users.city, city),
        eq(users.state, state),
        eq(users.zipCode, zipCode)
      )
    );

  if (usersAtAddress.length === 0) return null;

  // For each user, get their pets and emergency contacts
  const addressData = [];

  for (const user of usersAtAddress) {
    const userPets = await db.select().from(pets).where(eq(pets.userId, user.id));

    const petsWithContacts = await Promise.all(
      userPets.map(async (pet) => {
        const contacts = await db
          .select()
          .from(emergencyContacts)
          .where(eq(emergencyContacts.petId, pet.id));
        return { ...pet, emergencyContacts: contacts };
      })
    );

    addressData.push({
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
      pets: petsWithContacts,
    });
  }

  return {
    address: `${address}, ${city}, ${state} ${zipCode}`,
    households: addressData,
  };
}


/**
 * Membership Counter Management
 */
export async function initMembershipCounter(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot init membership counter: database not available");
    return;
  }

  try {
    // Check if counter already exists
    const existing = await db.select().from(membershipCounter).limit(1);
    if (existing.length === 0) {
      // Initialize the counter
      await db.insert(membershipCounter).values({
        totalSignups: 0,
        freeSignups: 0,
        maxFreeMembers: 10000,
      });
    }
  } catch (error) {
    console.error("[Database] Error initializing membership counter:", error);
  }
}

export async function getMembershipCounter() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get membership counter: database not available");
    return null;
  }

  try {
    const counter = await db.select().from(membershipCounter).limit(1);
    return counter[0] || null;
  } catch (error) {
    console.error("[Database] Error getting membership counter:", error);
    return null;
  }
}

export async function incrementSignupCounter(isFree: boolean = true): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot increment signup counter: database not available");
    return;
  }

  try {
    // First ensure counter exists
    const existing = await db.select().from(membershipCounter).limit(1);
    if (existing.length === 0) {
      await initMembershipCounter();
    }

    // Increment counters
    await db
      .update(membershipCounter)
      .set({
        totalSignups: sql`totalSignups + 1`,
        freeSignups: isFree ? sql`freeSignups + 1` : undefined,
      })
      .where(eq(membershipCounter.id, 1));
  } catch (error) {
    console.error("[Database] Error incrementing signup counter:", error);
  }
}

export async function getRemainingFreeSlots(): Promise<number> {
  const counter = await getMembershipCounter();
  if (!counter) return 10000;
  
  const remaining = counter.maxFreeMembers - counter.freeSignups;
  return Math.max(0, remaining);
}

export async function isFreeSignupAvailable(): Promise<boolean> {
  const remaining = await getRemainingFreeSlots();
  return remaining > 0;
}


/**
 * Family Members Management
 */
export async function createFamilyMember(member: {
  userId: number;
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  role?: "viewer" | "editor" | "admin";
  canReceiveAlerts?: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create family member: database not available");
    return;
  }

  try {
    const verificationToken = Math.random().toString(36).substring(2, 15);
    await db.insert(familyMembers).values({
      userId: member.userId,
      name: member.name,
      email: member.email,
      phone: member.phone,
      relationship: member.relationship,
      role: member.role || "viewer",
      canReceiveAlerts: member.canReceiveAlerts !== false,
      verificationToken,
    });
  } catch (error) {
    console.error("[Database] Error creating family member:", error);
  }
}

export async function getFamilyMembersByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get family members: database not available");
    return [];
  }

  try {
    return await db.select().from(familyMembers).where(eq(familyMembers.userId, userId));
  } catch (error) {
    console.error("[Database] Error getting family members:", error);
    return [];
  }
}

export async function updateFamilyMember(
  memberId: number,
  updates: Partial<{
    name: string;
    email: string;
    phone: string;
    relationship: string;
    role: "viewer" | "editor" | "admin";
    canReceiveAlerts: boolean;
    isVerified: boolean;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update family member: database not available");
    return;
  }

  try {
    await db.update(familyMembers).set(updates).where(eq(familyMembers.id, memberId));
  } catch (error) {
    console.error("[Database] Error updating family member:", error);
  }
}

export async function deleteFamilyMember(memberId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete family member: database not available");
    return;
  }

  try {
    await db.delete(familyMembers).where(eq(familyMembers.id, memberId));
  } catch (error) {
    console.error("[Database] Error deleting family member:", error);
  }
}

/**
 * Pet Medical History
 */
export async function addMedicalHistoryEntry(entry: {
  petId: number;
  entryType: "medication" | "allergy" | "condition" | "surgery" | "vaccination" | "visit";
  title: string;
  description?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add medical history: database not available");
    return;
  }

  try {
    await db.insert(petMedicalHistory).values({
      petId: entry.petId,
      entryType: entry.entryType,
      title: entry.title,
      description: entry.description,
    });
  } catch (error) {
    console.error("[Database] Error adding medical history:", error);
  }
}

export async function getMedicalHistoryByPetId(petId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get medical history: database not available");
    return [];
  }

  try {
    return await db.select().from(petMedicalHistory).where(eq(petMedicalHistory.petId, petId));
  } catch (error) {
    console.error("[Database] Error getting medical history:", error);
    return [];
  }
}

export async function deleteMedicalHistoryEntry(entryId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete medical history: database not available");
    return;
  }

  try {
    await db.delete(petMedicalHistory).where(eq(petMedicalHistory.id, entryId));
  } catch (error) {
    console.error("[Database] Error deleting medical history:", error);
  }
}

/**
 * Pet Social Challenges
 */
export async function addSocialChallenge(challenge: {
  petId: number;
  challengeType: "anxiety" | "aggression" | "fear" | "reactivity" | "separation_anxiety" | "other";
  description?: string;
  triggers?: string;
  managementTips?: string;
  severity?: "mild" | "moderate" | "severe";
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add social challenge: database not available");
    return;
  }

  try {
    await db.insert(petSocialChallenges).values({
      petId: challenge.petId,
      challengeType: challenge.challengeType,
      description: challenge.description,
      triggers: challenge.triggers,
      managementTips: challenge.managementTips,
      severity: challenge.severity || "mild",
    });
  } catch (error) {
    console.error("[Database] Error adding social challenge:", error);
  }
}

export async function getSocialChallengesByPetId(petId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get social challenges: database not available");
    return [];
  }

  try {
    return await db.select().from(petSocialChallenges).where(eq(petSocialChallenges.petId, petId));
  } catch (error) {
    console.error("[Database] Error getting social challenges:", error);
    return [];
  }
}

export async function updateSocialChallenge(
  challengeId: number,
  updates: Partial<{
    description: string;
    triggers: string;
    managementTips: string;
    severity: "mild" | "moderate" | "severe";
    isActive: boolean;
  }>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update social challenge: database not available");
    return;
  }

  try {
    await db.update(petSocialChallenges).set(updates).where(eq(petSocialChallenges.id, challengeId));
  } catch (error) {
    console.error("[Database] Error updating social challenge:", error);
  }
}

export async function deleteSocialChallenge(challengeId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete social challenge: database not available");
    return;
  }

  try {
    await db.delete(petSocialChallenges).where(eq(petSocialChallenges.id, challengeId));
  } catch (error) {
    console.error("[Database] Error deleting social challenge:", error);
  }
}
