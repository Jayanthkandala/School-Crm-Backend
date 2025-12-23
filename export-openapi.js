const fs = require("fs");

// IMPORTANT: this path matches your screenshot
const specs = require("./src/config/swagger");

fs.writeFileSync("openapi.json", JSON.stringify(specs, null, 2));
console.log("✅ openapi.json generated successfully");
