USE test;
CREATE DATABASE IF NOT EXISTS `bookshop`;

CREATE TABLE `bookshop`.`users` (
  `id` bigint,
  `nickname` varchar(100),
  `balance` decimal(15,2)
);

INSERT INTO `bookshop`.`users` (`id`, `nickname`, `balance`) VALUES (1, 'John', 100.00);

select * from `bookshop`.`users`;
