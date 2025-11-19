#!/usr/bin/env node

const { spawn, exec } = require("child_process");
const axios = require("axios");

console.log("🚀 Starting Social Publisher with Instagram Auto-Posting...\n");

// Function to check if ngrok is available
function checkNgrok() {
  return new Promise((resolve) => {
    exec("ngrok version", (error) => {
      resolve(!error);
    });
  });
}

// Function to start ngrok
function startNgrok() {
  return new Promise((resolve, reject) => {
    console.log("🌐 Starting ngrok tunnel...");

    const ngrok = spawn("ngrok", ["http", "5000"], {
      detached: true,
      stdio: "pipe",
    });

    // Wait for ngrok to start
    setTimeout(async () => {
      try {
        const response = await axios.get("http://127.0.0.1:4040/api/tunnels");
        const tunnel = response.data.tunnels.find((t) => t.proto === "https");

        if (tunnel) {
          console.log(`✅ ngrok tunnel started: ${tunnel.public_url}`);
          resolve(tunnel.public_url);
        } else {
          reject(new Error("No HTTPS tunnel found"));
        }
      } catch (error) {
        reject(error);
      }
    }, 3000);
  });
}

// Function to start the server
function startServer(publicUrl) {
  console.log(`🚀 Starting server with Instagram posting enabled...`);

  const env = { ...process.env };
  if (publicUrl) {
    env.PUBLIC_BASE_URL = publicUrl;
  }

  const server = spawn("npm", ["start"], {
    stdio: "inherit",
    env: env,
    shell: true,
  });

  server.on("close", (code) => {
    console.log(`Server exited with code ${code}`);
  });

  return server;
}

// Main function
async function main() {
  try {
    // Check if ngrok is available
    const ngrokAvailable = await checkNgrok();

    if (!ngrokAvailable) {
      console.log("❌ ngrok not found!\n");
      console.log("Please install ngrok:");
      console.log("1. Go to https://ngrok.com/download");
      console.log("2. Download and install ngrok");
      console.log(
        "3. Get auth token from https://dashboard.ngrok.com/get-started/your-authtoken"
      );
      console.log("4. Run: ngrok authtoken YOUR_AUTH_TOKEN\n");
      console.log("Starting server without Instagram auto-posting...");
      startServer();
      return;
    }

    // Start ngrok
    try {
      const publicUrl = await startNgrok();
      console.log(`\n✅ Instagram automatic posting is now ENABLED!`);
      console.log(`🌐 Public URL: ${publicUrl}\n`);

      // Start server with public URL
      startServer(publicUrl);
    } catch (error) {
      console.log(`❌ Failed to start ngrok: ${error.message}`);
      console.log("Starting server without Instagram auto-posting...");
      startServer();
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Handle cleanup
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down...");
  exec("pkill -f ngrok", () => {
    process.exit(0);
  });
});

main();
