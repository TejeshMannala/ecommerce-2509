const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const cookieParser = require("cookie-parser");

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
const supportMessageRoutes = require("./routes/supportMessageRoutes");
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
  "http://localhost:3000",
  "https://freshbay.onrender.com",
  "https://freshbay-admin.onrender.com",
];

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : defaultOrigins;

if (!process.env.CORS_ORIGIN) {
  console.warn(
    "⚠️  CORS_ORIGIN is not set. Defaulting to local development origins:",
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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

/* ========================
   BODY PARSERS & COOKIES
======================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ========================
   REQUEST LOGGING
======================== */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log("Params:", req.params);
  console.log("Query:", req.query);
  if (req.user) console.log("User:", req.user._id);
  next();
});

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
    success: true,
    message: "Server Running",
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
app.use("/api/support-messages", supportMessageRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);

/* ========================
   404 HANDLER
======================== */
app.use((req, res, next) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

/* ========================
   ERROR HANDLER
======================== */
app.use((err, req, res, next) => {
  console.error("❌ Error encountered:");
  console.error("URL:", req.originalUrl);
  console.error("Method:", req.method);
  console.error("Headers:", req.headers);
  console.error("Body:", req.body);
  if (req.user) console.error("User:", req.user._id);
  console.error("Stack Trace:", err.stack);

  res.status(err.status || err.statusCode || 500).json({
    message: err.message || "Internal Server Error",
    success: false,
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