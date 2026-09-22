CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nombre` varchar(191) NOT NULL,
	`comuna` varchar(100),
	`servicio` varchar(150),
	`calificacion` int NOT NULL,
	`comentario` text NOT NULL,
	`estado` enum('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
