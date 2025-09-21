import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getWeeklyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Get all appointments for this week
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => q.gte(q.field("date"), weekStartStr))
      .filter((q) => q.lte(q.field("date"), weekEndStr))
      .collect();

    const totalSessions = appointments.length;
    const completedSessions = appointments.filter(apt => apt.status === "completed").length;
    const missedSessions = appointments.filter(apt => apt.status === "missed").length;
    const scheduledSessions = appointments.filter(apt => apt.status === "scheduled").length;

    return {
      totalSessions,
      completedSessions,
      missedSessions,
      scheduledSessions,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
    };
  },
});

export const getMonthlyStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr = monthEnd.toISOString().split('T')[0];

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => q.gte(q.field("date"), monthStartStr))
      .filter((q) => q.lte(q.field("date"), monthEndStr))
      .collect();

    const totalPatients = await ctx.db.query("patients").collect();

    return {
      totalAppointments: appointments.length,
      completedSessions: appointments.filter(apt => apt.status === "completed").length,
      missedSessions: appointments.filter(apt => apt.status === "missed").length,
      totalPatients: totalPatients.length,
      monthStart: monthStartStr,
      monthEnd: monthEndStr,
    };
  },
});
