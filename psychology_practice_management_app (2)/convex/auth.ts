import { mutation } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs"; // precisa no projeto

// Cadastro
export const register = mutation({
  args: { 
    username: v.optional(v.string()), 
    email: v.optional(v.string()), 
    password: v.string() 
  },
  handler: async (ctx, args) => {
    if (!args.username && !args.email) {
      throw new Error("É necessário informar email ou usuário");
    }

    // Normalizar email
    const email = args.email?.toLowerCase();

    // Verifica se já existe
    let existing = await ctx.db
      .query("users")
      .withIndex("by_identity", q => q.eq("email", email).or(q.eq("username", args.username)))
      .first();

    if (existing) throw new Error("Usuário já cadastrado");

    // Criptografar senha
    const hashed = await bcrypt.hash(args.password, 10);

    return await ctx.db.insert("users", {
      username: args.username,
      email,
      password: hashed,
      createdAt: Date.now()
    });
  }
});

// Login
export const login = mutation({
  args: { identity: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const identityLower = args.identity.toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_identity", q => q.eq("email", identityLower).or(q.eq("username", args.identity)))
      .first();

    if (!user) throw new Error("Usuário não encontrado");
    const bcrypt = (await import("bcryptjs")).default;
    const ok = await bcrypt.compare(args.password, user.password);
    if (!ok) throw new Error("Senha incorreta");

    return { userId: user._id, username: user.username, email: user.email };
  }
});
