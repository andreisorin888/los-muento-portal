import cron from "node-cron";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { db } from "./db";

type Sendable = { send: TextChannel["send"] };

const CH = {
  announcements: process.env.DISCORD_ANNOUNCEMENTS_CHANNEL ?? "",
  events:        process.env.DISCORD_EVENTS_CHANNEL ?? "",
  rankings:      process.env.DISCORD_RANKINGS_CHANNEL ?? "",
  alerts:        process.env.DISCORD_ALERTS_CHANNEL ?? "",
  tasks:         process.env.DISCORD_TASKS_CHANNEL ?? "",
  territories:   process.env.DISCORD_TERRITORIES_CHANNEL ?? "",
  family:        process.env.DISCORD_FAMILY_CHANNEL ?? "",
};

async function fetchChannel(client: Client, id: string): Promise<Sendable | null> {
  if (!id) return null;
  const raw = await client.channels.fetch(id).catch(() => null);
  if (!raw?.isTextBased()) return null;
  return raw as unknown as Sendable;
}

// ── Post unposted announcements ───────────────────────────────────────────────

export async function postPendingAnnouncements(client: Client) {
  const channel = await fetchChannel(client, CH.announcements);
  if (!channel) return;

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
  const channel = await fetchChannel(client, CH.events);
  if (!channel) return;

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
  const channel = await fetchChannel(client, CH.rankings);
  if (!channel) return;

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
  const LOW_THRESHOLD = 100_000;
  const chest = await db.chest.findFirst({ select: { balance: true } });
  if (!chest || chest.balance > LOW_THRESHOLD) return;

  const channel = await fetchChannel(client, CH.alerts);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setTitle("⚠️ Sold seif redus")
    .setDescription(`Soldul seifului a scăzut sub $${LOW_THRESHOLD.toLocaleString("ro-RO")}. Sold actual: $${chest.balance.toLocaleString("ro-RO")}.`)
    .setColor(0xef4444)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(console.error);
}

// ── Monthly winner announcement ───────────────────────────────────────────────

async function announceMonthlyWinner(client: Client) {
  const channel = await fetchChannel(client, CH.rankings);
  if (!channel) return;

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

  const embed = new EmbedBuilder()
    .setTitle("🏆 Gangsterul Lunii")
    .setDescription(
      `Felicitări **${winner.winner.name}** (${winner.winner.rankName})!\n${winner.note ?? "Cel mai bun performer al lunii trecute."}`
    )
    .setColor(0xf59e0b)
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(console.error);
}

// ── Varianta C: Task săptămânal publicat → #taskuri ──────────────────────────

async function notifyNewWeeklyTask(client: Client) {
  const channel = await fetchChannel(client, CH.tasks);
  if (!channel) return;

  const tasks = await db.weeklyTask.findMany({
    where: { status: "ACTIV", discordPostedAt: null },
    include: { createdBy: { select: { name: true, rankName: true } } },
    orderBy: { createdAt: "asc" },
  });

  for (const task of tasks) {
    const target = task.targetJson as {
      rankMin: number; rankMax: number; crewIds: string[]; roles: string[];
    };
    const targetText =
      target.rankMin === 20 && target.rankMax === 100 &&
      target.crewIds.length === 0 && target.roles.length === 0
        ? "Toți membrii"
        : [
            `Grade ${target.rankMin}–${target.rankMax}`,
            target.roles.length > 0 ? target.roles.join(", ") : null,
          ].filter(Boolean).join(" · ");

    const embed = new EmbedBuilder()
      .setTitle(`📋 Task săptămânal nou: ${task.title}`)
      .setDescription(task.description ?? "Fă predarea din portal când ești gata.")
      .addFields({ name: "Destinatari", value: targetText, inline: true })
      .setColor(0xec4899)
      .setFooter({ text: `Publicat de ${task.createdBy.name} · ${task.createdBy.rankName}` })
      .setTimestamp(task.createdAt);

    await channel.send({ embeds: [embed] }).catch(console.error);
    await db.weeklyTask.update({
      where: { id: task.id },
      data: { discordPostedAt: new Date() },
    });
  }
}

// ── Varianta C: Predare nouă → DM Boss/Underboss ─────────────────────────────

async function notifyPendingSubmissions(client: Client) {
  const pending = await db.weeklyTaskSubmission.findMany({
    where: { status: "PREDAT", discordNotifiedAt: null },
    include: {
      member: { select: { name: true, memberCode: true } },
      task: { select: { title: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  if (pending.length === 0) return;

  const leaders = await db.member.findMany({
    where: { rankLevel: { gte: 90 }, status: "ACTIV", discordId: { not: null } },
    select: { discordId: true },
  });
  if (leaders.length === 0) return;

  for (const sub of pending) {
    const embed = new EmbedBuilder()
      .setTitle("🔔 Predare de confirmat")
      .setDescription(
        `**${sub.member.name}** (${sub.member.memberCode}) a predat taskul:\n**${sub.task.title}**`
      )
      .setColor(0xf59e0b)
      .setTimestamp(sub.createdAt);

    if (sub.note) embed.addFields({ name: "Notă", value: sub.note });

    for (const leader of leaders) {
      try {
        const user = await client.users.fetch(leader.discordId!);
        await user.send({ embeds: [embed] });
      } catch {
        // DMs disabled or invalid Discord ID — skip silently
      }
    }

    await db.weeklyTaskSubmission.update({
      where: { id: sub.id },
      data: { discordNotifiedAt: new Date() },
    });
  }
}

// ── Varianta C: Teritoriu schimbat → #teritorii ───────────────────────────────

async function notifyTerritoryChanges(client: Client) {
  const channel = await fetchChannel(client, CH.territories);
  if (!channel) return;

  const STATUS_LABEL: Record<string, string> = {
    CONTROLAT: "Controlat 🟢",
    CONTESTAT: "Contestat 🟡",
    NEUTRU: "Neutru ⚪",
    CU_ARME: "Cu arme 🟢",
    FARA_ARME: "Fără arme 🔴",
  };
  const STATUS_COLOR: Record<string, number> = {
    CONTROLAT: 0x10b981,
    CU_ARME:   0x10b981,
    CONTESTAT: 0xf59e0b,
    FARA_ARME: 0xef4444,
    NEUTRU:    0x6b7280,
  };

  const changes = await db.territoryHistory.findMany({
    where: { discordPostedAt: null },
    include: {
      territory: { select: { name: true, zone: true } },
      changedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  for (const ch of changes) {
    const description = ch.fromStatus
      ? `${STATUS_LABEL[ch.fromStatus] ?? ch.fromStatus} → ${STATUS_LABEL[ch.toStatus] ?? ch.toStatus}`
      : `Status setat: ${STATUS_LABEL[ch.toStatus] ?? ch.toStatus}`;

    const fields: { name: string; value: string; inline: boolean }[] = [];
    if (ch.territory.zone) fields.push({ name: "Zonă", value: ch.territory.zone, inline: true });
    if (ch.note) fields.push({ name: "Notă", value: ch.note, inline: true });

    const embed = new EmbedBuilder()
      .setTitle(`🗺️ Teritoriu: ${ch.territory.name}`)
      .setDescription(description)
      .addFields(fields)
      .setColor(STATUS_COLOR[ch.toStatus] ?? 0x6b7280)
      .setFooter({ text: `Modificat de ${ch.changedBy.name}` })
      .setTimestamp(ch.createdAt);

    await channel.send({ embeds: [embed] }).catch(console.error);
    await db.territoryHistory.update({
      where: { id: ch.id },
      data: { discordPostedAt: new Date() },
    });
  }
}

// ── Varianta C: Recrutare aprobată → #familie ────────────────────────────────

async function notifyApprovedRecruits(client: Client) {
  const channel = await fetchChannel(client, CH.family);
  if (!channel) return;

  const recruits = await db.recruit.findMany({
    where: { status: "APROBAT", discordNotifiedAt: null },
    include: { recruitedBy: { select: { name: true, rankName: true } } },
    orderBy: { approvedAt: "asc" },
  });

  for (const r of recruits) {
    const embed = new EmbedBuilder()
      .setTitle("🤝 Nou membru acceptat!")
      .setDescription(
        `**${r.discordName}** a trecut de probație și a fost acceptat în familie.\nBine ai venit, ${r.discordName}!`
      )
      .addFields({
        name: "Recrutor",
        value: `${r.recruitedBy.name} · ${r.recruitedBy.rankName}`,
        inline: true,
      })
      .setColor(0x10b981)
      .setTimestamp(r.approvedAt ?? r.updatedAt);

    await channel.send({ embeds: [embed] }).catch(console.error);
    await db.recruit.update({
      where: { id: r.id },
      data: { discordNotifiedAt: new Date() },
    });
  }
}

// ── Register all cron jobs ────────────────────────────────────────────────────

export function registerSchedules(client: Client) {
  // Existing jobs
  cron.schedule("*/2 * * * *", () => postPendingAnnouncements(client));
  cron.schedule("*/30 * * * *", () => sendEventReminders(client));
  cron.schedule("0 9 * * 1", () => sendWeeklyRankings(client));
  cron.schedule("0 10 1 * *", () => announceMonthlyWinner(client));
  cron.schedule("0 12 * * *", () => checkChestBalance(client));

  // Varianta C — new notifications
  cron.schedule("*/2 * * * *", () => notifyNewWeeklyTask(client));
  cron.schedule("*/5 * * * *", () => notifyPendingSubmissions(client));
  cron.schedule("*/2 * * * *", () => notifyTerritoryChanges(client));
  cron.schedule("*/5 * * * *", () => notifyApprovedRecruits(client));
}
