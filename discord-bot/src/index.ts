import { Client, GatewayIntentBits } from "discord.js";
import { db } from "./db";
import { registerSchedules } from "./scheduler";

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error("DISCORD_TOKEN missing. Set it in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async (c) => {
  console.log(`✅ Bot ready: ${c.user.tag}`);

  await db.$connect().catch((e: unknown) => {
    console.error("DB connection failed:", e);
    process.exit(1);
  });

  registerSchedules(client);
  console.log("🗓️  Schedules registered.");
});

client.on("error", (e) => console.error("Discord client error:", e));

client.login(TOKEN);

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  await db.$disconnect();
  client.destroy();
  process.exit(0);
});
