// // config/db.js
// require("dotenv").config();
// const mysql = require("mysql2/promise");

// // Simple single pool connection using .env
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASS || "", // must match .env exactly (no quotes)
//   database: process.env.DB_NAME || "car_media",
//   port: process.env.DB_PORT || 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
//   authPlugins: {
//     mysql_native_password: () =>
//       require("mysql2/lib/auth_plugins").mysql_native_password,
//   },
// });

// // Test connection
// (async () => {
//   try {
//     const conn = await pool.getConnection();
//     console.log("✅ Connected to MySQL successfully!");
//     conn.release();
//   } catch (err) {
//     console.error("❌ Database connection failed:", err.message);
//   }
// })();

// module.exports = pool;
