import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Função para hash de senha (simulando bcrypt - você pode instalar bcryptjs depois)
async function hashPassword(password: string): Promise<string> {
  // Por enquanto, vamos usar uma versão simples
  // Em produção, instale: npm install bcryptjs
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "salt_secreto");
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// Cadastro de usuário
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

    if (args.password.length < 6) {
      throw new Error("Senha deve ter pelo menos 6 caracteres");
    }

    // Normalizar email
    const email = args.email?.toLowerCase();

    // Verifica duplicado por email
    if (email) {
      const userByEmail = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      if (userByEmail) throw new Error("Email já cadastrado");
    }

    // Verifica duplicado por username
    if (args.username) {
      const userByUsername = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();
      if (userByUsername) throw new Error("Usuário já cadastrado");
    }

    // Hash da senha
    const hashedPassword = await hashPassword(args.password);

    // Criar usuário
    const userId = await ctx.db.insert("users", {
      username: args.username,
      email,
      password: hashedPassword,
      createdAt: Date.now()
    });

    return {
      success: true,
      userId,
      message: "Usuário cadastrado com sucesso!"
    };
  }
});

// Login de usuário
export const login = mutation({
  args: {
    identity: v.string(), // email ou username
    password: v.string()
  },
  handler: async (ctx, args) => {
    const identityLower = args.identity.toLowerCase();

    // Tenta encontrar por email primeiro
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identityLower))
      .first();

    // Se não achou por email, tenta por username
    if (!user) {
      user = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.identity))
        .first();
    }

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Verifica senha
    const passwordValid = await verifyPassword(args.password, user.password);
    if (!passwordValid) {
      throw new Error("Senha incorreta");
    }

    return {
      success: true,
      userId: user._id,
      username: user.username,
      email: user.email,
      message: "Login realizado com sucesso!"
    };
  }
});

// Buscar dados do usuário logado (opcional)
export const getCurrentUser = query({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    };
  }
});

// Logout (limpa dados do lado cliente)
export const logout = mutation({
  args: {},
  handler: async (ctx, args) => {
    // No Convex, o logout é principalmente do lado cliente
    // Esta função pode ser usada para logs ou limpeza se necessário
    return {
      success: true,
      message: "Logout realizado"
    };
  }
});

// Alterar senha (funcionalidade extra)
export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string()
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Usuário não encontrado");

    // Verifica senha atual
    const currentPasswordValid = await verifyPassword(args.currentPassword, user.password);
    if (!currentPasswordValid) {
      throw new Error("Senha atual incorreta");
    }

    if (args.newPassword.length < 6) {
      throw new Error("Nova senha deve ter pelo menos 6 caracteres");
    }

    // Hash da nova senha
    const newHashedPassword = await hashPassword(args.newPassword);

    // Atualiza senha
    await ctx.db.patch(args.userId, {
      password: newHashedPassword
    });

    return {
      success: true,
      message: "Senha alterada com sucesso!"
    };
  }
});
