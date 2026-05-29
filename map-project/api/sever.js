require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'https://lcr1983.github.io' }));
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false } // Aiven必須
});

// ── 評価の取得 ──────────────────────────
app.get('/api/ratings', async (req, res) => {
    const { item_id } = req.query;
    const [rows] = await pool.query(
        'SELECT * FROM ratings WHERE item_id = ? ORDER BY created_at DESC',
        [item_id]
    );
    res.json(rows);
});

// ── 評価の投稿 ──────────────────────────
app.post('/api/ratings', async (req, res) => {
    const { item_id, stars, comment } = req.body;
    if (!item_id || !stars) {
        return res.status(400).json({ error: 'item_idとstarsは必須です' });
    }
    await pool.query(
        'INSERT INTO ratings (item_id, stars, comment) VALUES (?, ?, ?)',
        [item_id, stars, comment || '']
    );
    res.json({ success: true });
});

// ── 食材ごとの平均評価 ─────────────────
app.get('/api/ratings/summary', async (req, res) => {
    const [rows] = await pool.query(`
    SELECT item_id,
           COUNT(*)        AS count,
           AVG(stars)      AS avg_stars,
           SUM(CASE WHEN stars >= 4 THEN 1 ELSE 0 END) / COUNT(*) AS positive_ratio
    FROM ratings
    GROUP BY item_id
    ORDER BY avg_stars DESC
  `);
    res.json(rows);
});

app.listen(process.env.PORT || 3000, () => console.log('API起動'));