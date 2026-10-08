require("dotenv").config();
const { spawnSync } = require("child_process");

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl) {
  console.error("Falta TEST_DATABASE_URL en backend/.env");
  process.exit(1);
}

const [cmd, ...args] = process.argv.slice(2);
const result = spawnSync(cmd, args, {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: testUrl },
});

process.exit(result.status ?? 1);
