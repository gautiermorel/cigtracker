import fs from "fs/promises";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = resolve(__dirname, "package.json");

const pkgRaw = await fs.readFile(packagePath, "utf8");
const pkg = JSON.parse(pkgRaw);

const parts = pkg.version.split(".");
parts[2] = parseInt(parts[2] || "0") + 1;
pkg.version = parts.join(".");

await fs.writeFile(packagePath, JSON.stringify(pkg, null, 2), "utf8");
console.log(`✅ Version bump: ${pkg.version}`);

const distVersionPath = resolve(__dirname, "public/version.json");
await fs.writeFile(distVersionPath, JSON.stringify({ version: pkg.version }), "utf8");


console.log("📦 Building project...");
await execAsync("npm run build", { stdio: "inherit" }).catch(console.error);

console.log("🚀 Deploying to Firebase...");
await execAsync("firebase deploy", { stdio: "inherit" }).catch(console.error);
