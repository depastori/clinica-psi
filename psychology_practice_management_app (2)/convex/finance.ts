import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ---------------- Receitas ------------------

// Lançar recebimento (manual ou automático quando gerar cobrança paga)
export const addIncome = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    currency: v.union(v.literal("BRL"), v.literal("EUR")),
    date: v.number(), // timestamp
    source: v.optional(v.string()), // ex: "Cobrança #001"
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) throw new Error("Não autenticado");

    return await ctx.db.insert("incomes", {
      therapistId,
      ...args,
      createdAt: Date.now(),
    });
  },
});

// ---------------- Despesas ------------------

export const addExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    currency: v.union(v.literal("BRL"), v.literal("EUR")),
    dueDate: v.number(), // vencimento
    category: v.optional(v.string()), // aluguel, luz, etc.
  },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) throw new Error("Não autenticado");

    return await ctx.db.insert("expenses", {
      therapistId,
      ...args,
      paid: false,
      createdAt: Date.now(),
    });
  },
});

// Marcar despesa como paga
export const payExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) throw new Error("Não autenticado");

    const exp = await ctx.db.get(args.expenseId);
    if (!exp || exp.therapistId !== therapistId) throw new Error("Despesa não encontrada");

    await ctx.db.patch(args.expenseId, { paid: true, paidAt: Date.now() });
    return args.expenseId;
  },
});

// ---------------- Relatórios ------------------

// Entradas e saídas do mês
export const getMonthlyReport = query({
  args: { month: v.number(), year: v.number() },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) return { incomes: [], expenses: [] };

    const monthStart = new Date(args.year, args.month - 1, 1).getTime();
    const nextMonth = new Date(args.year, args.month, 1).getTime();

    const incomes = await ctx.db
      .query("incomes")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .filter(q => q.gte(q.field("date"), monthStart).lt(q.field("date"), nextMonth))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .filter(q => q.gte(q.field("dueDate"), monthStart).lt(q.field("dueDate"), nextMonth))
      .collect();

    return { incomes, expenses };
  },
});

// Resumo do dia (previstos e realizados)
export const getDailySummary = query({
  args: { date: v.number() },
  handler: async (ctx, args) => {
    const therapistId = await getAuthUserId(ctx);
    if (!therapistId) return { incomes: [], expenses: [] };

    const dayStart = new Date(args.date);
    dayStart.setHours(0,0,0,0);
    const nextDay = new Date(dayStart);
    nextDay.setDate(dayStart.getDate() + 1);

    const incomes = await ctx.db
      .query("incomes")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .filter(q => q.gte(q.field("date"), dayStart.getTime()).lt(q.field("date"), nextDay.getTime()))
      .collect();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_therapist", (q) => q.eq("therapistId", therapistId))
      .filter(q => q.gte(q.field("dueDate"), dayStart.getTime()).lt(q.field("dueDate"), nextDay.getTime()))
      .collect();

    return { incomes, expenses };
  },
});
