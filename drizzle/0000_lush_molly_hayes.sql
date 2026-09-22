CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(191) NOT NULL,
	`telefono` varchar(64) NOT NULL,
	`comuna` varchar(100) NOT NULL,
	`servicio` varchar(150) NOT NULL,
	`tipoPropiedad` varchar(64) DEFAULT 'Residencial',
	`urgencia` varchar(32) DEFAULT 'Normal',
	`mensaje` text,
	`estado` enum('pendiente','en_camino','contactado','completado','cancelado') NOT NULL DEFAULT 'pendiente',
	`whatsappDestino` varchar(64) NOT NULL DEFAULT '+56 9 6193 5547',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
