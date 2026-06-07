CREATE TABLE `stripeCustomers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripeCustomers_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripeCustomers_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `stripeCustomers_stripeCustomerId_unique` UNIQUE(`stripeCustomerId`)
);
--> statement-breakpoint
CREATE TABLE `stripePaymentIntents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(100) NOT NULL,
	`amount` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'usd',
	`status` varchar(50) NOT NULL,
	`planType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripePaymentIntents_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripePaymentIntents_stripePaymentIntentId_unique` UNIQUE(`stripePaymentIntentId`)
);
--> statement-breakpoint
CREATE TABLE `stripeSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSubscriptionId` varchar(100) NOT NULL,
	`stripeCustomerId` varchar(100) NOT NULL,
	`planType` varchar(50) NOT NULL,
	`status` varchar(50) NOT NULL,
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stripeSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `stripeSubscriptions_stripeSubscriptionId_unique` UNIQUE(`stripeSubscriptionId`)
);
--> statement-breakpoint
CREATE INDEX `stripe_user_id_idx` ON `stripeCustomers` (`userId`);--> statement-breakpoint
CREATE INDEX `stripe_customer_id_idx` ON `stripeCustomers` (`stripeCustomerId`);--> statement-breakpoint
CREATE INDEX `stripe_payment_user_id_idx` ON `stripePaymentIntents` (`userId`);--> statement-breakpoint
CREATE INDEX `stripe_payment_intent_id_idx` ON `stripePaymentIntents` (`stripePaymentIntentId`);--> statement-breakpoint
CREATE INDEX `stripe_payment_status_idx` ON `stripePaymentIntents` (`status`);--> statement-breakpoint
CREATE INDEX `stripe_sub_user_id_idx` ON `stripeSubscriptions` (`userId`);--> statement-breakpoint
CREATE INDEX `stripe_subscription_id_idx` ON `stripeSubscriptions` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE INDEX `stripe_sub_status_idx` ON `stripeSubscriptions` (`status`);