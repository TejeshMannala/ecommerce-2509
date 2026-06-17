const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();
console.log("🔍 Environment Check:");
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
console.log("MONGO_URI value:", process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + "..." : "NOT SET");
console.log("PORT:", process.env.PORT);

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const adminAuthRoutes = require("./admin/routes/adminAuthRoutes");
const adminRoutes = require("./admin/routes");

const app = express();

/* ========================
   TRUST PROXY (Render / VPS fix)
======================== */
if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

/* ========================
   CORS CONFIG (IMPORTANT FIX)
======================== */
const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
];

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : defaultOrigins;

if (!process.env.CORS_ORIGINS) {
  console.warn(
    "⚠️  CORS_ORIGINS is not set. Defaulting to local development origins:",
    allowedOrigins.join(", ")
  );
}

app.use(
  cors({
    origin: function (origin, callback) {
      // allow tools like Postman or server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked: origin ${origin} is not allowed. Allowed origins: ${allowedOrigins.join(", ")}`
        )
      );
    },
    credentials: true,
  })
);

/* ========================
   BODY PARSERS
======================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ========================
   STATIC FILES
======================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ========================
   DB STATUS FLAG
======================== */
let dbConnected = false;

/* ========================
   HEALTH CHECK
======================== */
app.get("/api/health", (req, res) => {
  res.json({
    status: dbConnected ? "ok" : "degraded",
    service: "freshbay-api",
    dbConnected,
  });
});

/* ========================
   DB GUARD (protect API routes)
======================== */
app.use("/api", (req, res, next) => {
  if (req.path === "/health") return next();

  if (!dbConnected) {
    return res.status(503).json({
      message: "Service unavailable: database not connected",
    });
  }

  next();
});

/* ========================
   ROUTES
======================== */
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);

/* ========================
   ERROR HANDLER
======================== */
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

/* ========================
   SERVER START
======================== */
const startServer = async () => {
  const PORT = process.env.PORT || 5000;

  console.log("🔍 Checking environment variables...");
  console.log("PORT:", PORT);
  console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
  // console.log("MONGO_URI value:", process.env.MONGO_URI ? process.env.MONGO_URI.substring(0, 50) + "..." : "NOT SET");

  if (!process.env.MONGO_URI) {
    console.error("❌ CRITICAL: MONGO_URI not set in .env file!");
  }

  try {
    await connectDB();
    dbConnected = true;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ DB connection failed. Running in degraded mode.");
    console.error("Error details:", error.message);
    console.error("Full error:", error);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (dbConnected=${dbConnected})`);
  });
};

startServer();