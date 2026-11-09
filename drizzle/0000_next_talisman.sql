CREATE TABLE `lodge_access` (
	`lodge_id` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`member_id` text,
	`ends_at` text,
	PRIMARY KEY(`lodge_id`, `user_id`),
	FOREIGN KEY (`lodge_id`) REFERENCES `lodges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `access_user` ON `lodge_access` (`user_id`);--> statement-breakpoint
CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`lodge_id` text NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`lodge_id`) REFERENCES `lodges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `audit_lodge_time` ON `audit` (`lodge_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `invites` (
	`id` text PRIMARY KEY NOT NULL,
	`lodge_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`member_id` text,
	`expires_at` text NOT NULL,
	`ends_at` text,
	`accepted_by` text,
	FOREIGN KEY (`lodge_id`) REFERENCES `lodges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `invites_email` ON `invites` (`email`);--> statement-breakpoint
CREATE TABLE `lodges` (
	`id` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`lodge_id` text NOT NULL,
	`id` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	PRIMARY KEY(`lodge_id`, `id`),
	FOREIGN KEY (`lodge_id`) REFERENCES `lodges`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `records_lodge_kind` ON `records` (`lodge_id`,`kind`);--> statement-breakpoint
CREATE TABLE `transaction_guards` (
	`id` text PRIMARY KEY NOT NULL,
	`valid` integer NOT NULL,
	CONSTRAINT "guard_valid" CHECK("transaction_guards"."valid" = 1)
);
