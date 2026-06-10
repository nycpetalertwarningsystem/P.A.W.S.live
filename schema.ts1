import { decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Pets table - stores pet information for each user
 */
export const pets = mysqlTable("pets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  species: varchar("species", { length: 100 }).notNull(), // dog, cat, bird, etc.
  breed: varchar("breed", { length: 255 }),
  age: int("age"), // in years
  photoUrl: text("photoUrl"), // URL to pet photo in storage
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Pet = typeof pets.$inferSelect;
export type InsertPet = typeof pets.$inferInsert;

/**
 * Alert thresholds - stores warning thresholds for each pet
 */
export const alertThresholds = mysqlTable("alertThresholds", {
  id: int("id").autoincrement().primaryKey(),
  petId: int("petId").notNull(),
  alertType: varchar("alertType", { length: 100 }).notNull(), // temperature, humidity, activity, etc.
  minValue: decimal("minValue", { precision: 10, scale: 2 }),
  maxValue: decimal("maxValue", { precision: 10, scale: 2 }),
  enabled: int("enabled").default(1).notNull(), // 0 or 1 for boolean
  notificationMethods: json("notificationMethods").default(JSON.stringify(["in_app"])), // ["in_app", "email", "sms"]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlertThreshold = typeof alertThresholds.$inferInsert;

/**
 * Alert history - logs all triggered alerts for each pet
 */
export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").autoincrement().primaryKey(),
  petId: int("petId").notNull(),
  alertType: varchar("alertType", { length: 100 }).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  message: text("message").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }), // the actual value that triggered the alert
  acknowledged: int("acknowledged").default(0).notNull(), // 0 or 1 for boolean
  acknowledgedAt: timestamp("acknowledgedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistoryRecord = typeof alertHistory.$inferSelect;
export type InsertAlertHistoryRecord = typeof alertHistory.$inferInsert;

/**
 * Notifications - in-app notifications for the user
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  petId: int("petId").notNull(),
  alertHistoryId: int("alertHistoryId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["alert", "info", "warning", "success"]).default("alert"),
  read: int("read").default(0).notNull(), // 0 or 1 for boolean
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Relations
 */
export const usersRelations = relations(users, ({ many }) => ({
  pets: many(pets),
  notifications: many(notifications),
}));

export const petsRelations = relations(pets, ({ one, many }) => ({
  user: one(users, {
    fields: [pets.userId],
    references: [users.id],
  }),
  alertThresholds: many(alertThresholds),
  alertHistory: many(alertHistory),
  notifications: many(notifications),
}));

export const alertThresholdsRelations = relations(alertThresholds, ({ one }) => ({
  pet: one(pets, {
    fields: [alertThresholds.petId],
    references: [pets.id],
  }),
}));

export const alertHistoryRelations = relations(alertHistory, ({ one }) => ({
  pet: one(pets, {
    fields: [alertHistory.petId],
    references: [pets.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  pet: one(pets, {
    fields: [notifications.petId],
    references: [pets.id],
  }),
}));
