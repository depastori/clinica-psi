import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createClinicalSession = mutation({
  args: {
    appointmentId: v.id("appointments"),
    patientId: v.id("patients"),
    sessionDate: v.string(),
    attendance: v.union(v.literal("present"), v.literal("absent")),
    clinicalObservations: v.string(),
    freeNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const sessionId = await ctx.db.insert("clinicalSessions", {
      ...args,
      therapistId: userId,
      createdAt: Date.now(),
    });

    // Update appointment status
    await ctx.db.patch(args.appointmentId, {
      status: args.attendance === "present" ? "completed" : "missed",
    });

    return sessionId;
  },
});

export const getSessionsByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("clinicalSessions")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

export const updateClinicalSession = mutation({
  args: {
    sessionId: v.id("clinicalSessions"),
    attendance: v.union(v.literal("present"), v.literal("absent")),
    clinicalObservations: v.string(),
    freeNotes: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    await ctx.db.patch(args.sessionId, {
      attendance: args.attendance,
      clinicalObservations: args.clinicalObservations,
      freeNotes: args.freeNotes,
    });

    return args.sessionId;
  },
});

export const getSessionById = query({
  args: { sessionId: v.id("clinicalSessions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db.get(args.sessionId);
  },
});
