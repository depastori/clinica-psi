import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPackage = mutation({
  args: {
    patientId: v.id("patients"),
    name: v.string(),
    totalSessions: v.number(),
    totalAmount: v.number(),
    currency: v.union(v.literal("BRL"), v.literal("EUR")),
    purchaseDate: v.string(),
    expiryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    return await ctx.db.insert("packages", {
      therapistId: userId,
      ...args,
      usedSessions: 0,
      status: "active",
      createdAt: Date.now(),
    });
  },
});

export const getPackages = query({
  args: { activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    let packages = await ctx.db
      .query("packages")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .collect();

    if (args.activeOnly) {
      packages = packages.filter(pkg => pkg.status === "active");
    }

    return packages.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getPackagesByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const packages = await ctx.db
      .query("packages")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .filter((q) => q.eq(q.field("therapistId"), userId))
      .collect();

    return packages.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const updatePackage = mutation({
  args: {
    packageId: v.id("packages"),
    name: v.optional(v.string()),
    totalSessions: v.optional(v.number()),
    usedSessions: v.optional(v.number()),
    totalAmount: v.optional(v.number()),
    currency: v.optional(v.union(v.literal("BRL"), v.literal("EUR"))),
    status: v.optional(v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    )),
    expiryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const { packageId, ...updateData } = args;
    const package_ = await ctx.db.get(packageId);
    
    if (!package_ || package_.therapistId !== userId) {
      throw new Error("Pacote não encontrado");
    }

    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(packageId, cleanUpdateData);
    return packageId;
  },
});

export const usePackageSession = mutation({
  args: {
    packageId: v.id("packages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const package_ = await ctx.db.get(args.packageId);
    if (!package_ || package_.therapistId !== userId) {
      throw new Error("Pacote não encontrado");
    }

    if (package_.usedSessions >= package_.totalSessions) {
      throw new Error("Pacote já foi totalmente utilizado");
    }

    const newUsedSessions = package_.usedSessions + 1;
    const newStatus = newUsedSessions >= package_.totalSessions ? "completed" : "active";

    await ctx.db.patch(args.packageId, {
      usedSessions: newUsedSessions,
      status: newStatus,
    });

    return {
      packageId: args.packageId,
      usedSessions: newUsedSessions,
      remainingSessions: package_.totalSessions - newUsedSessions,
      status: newStatus,
    };
  },
});

export const deletePackage = mutation({
  args: {
    packageId: v.id("packages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const package_ = await ctx.db.get(args.packageId);
    if (!package_ || package_.therapistId !== userId) {
      throw new Error("Pacote não encontrado");
    }

    await ctx.db.delete(args.packageId);
    return args.packageId;
  },
});
