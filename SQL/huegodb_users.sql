CREATE DATABASE IF NOT EXISTS `huegodb` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `huegodb`;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FullName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `HashedPassword` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PhoneNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RoleCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `users` WRITE;
INSERT INTO `users` (
  `Id`, 
  `Email`, 
  `FullName`, 
  `HashedPassword`, 
  `PhoneNumber`, 
  `RoleCode`, 
  `IsActive`, 
  `CreatedAt`
) VALUES (
  UUID(), 
  'admin123@gmail.com', 
  'Admin', 
  '$2a$11$kHz74pdGCu01H86Z6TeJW.m.QBflCj4OTYvDCdU7ZLzywTZmaWzRG', 
  '0901234567', 
  'admin', 
  1, 
  NOW(6)
);
UNLOCK TABLES;

SELECT * FROM `users`;