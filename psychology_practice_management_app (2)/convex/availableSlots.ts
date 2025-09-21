import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAvailableSlots = query({
  args: { dayOfWeek: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const slots = await ctx.db
      .query("availableSlots")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => q.eq(q.field("dayOfWeek"), args.dayOfWeek))
      .collect();

    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  },
});

export const getAllAvailableSlots = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const slots = await ctx.db
      .query("availableSlots")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .collect();

    return slots;
  },
});

export const createAvailableSlot = mutation({
  args: {
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    // Check if slot already exists
    const existingSlot = await ctx.db
      .query("availableSlots")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("dayOfWeek"), args.dayOfWeek),
          q.eq(q.field("startTime"), args.startTime)
        )
      )
      .first();

    if (existingSlot) {
      throw new Error("Horário já existe");
    }

    return await ctx.db.insert("availableSlots", {
      therapistId: userId,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      isActive: true,
    });
  },
});

export const updateAvailableSlot = mutation({
  args: {
    slotId: v.id("availableSlots"),
    dayOfWeek: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.therapistId !== userId) {
      throw new Error("Horário não encontrado");
    }

    const { slotId, ...updateData } = args;
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(slotId, cleanUpdateData);
    return { success: true };
  },
});

export const deleteAvailableSlot = mutation({
  args: {
    slotId: v.id("availableSlots"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.therapistId !== userId) {
      throw new Error("Horário não encontrado");
    }

    await ctx.db.delete(args.slotId);
    return { success: true };
  },
});
