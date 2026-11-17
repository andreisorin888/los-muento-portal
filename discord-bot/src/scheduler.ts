import cron from "node-cron";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { db } from "./db";

type Sendable = { send: TextChannel["send"] };

const CH = {
  announcements: process.env.DISCORD_ANNOUNCEMENTS_CHANNEL ?? "",
  events: process.env.DISCORD_EVENTS_CHANNEL ?? "",
  rankings: process.env.DISCORD_RANKINGS_CHANNEL ?? "",
  alerts: process.env.DISCORD_ALERTS_CHANNEL ?? "",
};

// ── Post unposted announcements ───────────────────────────────────────────────

export async function postPendingAnnouncements(client: Client) {
  if (!CH.announcements) return;
  const raw = await client.channels.fetch(CH.announcements).catch(() => null);
  if (!raw?.isTextBased()) return;
  const channel = raw as unknown as Sendable;

  const pending = await db.announcement.findMany({
    where: { discordPostedAt: null },
    include: { author: { select: { name: true, rankName: true } } },
    orderBy: { createdAt: "asc" },
  });

  for (const ann of pending) {
    const embed = new EmbedBuilder()
      .setTitle(`📢 ${ann.title}`)
      .setDescription(ann.body)
      .setColor(0xec4899)
      .setFooter({ text: `${ann.author.name} · ${ann.author.rankName}` })
      .setTimestamp(ann.createdAt);

    await channel.send({ embeds: [embed] }).catch(console.error);
    await db.announcement.update({
      where: { id: ann.id },
      data: { discordPostedAt: new Date() },
    });
  }
}

// ── Event reminders (24h before) ─────────────────────────────────────────────

export async function sendEventReminders(client: Client) {
  if (!CH.events) return;
  const raw = await client.channels.fetch(CH.events).catch(() => null);
  if (!raw?.isTextBased()) return;
  const channel = raw as unknown as Sendable;

  const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const events = await db.orgEvent.findMany({
    where: {
      scheduledAt: { gte: new Date(), lte: in24h },
      reminderSentAt: null,
    },
  });

  for (const ev of events) {
    const embed = new EmbedBuilder()
      .setTitle(`🗓️ Mâine: ${ev.title}`)
      .setDescription(ev.description ?? "Fii pregătit.")
      .setColor(0xa855f7)
      .setFooter({ text: ev.type })
      .setTimestamp(ev.scheduledAt);

    await channel.send({ embeds: [embed] }).catch(console.error);
    await db.orgEvent.update({
      where: { id: ev.id },
      data: { reminderSentAt: new Date() },
    });
  }
}

// ── Weekly rankings report (every Monday 09:00) ───────────────────────────────

async function sendWeeklyRankings(client: Client) {
  if (!CH.rankings) return;
  const raw = await client.channels.fetch(CH.rankings).catch(() => null);
  if (!raw?.isTextBased()) return;
  const channel = raw as unknown as Sendable;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const rows = await db.activity.groupBy({
    by: ["memberId"],
    where: { createdAt: { gte: startOfWeek } },
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: 10,
  });

  const memberIds = rows.map((r) => r.memberId);
  const members = await db.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, name: true, rankName: true },
  });
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));

  const lines = rows.map((r, i) => {
    const m = memberMap[r.memberId];
    const pts = r._sum.points ?? 0;
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    return `${medal} **${m?.name ?? "?"}** (${m?.rankName ?? "?"}) — ${pts} puncte`;
  });

  const embed = new EmbedBuilder()
    .setTitle("🏆 Top săptămânal LOS MUENTO")
    .setDescription(lines.join("\n") || "Nicio activitate săptămâna aceasta.")
    .setColor(0xf59e0b)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(console.error);
}

// ── Low chest alert ───────────────────────────────────────────────────────────

async function checkChestBalance(client: Client) {
  if (!CH.alerts) return;
  const LOW_THRESHOLD = 100_000;
  const chest = await db.chest.findFirst({ select: { balance: true } });
  if (!chest || chest.balance > LOW_THRESHOLD) return;

  const raw = await client.channels.fetch(CH.alerts).catch(() => null);
  if (!raw?.isTextBased()) return;
  const channel = raw as unknown as Sendable;

  const embed = new EmbedBuilder()
    .setTitle("⚠️ Sold seif redus")
    .setDescription(`Soldul seifului a scăzut sub $${LOW_THRESHOLD.toLocaleString("ro-RO")}. Sold actual: $${chest.balance.toLocaleString("ro-RO")}.`)
    .setColor(0xef4444)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(console.error);
}

// ── Monthly winner announcement ───────────────────────────────────────────────

async function announceMonthlyWinner(client: Client) {
  if (!CH.rankings) return;
  const now = new Date();
  const winner = await db.monthlyWinner.findUnique({
    where: {
      year_month: {
        year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
        month: now.getMonth() === 0 ? 12 : now.getMonth(),
      },
    },
    include: { winner: { select: { name: true, rankName: true } } },
  });

  if (!winner) return;

  const raw = await client.channels.fetch(CH.rankings).catch(() => null);
  if (!raw?.isTextBased()) return;
  const channel = raw as unknown as Sendable;

  const embed = new EmbedBuilder()
    .setTitle("🏆 Gangsterul Lunii")
    .setDescription(
      `Felicitări **${winner.winner.name}** (${winner.winner.rankName})!\n${winner.note ?? "Cel mai bun performer al lunii trecute."}`
    )
    .setColor(0xf59e0b)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(console.error);
}

// ── Register all cron jobs ────────────────────────────────────────────────────

export function registerSchedules(client: Client) {
  // Check for new announcements every 2 minutes
  cron.schedule("*/2 * * * *", () => postPendingAnnouncements(client));

  // Check for event reminders every 30 minutes
  cron.schedule("*/30 * * * *", () => sendEventReminders(client));

  // Weekly rankings — every Monday at 09:00
  cron.schedule("0 9 * * 1", () => sendWeeklyRankings(client));

  // Monthly winner — 1st of month at 10:00
  cron.schedule("0 10 1 * *", () => announceMonthlyWinner(client));

  // Low chest check — daily at noon
  cron.schedule("0 12 * * *", () => checkChestBalance(client));
}
