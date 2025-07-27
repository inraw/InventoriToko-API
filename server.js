// Import modul yang diperlukan
const express = require('express');
const mysql = require('mysql2/promise'); // Menggunakan mysql2 dengan dukungan promise
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Muat variabel lingkungan dari file .env
dotenv.config();

// Inisialisasi aplikasi Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware untuk mengurai JSON body dari request
app.use(express.json());

// Variabel untuk koneksi database
let db;

// Fungsi untuk menghubungkan ke database
async function connectToDatabase() {
    try {
        db = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            // --- Tambahkan konfigurasi typeCast di sini ---
            // Ini akan memastikan DECIMAL dikonversi ke Number dan DATETIME ke string ISO
            typeCast: function (field, next) {
                if (field.type === 'DECIMAL' || field.type === 'NEWDECIMAL') {
                    // Konversi DECIMAL ke float/number
                    const value = field.string();
                    return (value === null) ? null : parseFloat(value);
                }
                if (field.type === 'DATE' || field.type === 'DATETIME' || field.type === 'TIMESTAMP') {
                    // Konversi DATE/DATETIME/TIMESTAMP ke string ISO 8601
                    // Ini adalah format yang lebih mudah di-parse di Kotlin dengan SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
                    const value = field.string();
                    if (value === null) return null;
                    // MySQL bisa mengembalikan '0000-00-00 00:00:00' untuk tanggal tidak valid
                    // Kita akan menganggapnya null jika itu terjadi
                    if (value === '0000-00-00 00:00:00') return null;
                    // Tambahkan 'Z' untuk menunjukkan UTC jika database Anda menyimpan dalam UTC
                    // Atau sesuaikan jika database Anda menyimpan dalam zona waktu lokal dan Anda ingin mengonversinya
                    return new Date(value).toISOString();
                }
                return next(); // Gunakan default type casting untuk tipe data lainnya
            }
            // --- Akhir konfigurasi typeCast ---
        });
        console.log('Connected to MySQL database using mysql2/promise');
    } catch (err) {
        console.error('Error connecting to the database:', err);
        // Exit process jika koneksi gagal agar tidak ada operasi database yang tidak valid
        process.exit(1);
    }
}

// Panggil fungsi koneksi saat aplikasi dimulai
connectToDatabase();

// Middleware untuk verifikasi token JWT
const verifyToken = (req, res, next) => {
    // Dapatkan token dari header Authorization
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Format: Bearer <token>

    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    // Verifikasi token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Failed to authenticate token' });
        }
        // Simpan data user dari token ke objek request
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next(); // Lanjutkan ke route berikutnya
    });
};

// Middleware untuk otorisasi peran admin
const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
};

// ====================================================================
// AUTHENTICATION ROUTES
// ====================================================================

// Endpoint Registrasi Pengguna
app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Hash password sebelum disimpan ke database
        const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

        // Masukkan user baru ke database dengan role 'customer' secara default
        const [result] = await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, 'customer']);
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username already exists' });
        }
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint Login Pengguna
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Cari user di database
        const [results] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = results[0];

        // Bandingkan password yang diinput dengan password terhash di database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Buat token JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token akan kadaluarsa dalam 1 jam
        );

        res.status(200).json({ message: 'Login successful', token, role: user.role, userId: user.id });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ====================================================================
// ADMIN ROUTES (Membutuhkan autentikasi dan peran admin)
// ====================================================================

// Mendapatkan semua produk (Admin)
app.get('/api/admin/products', verifyToken, isAdmin, async (req, res) => {
    try {
        const [results] = await db.execute('SELECT * FROM products');
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching products (admin):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Menambah produk baru (Admin)
app.post('/api/admin/products', verifyToken, isAdmin, async (req, res) => {
    const { name, description, price, stock, image_url } = req.body;
    if (!name || !price || !stock) {
        return res.status(400).json({ message: 'Name, price, and stock are required' });
    }
    try {
        const [result] = await db.execute('INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)', [name, description, price, stock, image_url]);
        res.status(201).json({ message: 'Product added successfully', productId: result.insertId });
    } catch (error) {
        console.error('Error adding product (admin):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Memperbarui produk (Admin)
app.put('/api/admin/products/:id', verifyToken, isAdmin, async (req, res) => {
    const productId = req.params.id;
    const { name, description, price, stock, image_url } = req.body;
    if (!name || !price || !stock) {
        return res.status(400).json({ message: 'Name, price, and stock are required' });
    }
    try {
        const [result] = await db.execute('UPDATE products SET name = ?, description = ?, price = ?, stock = ?, image_url = ? WHERE id = ?', [name, description, price, stock, image_url, productId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error updating product (admin):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Menghapus produk (Admin)
app.delete('/api/admin/products/:id', verifyToken, isAdmin, async (req, res) => {
    const productId = req.params.id;
    try {
        const [result] = await db.execute('DELETE FROM products WHERE id = ?', [productId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product (admin):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mendapatkan semua riwayat pembelian (Admin)
app.get('/api/admin/purchases', verifyToken, isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT
                p.id AS purchase_id,
                u.username,
                prod.name AS product_name,
                p.quantity,
                p.total_price,
                p.purchase_date
            FROM purchases p
            JOIN users u ON p.user_id = u.id
            JOIN products prod ON p.product_id = prod.id
            ORDER BY p.purchase_date DESC
        `;
        const [results] = await db.execute(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching all purchases (admin):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mendapatkan semua user (Admin)
app.get('/api/admin/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const [results] = await db.execute('SELECT id, username, role FROM users'); // Jangan kirim password
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching users (admin):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Menghapus user (Admin)
app.delete('/api/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
    const userIdToDelete = req.params.id;
    try {
        // Pastikan admin tidak menghapus dirinya sendiri
        if (req.userId == userIdToDelete) {
            return res.status(400).json({ message: 'Cannot delete your own admin account.' });
        }
        const [result] = await db.execute('DELETE FROM users WHERE id = ? AND role = "customer"', [userIdToDelete]); // Hanya boleh menghapus customer
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or is an admin (cannot be deleted by this endpoint)' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user (admin):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ====================================================================
// CUSTOMER ROUTES (Membutuhkan autentikasi)
// ====================================================================

// Mendapatkan daftar produk yang tersedia (Customer)
app.get('/api/customer/products', verifyToken, async (req, res) => {
    try {
        const [results] = await db.execute('SELECT id, name, description, price, stock, image_url FROM products WHERE stock > 0');
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching products (customer):', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mendapatkan isi keranjang belanja user (Customer)
app.get('/api/customer/cart', verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const query = `
            SELECT
                c.id AS cart_id,
                c.product_id,
                p.name AS product_name,
                p.price,
                c.quantity,
                (p.price * c.quantity) AS subtotal
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `;
        const [results] = await db.execute(query, [userId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Menambahkan produk ke keranjang belanja (Customer)
app.post('/api/customer/cart', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'Product ID and a valid quantity are required' });
    }

    try {
        // Mulai transaksi database
        await db.beginTransaction();

        // Cek ketersediaan produk dan stok
        const [productRows] = await db.execute('SELECT id, stock FROM products WHERE id = ?', [productId]);
        if (productRows.length === 0) {
            await db.rollback();
            return res.status(404).json({ message: 'Product not found' });
        }
        const product = productRows[0];
        if (product.stock < quantity) {
            await db.rollback();
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        // Cek apakah produk sudah ada di keranjang user
        const [cartItemRows] = await db.execute('SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?', [userId, productId]);

        if (cartItemRows.length > 0) {
            // Jika sudah ada, update kuantitas
            const currentQuantity = cartItemRows[0].quantity;
            const newQuantity = currentQuantity + quantity;
            if (product.stock < newQuantity) {
                await db.rollback();
                return res.status(400).json({ message: 'Not enough stock for this total quantity in cart' });
            }
            await db.execute('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?', [newQuantity, userId, productId]);
        } else {
            // Jika belum ada, tambahkan baru
            await db.execute('INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)', [userId, productId, quantity]);
        }

        // Commit transaksi
        await db.commit();
        res.status(201).json({ message: 'Product added to cart successfully' });

    } catch (error) {
        await db.rollback(); // Pastikan rollback jika ada error
        console.error('Error adding product to cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Menghapus item dari keranjang belanja (Customer)
app.delete('/api/customer/cart/:cartItemId', verifyToken, async (req, res) => {
    const userId = req.userId;
    const cartItemId = req.params.cartItemId;

    try {
        const [result] = await db.execute('DELETE FROM cart WHERE id = ? AND user_id = ?', [cartItemId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cart item not found or does not belong to user' });
        }
        res.status(200).json({ message: 'Item removed from cart successfully' });
    } catch (error) {
        console.error('Error deleting item from cart:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Melakukan pembelian (Customer)
// Sesuai instruksi: ketika klik beli, langsung notifikasi berhasil dan terdaftar di menu pembelian.
// Ini akan memproses semua item di keranjang user yang sedang login.
app.post('/api/customer/purchase', verifyToken, async (req, res) => {
    const userId = req.userId;

    try {
        // Mulai transaksi database
        await db.beginTransaction();

        // Dapatkan semua item di keranjang user
        const [cartItems] = await db.execute(`
            SELECT c.product_id, c.quantity, p.price, p.stock
            FROM cart c
            JOIN products p ON c.product_id = p.id
            WHERE c.user_id = ?
        `, [userId]);

        if (cartItems.length === 0) {
            await db.rollback();
            return res.status(400).json({ message: 'Your cart is empty' });
        }

        // Proses setiap item di keranjang
        for (const item of cartItems) {
            const { product_id, quantity, price, stock } = item;
            const totalPrice = quantity * price;

            // Cek stok lagi (untuk memastikan tidak ada perubahan stok mendadak)
            if (stock < quantity) {
                await db.rollback();
                return res.status(400).json({ message: `Not enough stock for product ID ${product_id}. Available: ${stock}, Requested: ${quantity}` });
            }

            // Kurangi stok produk
            const newStock = stock - quantity;
            await db.execute('UPDATE products SET stock = ? WHERE id = ?', [newStock, product_id]);

            // Tambahkan ke tabel purchases
            await db.execute(
                'INSERT INTO purchases (user_id, product_id, quantity, total_price) VALUES (?, ?, ?, ?)',
                [userId, product_id, quantity, totalPrice]
            );
        }

        // Kosongkan keranjang setelah pembelian berhasil
        await db.execute('DELETE FROM cart WHERE user_id = ?', [userId]);

        // Commit transaksi
        await db.commit();

        res.status(200).json({ message: 'Purchase successful and cart cleared!' });

    } catch (error) {
        // Rollback transaksi jika terjadi error
        await db.rollback();
        console.error('Error processing purchase:', error);
        res.status(500).json({ message: 'Internal server error during purchase' });
    }
});


// Mendapatkan riwayat pembelian user (Customer)
app.get('/api/customer/purchases', verifyToken, async (req, res) => {
    const userId = req.userId;
    try {
        const query = `
            SELECT
                p.id AS purchase_id,
                prod.name AS product_name,
                prod.image_url,
                p.quantity,
                p.total_price,
                p.purchase_date
            FROM purchases p
            JOIN products prod ON p.product_id = prod.id
            WHERE p.user_id = ?
            ORDER BY p.purchase_date DESC
        `;
        const [results] = await db.execute(query, [userId]);
        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching user purchases:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ====================================================================
// START SERVER
// ====================================================================

// Mulai server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
