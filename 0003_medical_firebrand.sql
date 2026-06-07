CREATE TABLE `investorAccessCodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`maxUses` int,
	`currentUses` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`createdBy` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `investorAccessCodes_id` PRIMARY KEY(`id`),
	CONSTRAINT `investorAccessCodes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `investorAccessGrants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessCodeId` int NOT NULL,
	`ndaSignatureId` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investorAccessGrants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndaSignatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fullName` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`companyName` varchar(255),
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`ndaVersion` varchar(20) NOT NULL DEFAULT '1.0',
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ndaSignatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `access_code_idx` ON `investorAccessCodes` (`code`);--> statement-breakpoint
CREATE INDEX `active_idx` ON `investorAccessCodes` (`isActive`);--> statement-breakpoint
CREATE INDEX `grant_user_id_idx` ON `investorAccessGrants` (`userId`);--> statement-breakpoint
CREATE INDEX `grant_code_id_idx` ON `investorAccessGrants` (`accessCodeId`);--> statement-breakpoint
CREATE INDEX `nda_user_id_idx` ON `ndaSignatures` (`userId`);--> statement-breakpoint
CREATE INDEX `nda_email_idx` ON `ndaSignatures` (`email`);