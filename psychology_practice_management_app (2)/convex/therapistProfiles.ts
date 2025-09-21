import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getTherapistProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const profile = await ctx.db
      .query("therapistProfiles")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .first();

    if (profile?.logoStorageId) {
      const logoUrl = await ctx.storage.getUrl(profile.logoStorageId);
      return {
        ...profile,
        logoUrl,
      };
    }

    return profile;
  },
});

export const createOrUpdateTherapistProfile = mutation({
  args: {
    fullName: v.string(),
    profession: v.string(),
    crpNumber: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    specialties: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const existingProfile = await ctx.db
      .query("therapistProfiles")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .first();

    const now = Date.now();

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        ...args,
      });
      return existingProfile._id;
    } else {
      return await ctx.db.insert("therapistProfiles", {
        therapistId: userId,
        ...args,
        createdAt: now,
      });
    }
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }
    return await ctx.storage.generateUploadUrl();
  },
});
