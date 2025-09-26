import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateReceiptFromCharge = mutation({
  args: { chargeId: v.id("charges") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");

    const charge = await ctx.db.get(args.chargeId);
    if (!charge || charge.therapistId !== userId) {
      throw new Error("Cobrança não encontrada");
    }
    if (charge.status !== "paid") {
      throw new Error("Só é possível gerar recibo de cobrança paga");
    }

    // Gerar número sequencial
    const existingReceipts = await ctx.db.query("receipts")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .collect();
    const receiptNumber = `REC-${String(existingReceipts.length + 1).padStart(4, "0")}`;

    const receiptId = await ctx.db.insert("receipts", {
      therapistId: userId,
      patientId: charge.patientId,
      chargeId: args.chargeId,
      appointmentIds: charge.appointmentIds,
      receiptNumber,
      description: charge.description,
      amount: charge.amount,
      currency: charge.currency,
      paymentDate: charge.paidAt,
      paymentMethod: charge.paymentMethod,
      createdAt: Date.now(),
    });

    return { receiptId, receiptNumber };
  },
});

export const getReceiptsByTherapist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const receipts = await ctx.db.query("receipts")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .order("desc")
      .collect();

    return receipts;
  },
});

export const getReceiptsByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const receipts = await ctx.db.query("receipts")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    return receipts;
  },
});

export const getReceipt = query({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt || receipt.therapistId !== userId) {
      throw new Error("Recibo não encontrado");
    }

    const patient = await ctx.db.get(receipt.patientId);
    const therapistProfile = await ctx.db.query("therapistProfiles")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .first();

    return { ...receipt, patient, therapistProfile };
  },
});

export const deleteReceipt = mutation({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt || receipt.therapistId !== userId) {
      throw new Error("Recibo não encontrado");
    }

    await ctx.db.delete(args.receiptId);
    return { success: true };
  },
});

export const generateReceiptHTML = mutation({
  args: { receiptId: v.id("receipts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Não autorizado");

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt || receipt.therapistId !== userId) {
      throw new Error("Recibo não encontrado");
    }

    const patient = await ctx.db.get(receipt.patientId);
    const therapistProfile = await ctx.db
      .query("therapistProfiles")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .first();

    const html = `
    <html>
      <body>
        <h1>Recibo ${receipt.receiptNumber}</h1>
        <p><b>Paciente:</b> ${patient?.fullName}</p>
        <p><b>Descrição:</b> ${receipt.description}</p>
        <p><b>Valor:</b> ${receipt.currency === "EUR" ? "€" : "R$"} ${receipt.amount.toFixed(2)}</p>
        <p><b>Data de Pagamento:</b> ${new Date(receipt.paymentDate).toLocaleDateString("pt-BR")}</p>
        <p><b>Método:</b> ${receipt.paymentMethod}</p>
        <br>
        <p>Profissional: ${therapistProfile?.fullName}</p>
        <p>CRP: ${therapistProfile?.crpNumber}</p>
      </body>
    </html>
    `;

    return {
      html,
      receiptNumber: receipt.receiptNumber,
      filename: `recibo-${receipt.receiptNumber}.html`,
    };
  },
});
