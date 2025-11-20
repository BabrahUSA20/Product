const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const FormData = require("form-data");

const app = express();
const PORT = process.env.PORT || 5000;

// Base directory for uploads
const BASE_DIR = path.join(__dirname, "uploads");

// Ensure base directory exists
async function ensureBaseDir() {
  try {
    await fs.mkdir(BASE_DIR, { recursive: true });
    console.log(`✅ Base directory ensured: ${BASE_DIR}`);
  } catch (error) {
    console.error("❌ Failed to create base directory:", error);
  }
}
app.use(
  cors({
    origin: "https://product-11.onrender.com", // FRONTEND domain
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "ngrok-skip-browser-warning",
    ],
  })
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files with proper headers for external access
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// Handle preflight requests properly
app.options("*", (req, res) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://product-10.onrender.com",
    "http://localhost:3000",
    "http://localhost:5173",
  ];

  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, ngrok-skip-browser-warning"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400"); // 24 hours
  res.status(200).send();
});

// Log all incoming requests (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log("Origin:", req.headers.origin);
  console.log("User-Agent:", req.headers["user-agent"]);
  next();
});

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const category = req.body.category || "general";
    const dir = path.join(BASE_DIR, category);

    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ Upload directory ensured: ${dir}`);
      cb(null, dir);
    } catch (error) {
      console.error("❌ Failed to create upload directory:", error);
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${randomNum}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error("Only image files (jpeg, jpg, png, gif, webp) are allowed!")
      );
    }
  },
});

// PostgreSQL Database Connection
const dbConfig = {
  host:
    process.env.DB_HOST ||
    "dpg-d4ess8mr433s738tsrl0-a.oregon-postgres.render.com", // Use external hostname for public access
  user: process.env.DB_USER || "social_publisher_user",
  password: process.env.DB_PASSWORD || "T1OmMINWDIYDpkIZjebZpaAMUsNq3SAf",
  database: process.env.DB_NAME || "social_publisher",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
  ssl: {
    rejectUnauthorized: false,
  },
};

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://social_publisher_user:T1OmMINWDIYDpkIZjebZpaAMUsNq3SAf@dpg-d4ess8mr433s738tsrl0-a.oregon-postgres.render.com:5432/social_publisher";

console.log(
  `🗄️ PostgreSQL DB: ${dbConfig.host}:${dbConfig.port} database=${dbConfig.database}`
);

let pool;

// Facebook Configuration
const FACEBOOK_CONFIG = {
  appId: "1337633731201564",
  appSecret: "8b32b2635df8bfac6e6938bb622c1982",
  pageId: "808184602385722",
  graphUrl: "https://graph.facebook.com/v18.0",
  defaultAccessToken:
    "EAATAkh9jShwBP7CO09XXM27PAyWMnfXFx2xZBxBrZCuBTkZCW2g41WfJudTBCeqVcQ7YEGeoz0ZAE3iw7tV8CIBO1jnM5V5cEvI13cGhR4RoEnY5ispspeRZAK2xAYGkdrw9RzZBZBZCwI14nMBoCnMwXZC0vCAfppZA1iiOUwJuKc1C0MOv8QZBBuSAvt7ormz2yPll0czgKsUK3tFq7odq7kQlb569ZBAZBEMsxvQoyu9Ml3sXlOOHZBTNclOq2TyeHwYHKTg7hRKWyHJ7PQbGoZD",
};
async function initDatabase() {
  try {
    // ✅ UPDATED: Use connection string with SSL for Render
    pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Test connection
    const client = await pool.connect();
    console.log("✅ PostgreSQL database connected successfully");

    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        page_id VARCHAR(255),
        access_token TEXT,
        instagram_business_account_id VARCHAR(255),
        platform_type VARCHAR(20) CHECK (platform_type IN ('facebook', 'instagram', 'twitter', 'linkedin')) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        category VARCHAR(20) CHECK (category IN ('car', 'announcement', 'news', 'update')) NOT NULL,
        title VARCHAR(255),
        description TEXT,
        car_brand VARCHAR(100),
        car_model VARCHAR(100),
        car_year VARCHAR(4),
        car_price DECIMAL(15, 2),
        car_condition VARCHAR(10) CHECK (car_condition IN ('new', 'used')),
        car_mileage VARCHAR(50),
        car_transmission VARCHAR(10) CHECK (car_transmission IN ('automatic', 'manual')),
        car_fuel_type VARCHAR(50),
        announcement_type VARCHAR(100),
        event_date DATE,
        event_location VARCHAR(255),
        news_source VARCHAR(255),
        news_author VARCHAR(100),
        update_type VARCHAR(100),
        update_priority VARCHAR(10) CHECK (update_priority IN ('low', 'medium', 'high', 'urgent')),
        image_url VARCHAR(255),
        platform_id INT REFERENCES platforms(id),
        target_type VARCHAR(10) CHECK (target_type IN ('page', 'feed', 'story')) NOT NULL,
        platform_post_id VARCHAR(255),
        status VARCHAR(30) CHECK (status IN ('pending', 'published', 'failed', 'manual_posting_required')) DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const existing = await client.query(
      "SELECT id FROM platforms WHERE page_id = $1",
      [FACEBOOK_CONFIG.pageId]
    );

    if (existing.rows.length === 0) {
      await client.query(
        `INSERT INTO platforms (name, platform_type, page_id, access_token) VALUES ($1, $2, $3, $4)`,
        [
          "CarSocial Facebook Page",
          "facebook",
          FACEBOOK_CONFIG.pageId,
          FACEBOOK_CONFIG.defaultAccessToken,
        ]
      );
      console.log("✅ Default Facebook platform created");
    } else {
      await client.query(
        `UPDATE platforms SET access_token = $1 WHERE page_id = $2`,
        [FACEBOOK_CONFIG.defaultAccessToken, FACEBOOK_CONFIG.pageId]
      );
      console.log("✅ Updated Facebook platform with new token");
    }

    client.release();
  } catch (error) {
    console.error("❌ Database initialization error:", error);
  }
}

initDatabase();

// ==================== HELPER FUNCTIONS ====================

function formatPostMessage(category, data) {
  let message = `${data.title || ""}\n\n${data.description || ""}\n\n`;

  switch (category) {
    case "car":
      message += `🚗 Car Details:\n`;
      if (data.car_brand) message += `Brand: ${data.car_brand}\n`;
      if (data.car_model) message += `Model: ${data.car_model}\n`;
      if (data.car_year) message += `Year: ${data.car_year}\n`;
      if (data.car_price) message += `Price: $${data.car_price}\n`;
      if (data.car_condition) message += `Condition: ${data.car_condition}\n`;
      if (data.car_mileage) message += `Mileage: ${data.car_mileage}\n`;
      if (data.car_transmission)
        message += `Transmission: ${data.car_transmission}\n`;
      if (data.car_fuel_type) message += `Fuel Type: ${data.car_fuel_type}\n`;
      break;

    case "announcement":
      message += `📢 Announcement Details:\n`;
      if (data.announcement_type)
        message += `Type: ${data.announcement_type}\n`;
      if (data.event_date) message += `Date: ${data.event_date}\n`;
      if (data.event_location) message += `Location: ${data.event_location}\n`;
      break;

    case "news":
      message += `📰 News Details:\n`;
      if (data.news_source) message += `Source: ${data.news_source}\n`;
      if (data.news_author) message += `Author: ${data.news_author}\n`;
      break;

    case "update":
      message += `🔔 Update Details:\n`;
      if (data.update_type) message += `Type: ${data.update_type}\n`;
      if (data.update_priority)
        message += `Priority: ${data.update_priority.toUpperCase()}\n`;
      break;
  }

  return message.trim();
}

async function getPageAccessToken(userAccessToken) {
  try {
    console.log("🔑 Getting page access token...");

    const response = await axios.get(
      `${FACEBOOK_CONFIG.graphUrl}/me/accounts`,
      {
        params: {
          access_token: userAccessToken,
          fields: "id,name,access_token,tasks",
        },
        timeout: 15000,
      }
    );

    const pages = response.data.data || [];

    if (pages.length === 0) {
      return {
        success: false,
        error:
          "No Facebook Pages found. Please ensure you are an admin of a Facebook Page.",
      };
    }

    console.log(`📄 Found ${pages.length} pages`);

    let pageToken = null;
    let pageName = "";
    let selectedPageId = FACEBOOK_CONFIG.pageId;

    for (const page of pages) {
      if (page.id === FACEBOOK_CONFIG.pageId) {
        pageToken = page.access_token;
        pageName = page.name || "Your Page";
        break;
      }
    }

    if (!pageToken && pages.length > 0) {
      const firstPage = pages[0];
      pageToken = firstPage.access_token;
      pageName = firstPage.name || "Your Page";
      selectedPageId = firstPage.id;
      console.log(`🔄 Using first available page: ${pageName}`);
    }

    if (pageToken) {
      return {
        success: true,
        page_access_token: pageToken,
        page_name: pageName,
        page_id: selectedPageId,
      };
    } else {
      return {
        success: false,
        error: "No pages found for this user.",
      };
    }
  } catch (error) {
    console.error(
      "Error getting page access token:",
      error.response?.data || error.message
    );
    return {
      success: false,
      error:
        "Failed to get page access token: " +
        (error.response?.data?.error?.message || error.message),
    };
  }
}

async function getInstagramBusinessAccountId(pageAccessToken, pageId) {
  try {
    console.log("📱 Getting Instagram Business Account ID...");
    console.log(`   Page ID: ${pageId}`);
    console.log(`   Token starts with: ${pageAccessToken.substring(0, 10)}...`);

    const url = `${FACEBOOK_CONFIG.graphUrl}/${pageId}`;
    console.log(`   Request URL: ${url}`);

    const response = await axios.get(url, {
      params: {
        fields: "instagram_business_account",
        access_token: pageAccessToken,
      },
      timeout: 15000,
    });

    console.log("   Response data:", JSON.stringify(response.data, null, 2));

    const igBusinessAccount = response.data.instagram_business_account;

    if (!igBusinessAccount || !igBusinessAccount.id) {
      throw new Error(
        "No Instagram Business Account found. Please ensure:\n" +
          "1. Your Instagram is a Business/Creator account\n" +
          "2. It's connected to your Facebook Page\n" +
          "3. You have admin access to both\n" +
          "4. The Page ID is correct (not App ID)\n\n" +
          "Current Page ID: " +
          pageId +
          "\n" +
          "Page name from token: Check if this is the right page"
      );
    }

    console.log("✅ Instagram Business Account ID:", igBusinessAccount.id);
    return igBusinessAccount.id;
  } catch (error) {
    console.error(
      "Error getting Instagram Business Account:",
      error.response?.data || error.message
    );

    let errorMsg = error.response?.data?.error?.message || error.message;

    if (errorMsg.includes("node type (Application)")) {
      errorMsg =
        "Wrong ID used - you're using an App ID instead of a Page ID. " +
        "Please use your Facebook Page ID, not your App ID. " +
        "Find your Page ID at: https://www.facebook.com/YOUR_PAGE/about";
    }

    throw new Error("Failed to get Instagram Business Account: " + errorMsg);
  }
}

// ==================== FACEBOOK POSTING FUNCTIONS ====================

async function postToFacebookFeed(platform, postData, imagePath) {
  const { access_token } = platform;
  const message = formatPostMessage(postData.category, postData);

  try {
    console.log("📤 Posting to Facebook Page Feed...");

    const pageTokenResult = await getPageAccessToken(access_token);
    if (!pageTokenResult.success) {
      throw new Error(pageTokenResult.error);
    }

    const pageAccessToken = pageTokenResult.page_access_token;
    const pageIdToUse = pageTokenResult.page_id;

    if (imagePath) {
      const form = new FormData();
      form.append("message", message);
      form.append("access_token", pageAccessToken);
      form.append("published", "true");
      form.append("source", require("fs").createReadStream(imagePath));

      const response = await axios.post(
        `${FACEBOOK_CONFIG.graphUrl}/${pageIdToUse}/photos`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 30000,
        }
      );

      console.log("✅ Posted to Facebook Feed with image:", response.data.id);
      return response.data.id;
    } else {
      const response = await axios.post(
        `${FACEBOOK_CONFIG.graphUrl}/${pageIdToUse}/feed`,
        {
          message,
          access_token: pageAccessToken,
        },
        { timeout: 30000 }
      );

      console.log("✅ Posted to Facebook Feed (text only):", response.data.id);
      return response.data.id;
    }
  } catch (error) {
    console.error(
      "Facebook Feed API Error:",
      error.response?.data || error.message
    );
    throw new Error(
      `Facebook Feed posting failed: ${
        error.response?.data?.error?.message || error.message
      }`
    );
  }
}

async function postToFacebookStory(platform, postData, imagePath) {
  const { access_token } = platform;

  try {
    console.log("📱 Attempting Facebook Story post...");

    if (!imagePath) {
      throw new Error("Facebook Stories require an image");
    }

    const pageTokenResult = await getPageAccessToken(access_token);
    if (!pageTokenResult.success) {
      throw new Error(pageTokenResult.error);
    }

    const pageAccessToken = pageTokenResult.page_access_token;
    const pageIdToUse = pageTokenResult.page_id;

    const form = new FormData();
    form.append("access_token", pageAccessToken);
    form.append("source", require("fs").createReadStream(imagePath));

    try {
      const response = await axios.post(
        `${FACEBOOK_CONFIG.graphUrl}/${pageIdToUse}/photo_stories`,
        form,
        {
          headers: form.getHeaders(),
          timeout: 30000,
        }
      );

      console.log("✅ Posted to Facebook Story:", response.data.id);
      return response.data.id;
    } catch (apiError) {
      console.error("❌ Facebook Story API not available");

      const manualData = {
        type: "manual_posting_required",
        platform: "facebook",
        page_id: pageIdToUse,
        image_path: imagePath,
        image_url: postData.image_url,
        target_type: "story",
        instructions: "Facebook Story API is restricted. Please post manually:",
        steps: [
          "1. Download the image from the provided URL",
          "2. Open Facebook app or facebook.com",
          "3. Go to your Page",
          "4. Click 'Create Story'",
          "5. Upload the image",
          "6. Add text/stickers if needed",
          "7. Share to Story",
        ],
        note: "Facebook has restricted Story posting via API for most Pages",
        created_at: new Date().toISOString(),
      };

      throw new Error(JSON.stringify(manualData));
    }
  } catch (error) {
    if (error.message.includes("manual_posting_required")) {
      throw error;
    }

    console.error("Facebook Story Error:", error.message);
    throw new Error(`Facebook Story posting failed: ${error.message}`);
  }
}

// ==================== INSTAGRAM POSTING FUNCTIONS ====================

async function postToInstagramFeed(platform, postData, imagePath) {
  const { access_token, page_id, instagram_business_account_id } = platform;

  try {
    console.log("📱 Posting to Instagram Feed...");

    if (!imagePath) {
      throw new Error("Instagram Feed posts require an image");
    }

    // Get page access token
    const pageTokenResult = await getPageAccessToken(access_token);
    if (!pageTokenResult.success) {
      throw new Error(pageTokenResult.error);
    }

    const pageAccessToken = pageTokenResult.page_access_token;
    const pageIdToUse = page_id || pageTokenResult.page_id;

    // Get Instagram Business Account ID
    let igAccountId = instagram_business_account_id;
    if (!igAccountId) {
      igAccountId = await getInstagramBusinessAccountId(
        pageAccessToken,
        pageIdToUse
      );
    }

    console.log("📸 Creating Instagram container...");

    const caption = formatPostMessage(postData.category, postData);

    // Instagram API requires publicly accessible image URLs (NOT file uploads)
    const publicBaseUrl =
      process.env.PUBLIC_BASE_URL || "https://product-12.onrender.com";
    let fullImageUrl;

    if (publicBaseUrl && !publicBaseUrl.includes("localhost")) {
      // Use configured public URL (e.g., Render deployment or ngrok)
      fullImageUrl = `${publicBaseUrl}${postData.image_url}`;
      console.log("🌐 Using public URL:", fullImageUrl);
    } else {
      // No public URL available - Instagram API cannot access localhost
      fullImageUrl = `http://localhost:${PORT}${postData.image_url}`;
      console.log(
        "⚠️ Localhost URL detected - Instagram cannot access this:",
        fullImageUrl
      );

      // Return manual posting instructions immediately
      const manualData = {
        type: "manual_posting_required",
        platform: "instagram",
        image_path: imagePath,
        image_url: postData.image_url,
        caption: caption,
        target_type: "feed",
        instructions:
          "Instagram API requires publicly accessible URLs. Please post manually:",
        steps: [
          "1. Download the image from: " + fullImageUrl,
          "2. Open Instagram app",
          "3. Create new post",
          "4. Upload the downloaded image",
          "5. Copy and paste this caption:",
          "   " + caption,
          "6. Share to feed",
        ],
        note: "Instagram API cannot access localhost URLs",
        setup_help:
          "For automatic posting, install ngrok and run: ngrok http 5000",
        created_at: new Date().toISOString(),
      };

      throw new Error(JSON.stringify(manualData));
    }

    console.log("📤 Creating Instagram container with image URL...");

    const response = await axios.post(
      `${FACEBOOK_CONFIG.graphUrl}/${igAccountId}/media`,
      {
        image_url: fullImageUrl,
        caption: caption,
        access_token: pageAccessToken,
      },
      { timeout: 30000 }
    );

    console.log("✅ Instagram API Response:", response.data);

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    const containerId = response.data.id;
    if (!containerId) {
      throw new Error("No container ID received from Instagram API");
    }

    console.log("✅ Container created:", containerId);

    // Step 2: Publish the container
    console.log("📤 Publishing to Instagram...");

    const publishResponse = await axios.post(
      `${FACEBOOK_CONFIG.graphUrl}/${igAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: pageAccessToken,
      },
      { timeout: 30000 }
    );

    console.log("✅ Published to Instagram Feed:", publishResponse.data.id);
    return publishResponse.data.id;
  } catch (error) {
    console.error(
      "Instagram Feed API Error:",
      error.response?.data || error.message
    );

    // Check if it's a permissions error
    if (
      error.response?.data?.error?.code === 190 ||
      error.response?.data?.error?.code === 100
    ) {
      const manualData = {
        type: "manual_posting_required",
        platform: "instagram",
        image_path: imagePath,
        image_url: postData.image_url,
        caption: formatPostMessage(postData.category, postData),
        target_type: "feed",
        instructions: "Instagram API error. Please post manually:",
        steps: [
          "1. Download the image",
          "2. Open Instagram app",
          "3. Create new post",
          "4. Paste the caption provided",
          "5. Share to feed",
        ],
        error_details: error.response?.data?.error?.message || error.message,
        created_at: new Date().toISOString(),
      };

      throw new Error(JSON.stringify(manualData));
    }

    throw new Error(
      `Instagram Feed posting failed: ${
        error.response?.data?.error?.message || error.message
      }`
    );
  }
}

async function postToInstagramStory(platform, postData, imagePath) {
  const { access_token, page_id, instagram_business_account_id } = platform;

  try {
    console.log("📱 Posting to Instagram Story...");

    if (!imagePath) {
      throw new Error("Instagram Stories require an image");
    }

    // Get page access token
    const pageTokenResult = await getPageAccessToken(access_token);
    if (!pageTokenResult.success) {
      throw new Error(pageTokenResult.error);
    }

    const pageAccessToken = pageTokenResult.page_access_token;
    const pageIdToUse = page_id || pageTokenResult.page_id;

    // Get Instagram Business Account ID
    let igAccountId = instagram_business_account_id;
    if (!igAccountId) {
      igAccountId = await getInstagramBusinessAccountId(
        pageAccessToken,
        pageIdToUse
      );
    }

    console.log("📸 Creating Instagram Story container...");

    // Instagram API requires publicly accessible image URLs (NOT file uploads)
    const publicBaseUrl =
      process.env.PUBLIC_BASE_URL || "https://product-12.onrender.com";
    let fullImageUrl;

    if (publicBaseUrl && !publicBaseUrl.includes("localhost")) {
      // Use configured public URL (e.g., Render deployment or ngrok)
      fullImageUrl = `${publicBaseUrl}${postData.image_url}`;
      console.log("🌐 Using public URL for Story:", fullImageUrl);
    } else {
      // No public URL available - Instagram API cannot access localhost
      fullImageUrl = `http://localhost:${PORT}${postData.image_url}`;
      console.log(
        "⚠️ Localhost URL detected - Instagram cannot access this:",
        fullImageUrl
      );

      // Return manual posting instructions immediately
      const manualData = {
        type: "manual_posting_required",
        platform: "instagram",
        image_path: imagePath,
        image_url: postData.image_url,
        target_type: "story",
        instructions:
          "Instagram API requires publicly accessible URLs. Please post manually:",
        steps: [
          "1. Download the image from: " + fullImageUrl,
          "2. Open Instagram app",
          "3. Tap Your Story (+)",
          "4. Upload the downloaded image",
          "5. Add text/stickers if needed",
          "6. Share to Story",
        ],
        note: "Instagram API cannot access localhost URLs",
        setup_help:
          "For automatic posting, install ngrok and run: ngrok http 5000",
        created_at: new Date().toISOString(),
      };

      throw new Error(JSON.stringify(manualData));
    }

    console.log("📤 Creating Instagram Story container with image URL...");

    const response = await axios.post(
      `${FACEBOOK_CONFIG.graphUrl}/${igAccountId}/media`,
      {
        image_url: fullImageUrl,
        media_type: "STORIES",
        access_token: pageAccessToken,
      },
      { timeout: 30000 }
    );

    console.log("✅ Instagram Story API Response:", response.data);

    if (response.data.error) {
      throw new Error(response.data.error.message);
    }

    const containerId = response.data.id;
    if (!containerId) {
      throw new Error("No container ID received from Instagram Story API");
    }

    console.log("✅ Story container created:", containerId);

    // Step 2: Publish the story
    console.log("📤 Publishing to Instagram Story...");

    const publishResponse = await axios.post(
      `${FACEBOOK_CONFIG.graphUrl}/${igAccountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: pageAccessToken,
      },
      { timeout: 30000 }
    );

    console.log("✅ Published to Instagram Story:", publishResponse.data.id);
    return publishResponse.data.id;
  } catch (error) {
    console.error(
      "Instagram Story API Error:",
      error.response?.data || error.message
    );

    // Check for permissions or API errors
    if (
      error.response?.data?.error?.code === 190 ||
      error.response?.data?.error?.code === 100 ||
      error.response?.data?.error?.message?.includes("permission")
    ) {
      const manualData = {
        type: "manual_posting_required",
        platform: "instagram",
        image_path: imagePath,
        image_url: postData.image_url,
        target_type: "story",
        instructions: "Instagram Story API error. Please post manually:",
        steps: [
          "1. Download the image",
          "2. Open Instagram app",
          "3. Tap Your Story (+)",
          "4. Select the image",
          "5. Add text/stickers if needed",
          "6. Share to Story",
        ],
        error_details: error.response?.data?.error?.message || error.message,
        created_at: new Date().toISOString(),
      };

      throw new Error(JSON.stringify(manualData));
    }

    throw new Error(
      `Instagram Story posting failed: ${
        error.response?.data?.error?.message || error.message
      }`
    );
  }
}

// ==================== API ROUTES ====================

app.get("/api/platforms", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, platform_type, page_id, instagram_business_account_id, created_at FROM platforms ORDER BY created_at DESC"
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching platforms:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/platforms/instagram/setup", async (req, res) => {
  try {
    const { name, access_token, page_id } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
      });
    }

    console.log("🔧 Setting up Instagram platform...");

    const pageTokenResult = await getPageAccessToken(access_token);
    if (!pageTokenResult.success) {
      return res.status(400).json({
        success: false,
        error: pageTokenResult.error,
      });
    }

    const pageIdToUse = page_id || pageTokenResult.page_id;
    const pageAccessToken = pageTokenResult.page_access_token;

    let igAccountId;
    try {
      igAccountId = await getInstagramBusinessAccountId(
        pageAccessToken,
        pageIdToUse
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    const platformName = name || `Instagram - ${pageTokenResult.page_name}`;

    const result = await pool.query(
      "INSERT INTO platforms (name, page_id, access_token, instagram_business_account_id, platform_type) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [platformName, pageIdToUse, access_token, igAccountId, "instagram"]
    );

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        name: platformName,
        platform_type: "instagram",
        page_id: pageIdToUse,
        instagram_business_account_id: igAccountId,
      },
      message: "Instagram platform setup successfully",
    });
  } catch (error) {
    console.error("Instagram setup error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/platforms", async (req, res) => {
  try {
    const { name, page_id, access_token, platform_type } = req.body;

    if (!name || !platform_type) {
      return res.status(400).json({
        success: false,
        error: "Platform name and type are required",
      });
    }

    const result = await pool.query(
      "INSERT INTO platforms (name, page_id, access_token, platform_type) VALUES ($1, $2, $3, $4) RETURNING *",
      [name, page_id, access_token, platform_type]
    );

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        name,
        platform_type,
        page_id,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put("/api/platforms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, page_id, access_token, platform_type } = req.body;

    await pool.query(
      "UPDATE platforms SET name=$1, page_id=$2, access_token=$3, platform_type=$4 WHERE id=$5",
      [name, page_id, access_token, platform_type, id]
    );

    res.json({ success: true, message: "Platform updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/api/platforms/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM posts WHERE platform_id = $1", [id]);
    await pool.query("DELETE FROM platforms WHERE id = $1", [id]);
    res.json({ success: true, message: "Platform deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Main posting endpoint
app.post("/api/posts", upload.single("image"), async (req, res) => {
  try {
    const { category, title, description, platform_id, target_type } = req.body;
    // Normalize target_type values coming from frontend (e.g. 'user')
    // to match the DB CHECK constraint which allows: 'page','feed','story'
    let normalizedTargetType = target_type;
    if (!normalizedTargetType) normalizedTargetType = "feed";
    if (normalizedTargetType === "user") normalizedTargetType = "feed";

    const imagePath = req.file ? req.file.path : null;
    const image_url = req.file
      ? `/uploads/${req.body.category || "general"}/${req.file.filename}`
      : null;

    console.log("📝 Post request:", {
      category,
      title,
      target_type,
      platform_id,
      image_url,
    });

    const platformsResult = await pool.query(
      "SELECT * FROM platforms WHERE id=$1",
      [platform_id]
    );

    if (platformsResult.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Platform not found" });
    }

    const platform = platformsResult.rows[0];
    const postData = { category, title, description, image_url, ...req.body };

    let platformPostId = null;
    let status = "pending";
    let errorMessage = null;

    try {
      if (platform.platform_type === "facebook") {
        if (normalizedTargetType === "story") {
          platformPostId = await postToFacebookStory(
            platform,
            postData,
            imagePath
          );
        } else {
          platformPostId = await postToFacebookFeed(
            platform,
            postData,
            imagePath
          );
        }
        status = "published";
      } else if (platform.platform_type === "instagram") {
        if (normalizedTargetType === "story") {
          platformPostId = await postToInstagramStory(
            platform,
            postData,
            imagePath
          );
        } else {
          platformPostId = await postToInstagramFeed(
            platform,
            postData,
            imagePath
          );
        }
        status = "published";
      } else {
        throw new Error("Platform not supported: " + platform.platform_type);
      }

      console.log(
        `✅ Successfully posted to ${platform.platform_type} ${normalizedTargetType}`
      );
    } catch (error) {
      try {
        const manualData = JSON.parse(error.message);
        if (manualData.type === "manual_posting_required") {
          status = "manual_posting_required";
          errorMessage = JSON.stringify(manualData);
          console.log("📋 Manual posting required:", manualData.platform);
        } else {
          status = "failed";
          errorMessage = error.message;
        }
      } catch (parseError) {
        status = "failed";
        errorMessage = error.message;
      }
      console.error("Publishing error:", errorMessage);
    }

    const result = await pool.query(
      `INSERT INTO posts (
        category, title, description, image_url, platform_id, target_type, 
        platform_post_id, status, error_message,
        car_brand, car_model, car_year, car_price, car_condition, car_mileage, 
        car_transmission, car_fuel_type, announcement_type, event_date, event_location,
        news_source, news_author, update_type, update_priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24) RETURNING *`,
      [
        category,
        title,
        description,
        image_url || null,
        platform_id,
        normalizedTargetType,
        platformPostId || null,
        status,
        errorMessage || null,
        req.body.car_brand || null,
        req.body.car_model || null,
        req.body.car_year || null,
        req.body.car_price || null,
        req.body.car_condition || null,
        req.body.car_mileage || null,
        req.body.car_transmission || null,
        req.body.car_fuel_type || null,
        req.body.announcement_type || null,
        req.body.event_date || null,
        req.body.event_location || null,
        req.body.news_source || null,
        req.body.news_author || null,
        req.body.update_type || null,
        req.body.update_priority || null,
      ]
    );

    const responseData = {
      id: result.rows[0].id,
      platform_post_id: platformPostId,
      status,
      error_message: errorMessage,
    };

    if (status === "manual_posting_required" && errorMessage) {
      try {
        const manualData = JSON.parse(errorMessage);
        responseData.manual_posting = manualData;
      } catch (e) {
        // Ignore parse errors
      }
    }

    res.json({
      success: status === "published" || status === "manual_posting_required",
      data: responseData,
      message:
        status === "published"
          ? "Post published successfully"
          : status === "manual_posting_required"
          ? "Manual posting required - see instructions"
          : "Post failed to publish",
    });
  } catch (error) {
    console.error("Post creation error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/posts", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, pl.name as platform_name, pl.platform_type 
      FROM posts p 
      LEFT JOIN platforms pl ON p.platform_id = pl.id 
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.*, pl.name as platform_name, pl.platform_type 
       FROM posts p 
       LEFT JOIN platforms pl ON p.platform_id = pl.id 
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    const post = result.rows[0];

    if (post.status === "manual_posting_required" && post.error_message) {
      try {
        post.manual_posting_data = JSON.parse(post.error_message);
      } catch (e) {
        // Ignore parse errors
      }
    }

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ success: true, message: "Server and database are running" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Database connection failed" });
  }
});

// Get all pages for a user token - HELPER ENDPOINT
app.post("/api/get-my-pages", async (req, res) => {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
      });
    }

    console.log("📋 Fetching user's Facebook Pages...");

    const response = await axios.get(
      `${FACEBOOK_CONFIG.graphUrl}/me/accounts`,
      {
        params: {
          access_token: access_token,
          fields: "id,name,access_token,instagram_business_account",
        },
        timeout: 15000,
      }
    );

    const pages = response.data.data || [];

    if (pages.length === 0) {
      return res.json({
        success: false,
        error: "No Facebook Pages found for this user",
        help: "Make sure you are an admin of at least one Facebook Page",
      });
    }

    const pagesWithDetails = pages.map((page) => ({
      page_id: page.id,
      page_name: page.name,
      has_instagram: !!page.instagram_business_account,
      instagram_account_id: page.instagram_business_account?.id || null,
    }));

    res.json({
      success: true,
      data: {
        pages: pagesWithDetails,
        count: pages.length,
      },
      message: `Found ${pages.length} Facebook Page(s)`,
      instructions: [
        "Use the 'page_id' value when setting up Instagram platform",
        "Make sure 'has_instagram' is true for Instagram posting",
        "If 'has_instagram' is false, connect Instagram to this Page first",
      ],
    });
  } catch (error) {
    console.error(
      "Error fetching pages:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message,
    });
  }
});

// Test endpoint for Instagram setup
app.post("/api/test-instagram-connection", async (req, res) => {
  try {
    const { access_token, page_id } = req.body;

    if (!access_token) {
      return res.status(400).json({
        success: false,
        error: "Access token is required",
      });
    }

    console.log("🧪 Testing Instagram connection...");

    const pageTokenResult = await getPageAccessToken(access_token);
    if (!pageTokenResult.success) {
      return res.status(400).json({
        success: false,
        error: pageTokenResult.error,
      });
    }

    const pageIdToUse = page_id || pageTokenResult.page_id;
    const pageAccessToken = pageTokenResult.page_access_token;

    let igAccountId;
    try {
      igAccountId = await getInstagramBusinessAccountId(
        pageAccessToken,
        pageIdToUse
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        help: [
          "Make sure your Instagram account is a Business or Creator account",
          "Connect your Instagram to your Facebook Page in Instagram settings",
          "Ensure you have admin access to both accounts",
        ],
      });
    }

    res.json({
      success: true,
      data: {
        page_id: pageIdToUse,
        page_name: pageTokenResult.page_name,
        instagram_business_account_id: igAccountId,
      },
      message: "Instagram connection successful!",
    });
  } catch (error) {
    console.error("Test connection error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate platform endpoint
app.get("/api/platforms/:id/validate", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM platforms WHERE id = $1", [
      id,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Platform not found" });
    }

    const platform = result.rows[0];

    if (!platform.access_token) {
      return res.json({
        success: false,
        error: "No access token configured for this platform",
      });
    }

    if (platform.platform_type === "facebook") {
      const pageTokenResult = await getPageAccessToken(platform.access_token);

      res.json({
        success: pageTokenResult.success,
        data: {
          platform: {
            id: platform.id,
            name: platform.name,
            platform_type: platform.platform_type,
          },
          page_info: pageTokenResult.success
            ? {
                page_id: pageTokenResult.page_id,
                page_name: pageTokenResult.page_name,
              }
            : null,
        },
        error: pageTokenResult.error || null,
      });
    } else if (platform.platform_type === "instagram") {
      try {
        const pageTokenResult = await getPageAccessToken(platform.access_token);
        if (!pageTokenResult.success) {
          return res.json({
            success: false,
            error: pageTokenResult.error,
          });
        }

        const pageIdToUse = platform.page_id || pageTokenResult.page_id;
        const igAccountId = await getInstagramBusinessAccountId(
          pageTokenResult.page_access_token,
          pageIdToUse
        );

        res.json({
          success: true,
          data: {
            platform: {
              id: platform.id,
              name: platform.name,
              platform_type: platform.platform_type,
            },
            instagram_info: {
              page_id: pageIdToUse,
              page_name: pageTokenResult.page_name,
              instagram_business_account_id: igAccountId,
            },
          },
        });
      } catch (error) {
        res.json({
          success: false,
          error: error.message,
        });
      }
    } else {
      res.json({
        success: false,
        error: "Platform type not supported for validation",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
ensureBaseDir()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Upload directory: ${BASE_DIR}`);
      console.log(`📱 Instagram posting: ENABLED ✅ (Direct file upload)`);
      console.log(`\n📋 Available endpoints:`);
      console.log(
        `   POST /api/platforms/instagram/setup - Setup Instagram platform`
      );
      console.log(
        `   POST /api/test-instagram-connection - Test Instagram connection`
      );
      console.log(`   POST /api/posts - Create and publish post`);
      console.log(`   GET  /api/posts - Get all posts`);
      console.log(
        `   GET  /api/platforms/:id/validate - Validate platform token`
      );
      console.log(`\n✅ Instagram posting uses DIRECT FILE UPLOADS`);
      console.log(`✅ No ngrok or public URLs required`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });
