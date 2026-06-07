CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`petId` int NOT NULL,
	`alertType` varchar(100) NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL,
	`message` text NOT NULL,
	`value` decimal(10,2),
	`acknowledged` int NOT NULL DEFAULT 0,
	`acknowledgedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertThresholds` (
	`id` int AUTO_INCREMENT NOT NULL,
	`petId` int NOT NULL,
	`alertType` varchar(100) NOT NULL,
	`minValue` decimal(10,2),
	`maxValue` decimal(10,2),
	`enabled` int NOT NULL DEFAULT 1,
	`notificationMethods` json DEFAULT ('["in_app"]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertThresholds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`petId` int NOT NULL,
	`alertHistoryId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('alert','info','warning','success') DEFAULT 'alert',
	`read` int NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`species` varchar(100) NOT NULL,
	`breed` varchar(255),
	`age` int,
	`photoUrl` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pets_id` PRIMARY KEY(`id`)
);
