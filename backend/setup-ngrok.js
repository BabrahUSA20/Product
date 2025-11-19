const https = require("https");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const os = require("os");

console.log("🚀 Setting up ngrok for Instagram posting...");

// Detect platform
const platform = os.platform();
const isWindows = platform === "win32";

// ngrok download URLs
const ngrokUrls = {
  win32:
    "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip",
  linux: "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz",
  darwin:
    "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-darwin-amd64.zip",
};

const downloadUrl = ngrokUrls[platform];
const fileName = path.basename(downloadUrl);
const extractedFileName = isWindows ? "ngrok.exe" : "ngrok";

if (!downloadUrl) {
  console.error("❌ Unsupported platform:", platform);
  process.exit(1);
}

// Create downloads directory
const downloadDir = path.join(__dirname, "tools");
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

const filePath = path.join(downloadDir, fileName);
const extractedPath = path.join(downloadDir, extractedFileName);

// Check if ngrok already exists
if (fs.existsSync(extractedPath)) {
  console.log("✅ ngrok already installed");
  runNgrok();
  return;
}

console.log("📥 Downloading ngrok...");

// Download ngrok
const file = fs.createWriteStream(filePath);
https
  .get(downloadUrl, (response) => {
    response.pipe(file);

    file.on("finish", () => {
      file.close();
      console.log("✅ Downloaded successfully");

      // Extract based on platform
      if (isWindows) {
        // For Windows (ZIP)
        console.log("📦 Extracting ZIP file...");
        const AdmZip = require("adm-zip");
        try {
          const zip = new AdmZip(filePath);
          zip.extractAllTo(downloadDir, true);
          console.log("✅ Extracted successfully");

          // Clean up zip file
          fs.unlinkSync(filePath);
          runNgrok();
        } catch (error) {
          console.error("❌ Failed to extract ZIP. Trying manual method...");
          manualInstructions();
        }
      } else {
        // For Linux/macOS (TAR.GZ)
        console.log("📦 Extracting TAR.GZ file...");
        exec(`cd "${downloadDir}" && tar -xzf "${fileName}"`, (error) => {
          if (error) {
            console.error("❌ Failed to extract:", error.message);
            manualInstructions();
            return;
          }

          console.log("✅ Extracted successfully");
          // Clean up tar file
          fs.unlinkSync(filePath);
          runNgrok();
        });
      }
    });
  })
  .on("error", (err) => {
    console.error("❌ Download failed:", err.message);
    manualInstructions();
  });

function runNgrok() {
  console.log("🌐 Starting ngrok tunnel...");
  console.log("");
  console.log("📋 Instructions:");
  console.log("1. Sign up for free at: https://ngrok.com/signup");
  console.log(
    "2. Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken"
  );
  console.log("3. Run this command with your token:");
  console.log(`   "${extractedPath}" authtoken YOUR_TOKEN_HERE`);
  console.log("4. Start the tunnel:");
  console.log(`   "${extractedPath}" http 5000`);
  console.log("");
  console.log("5. Copy the https URL (e.g., https://abc123.ngrok.io)");
  console.log("6. Restart your server with:");
  console.log("   PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io npm start");
  console.log("");
  console.log("✅ Setup complete! Follow the instructions above.");
}

function manualInstructions() {
  console.log("");
  console.log("🛠️ Manual Setup Required");
  console.log("Please install ngrok manually:");
  console.log("");
  console.log("1. Go to: https://ngrok.com/download");
  console.log("2. Download ngrok for your platform");
  console.log("3. Extract and place in your PATH");
  console.log("4. Run: ngrok authtoken YOUR_TOKEN");
  console.log("5. Run: ngrok http 5000");
  console.log("6. Copy the https URL and restart server with:");
  console.log("   PUBLIC_BASE_URL=https://your-url.ngrok.io npm start");
}
