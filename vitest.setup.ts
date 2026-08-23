import { config } from "dotenv";
import "@testing-library/jest-dom/vitest";

config({ path: ".env.test" });
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
