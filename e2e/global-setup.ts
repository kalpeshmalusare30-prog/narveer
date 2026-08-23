import { execSync } from "child_process";

// Ensure the TEST database has schema + seed data (org, admin, roles, config)
// before E2E runs. Kept separate from the real dev database.
export default async function globalSetup() {
  const run = (cmd: string) =>
    execSync(cmd, { stdio: "inherit", env: { ...process.env } });
  run("dotenv -e .env.test -- prisma migrate deploy");
  run("dotenv -e .env.test -- tsx prisma/seed.ts");
}
