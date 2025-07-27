-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Waktu pembuatan: 27 Jul 2025 pada 11.11
-- Versi server: 10.4.32-MariaDB
-- Versi PHP: 8.2.12-

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `inventory_db`
--

-- --------------------------------------------------------

--
-- Struktur dari tabel `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Struktur dari tabel `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `products`
--

INSERT INTO `products` (`id`, `name`, `description`, `price`, `stock`, `image_url`, `created_at`) VALUES
(1, 'Set Panci Anti Lengket 5 Pcs', 'Set panci serbaguna dengan lapisan anti lengket, cocok untuk berbagai masakan.', 750000.00, 19, 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQHuGlonvMGeMPUEYnBWaXkfUcN5530zqlV3RVDGHqFCTkQjTnLszx_6-NZEoqFKjiET94Qdllrlr2cdxjDZHMYTGQy5HUmFHo0Aw8zoChZqRGt_pY5G7jd', '2025-07-27 08:58:10'),
(2, 'Blender Philips HR2115', 'Blender multifungsi dengan kapasitas 2 liter dan 5 kecepatan.', 600000.00, 14, 'https://static.retailworldvn.com/Products/Images/12200/295677/blender-philips-hr2116-00-1.jpg', '2025-07-27 08:58:10'),
(3, 'Set Pisau Dapur Stainless Steel', 'Set pisau dapur lengkap dengan talenan dan pengasah, tajam dan awet.', 350000.00, 25, 'https://media.monotaro.id/mid01/big/Perlengkapan%20Dapur%20%26%20Horeka/Perlengkapan%20Memasak/Lain%20-%20lain/VICENZA%20Pisau%20Set/VICENZA%20Pisau%20Set%20V908K%201set/bzS035244431-1.jpg', '2025-07-27 08:58:10'),
(4, 'Vacuum Cleaner Portable Electrolux', 'Penyedot debu ringkas dan mudah dibawa, daya hisap kuat.', 1200000.00, 9, 'https://www.electrolux.co.id/globalassets/appliances/vacuum/id-zb6307db-fr-700x700.png', '2025-07-27 08:58:10'),
(5, 'Mesin Cuci Otomatis Samsung 8kg', 'Mesin cuci front loading dengan teknologi EcoBubble.', 3500000.00, 7, 'https://media.dinomarket.com/docs/imgTD/2022-06/DM_620C6B4BD0D250F4E599D433EF209751_140622180650_ll.jpg.jpg', '2025-07-27 08:58:10'),
(6, 'Set Sprei Katun Jepang Queen Size', 'Sprei lembut dan nyaman dari katun Jepang, motif minimalis.', 450000.00, 29, 'https://www.static-src.com/wcsstore/Indraprastha/images/catalog/full//103/MTA-7936753/jaxine_sprei_katun_jepang_ori_keiko_full01_d6jjm067.jpg', '2025-07-27 08:58:10'),
(7, 'Rice Cooker Miyako MCM-508', 'Penanak nasi digital dengan kapasitas 1.8 liter, multi-fungsi.', 300000.00, 39, 'https://images.tokopedia.net/img/JFrBQq/2024/8/19/82df1772-cc75-4c4a-a4f0-5b050c40375c.jpg', '2025-07-27 08:58:10'),
(8, 'Dispenser Air Panas Dingin Modena', 'Dispenser air dengan 3 keran (panas, normal, dingin), desain elegan.', 1500000.00, 12, 'https://cdn.modena.com/media/catalog/product/cache/161a6be98874147fd86b5478b91ffccf/D/i/Dispenser-Air-Galon-Bawah-Bottom-Loading-Water-Dispenser-DD-67-S-MODENA-1.png', '2025-07-27 08:58:10'),
(9, 'Set Alat Pel Otomatis', 'Alat pel lantai dengan ember pemeras otomatis, praktis dan efisien.', 200000.00, 34, 'https://media.monotaro.id/mid01/big/Alat%20%26%20Kebutuhan%20Kebersihan/Alat%20Kebersihan/Pel/Pel%20Putar/Proclean%20Set%20Alat%20Pel%20Putar%20(Spin%20Mop)/m0P108902792-1.jpg', '2025-07-27 08:58:10'),
(10, 'Kulkas 2 Pintu Sharp SJ-X185MG', 'Kulkas hemat energi dengan kapasitas 150 liter.', 2800000.00, 7, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQISVvmHNucUYBxEn8-1D76Ence9VITzwed9Q&s', '2025-07-27 08:58:10');

-- --------------------------------------------------------

--
-- Struktur dari tabel `purchases`
--

CREATE TABLE `purchases` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `purchases`
--

INSERT INTO `purchases` (`id`, `user_id`, `product_id`, `quantity`, `total_price`, `purchase_date`) VALUES
(1, 3, 1, 1, 750000.00, '2025-07-27 09:00:52'),
(2, 3, 6, 1, 450000.00, '2025-07-27 09:00:52'),
(3, 3, 9, 1, 200000.00, '2025-07-27 09:00:52'),
(4, 3, 2, 1, 600000.00, '2025-07-27 09:03:38'),
(5, 3, 4, 1, 1200000.00, '2025-07-27 09:03:38'),
(6, 3, 7, 1, 300000.00, '2025-07-27 09:03:38'),
(7, 3, 5, 1, 3500000.00, '2025-07-27 09:03:38');

-- --------------------------------------------------------

--
-- Struktur dari tabel `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','customer') DEFAULT 'customer'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data untuk tabel `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(1, 'admin', '$2a$10$7zCZML4bc5xkqJ0TOTidjueftx9pmYRrgrfE.1CvDwA7pR/dsEOQa', 'admin'),
(3, 'warni', '$2b$10$wUChOFqDISXBpoo71Ohwp.LBO/vgNkFa.BppVoMk3kKIblPcVYhS2', 'customer');

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indeks untuk tabel `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indeks untuk tabel `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indeks untuk tabel `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT untuk tabel `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT untuk tabel `purchases`
--
ALTER TABLE `purchases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT untuk tabel `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Ketidakleluasaan untuk tabel pelimpahan (Dumped Tables)
--

--
-- Ketidakleluasaan untuk tabel `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Ketidakleluasaan untuk tabel `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchases_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
