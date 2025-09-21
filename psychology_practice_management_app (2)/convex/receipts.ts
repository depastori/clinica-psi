import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createReceipt = mutation({
  args: {
    patientId: v.id("patients"),
    amount: v.number(),
    currency: v.union(v.literal("BRL"), v.literal("EUR")),
    description: v.string(),
    paymentMethod: v.union(
      v.literal("pix"),
      v.literal("cartao_credito"),
      v.literal("mbway"),
      v.literal("paypal"),
      v.literal("stripe"),
      v.literal("wise"),
      v.literal("revolut"),
      v.literal("manual")
    ),
    appointmentIds: v.optional(v.array(v.id("appointments"))),
    sessionDetails: v.optional(v.string()),
    invoiceId: v.optional(v.id("invoices")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const patient = await ctx.db.get(args.patientId);
    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    // Generate receipt number
    const receiptNumber = `REC-${Date.now()}`;

    const receiptId = await ctx.db.insert("receipts", {
      patientId: args.patientId,
      therapistId: userId,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      paymentMethod: args.paymentMethod,
      appointmentIds: args.appointmentIds,
      sessionDetails: args.sessionDetails,
      invoiceId: args.invoiceId,
      receiptNumber,
      generatedAt: Date.now(),
    });

    return { receiptId, receiptNumber };
  },
});

export const deleteReceipt = mutation({
  args: {
    receiptId: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt || receipt.therapistId !== userId) {
      throw new Error("Recibo não encontrado");
    }

    await ctx.db.delete(args.receiptId);
    return args.receiptId;
  },
});

export const generateReceiptHTML = mutation({
  args: {
    receiptId: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Não autorizado");
    }

    const receipt = await ctx.db.get(args.receiptId);
    if (!receipt || receipt.therapistId !== userId) {
      throw new Error("Recibo não encontrado");
    }

    const patient = await ctx.db.get(receipt.patientId);
    if (!patient) {
      throw new Error("Paciente não encontrado");
    }

    // Get therapist profile
    const therapistProfile = await ctx.db
      .query("therapistProfiles")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .first();

    // Get sessions details if available
    let sessionsDetails: any[] = [];
    if (receipt.appointmentIds && receipt.appointmentIds.length > 0) {
      const sessionPromises = await Promise.all(
        receipt.appointmentIds.map(async (appointmentId) => {
          const appointment = await ctx.db.get(appointmentId);
          if (appointment) {
            return {
              date: appointment.date,
              time: appointment.time,
              duration: appointment.duration || 60,
              treatmentType: appointment.treatmentType,
              sessionType: appointment.sessionType,
            };
          }
          return null;
        })
      );
      sessionsDetails = sessionPromises.filter(Boolean);
    }

    const receiptData = {
      receiptNumber: receipt.receiptNumber,
      generatedDate: new Date(receipt.generatedAt).toISOString().split('T')[0],
      patient: {
        name: patient.fullName,
        email: patient.email,
        phone: patient.phone,
        address: patient.address,
      },
      therapist: {
        name: therapistProfile?.fullName || "Débora Pastori",
        profession: therapistProfile?.profession || "Psicóloga",
        crp: therapistProfile?.crpNumber || "[Número do CRP]",
        email: therapistProfile?.email || "",
        phone: therapistProfile?.phone || "",
        address: therapistProfile?.address || "",
        logoUrl: therapistProfile?.logoStorageId ? await ctx.storage.getUrl(therapistProfile.logoStorageId) : null,
      },
      receipt: {
        id: receipt._id,
        description: receipt.description,
        amount: receipt.amount,
        currency: receipt.currency,
        paymentMethod: receipt.paymentMethod,
      },
      sessions: sessionsDetails,
      totalHours: sessionsDetails.reduce((total, session) => total + (session?.duration || 60), 0) / 60,
      sessionDetails: receipt.sessionDetails,
    };

    const html = generateReceiptHTMLTemplate(receiptData);
    
    return {
      html,
      receiptNumber: receiptData.receiptNumber,
      filename: `recibo-${receiptData.receiptNumber}.html`,
      receiptData,
    };
  },
});

export const getReceiptsByTherapist = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_therapist", (q) => q.eq("therapistId", userId))
      .order("desc")
      .collect();

    const receiptsWithDetails = await Promise.all(
      receipts.map(async (receipt) => {
        const patient = await ctx.db.get(receipt.patientId);
        return {
          ...receipt,
          patient,
        };
      })
    );

    return receiptsWithDetails;
  },
});

export const getReceiptsByPatient = query({
  args: { patientId: v.id("patients") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_patient", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();

    return receipts.filter(receipt => receipt.therapistId === userId);
  },
});

function generateReceiptHTMLTemplate(receiptData: any): string {
  const currencySymbol = receiptData.receipt.currency === 'EUR' ? '€' : 'R$';
  const logoSection = receiptData.therapist.logoUrl 
    ? `<img src="${receiptData.therapist.logoUrl}" alt="Logo" style="max-height: 80px; margin-bottom: 10px;">`
    : '';
  
  const paymentMethodNames: Record<string, string> = {
    pix: 'PIX',
    cartao_credito: 'Cartão de Crédito',
    mbway: 'MBWAY',
    paypal: 'PayPal',
    stripe: 'Stripe',
    wise: 'Wise',
    revolut: 'Revolut',
    manual: 'Manual'
  };
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Recibo - ${receiptData.receiptNumber}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
          line-height: 1.6;
          color: #333;
        }
        .header { 
          text-align: center; 
          border-bottom: 3px solid #16a34a; 
          padding-bottom: 20px; 
          margin-bottom: 30px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 30px;
          border-radius: 10px;
        }
        .header h1 {
          color: #16a34a;
          margin: 10px 0;
          font-size: 28px;
        }
        .header h2 {
          color: #475569;
          margin: 5px 0;
          font-weight: 400;
        }
        .receipt-info { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px;
          gap: 30px;
        }
        .info-section {
          flex: 1;
          background: #f0fdf4;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #16a34a;
        }
        .info-section h3 { 
          color: #16a34a; 
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 16px;
        }
        .info-section p {
          margin: 8px 0;
          font-size: 14px;
        }
        .section { 
          margin-bottom: 30px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .section-header {
          background: #16a34a;
          color: white;
          padding: 15px 20px;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        .section-content {
          padding: 20px;
        }
        .sessions-table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 15px;
          font-size: 14px;
        }
        .sessions-table th, .sessions-table td { 
          border: 1px solid #e2e8f0; 
          padding: 12px 8px; 
          text-align: left; 
        }
        .sessions-table th { 
          background-color: #f1f5f9; 
          font-weight: 600;
          color: #475569;
        }
        .sessions-table tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .amount-section {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
          padding: 25px;
          border-radius: 10px;
          text-align: center;
          margin: 30px 0;
        }
        .amount-section h3 {
          margin: 0 0 10px 0;
          font-size: 18px;
        }
        .amount-section .amount {
          font-size: 32px;
          font-weight: bold;
          margin: 10px 0;
        }
        .payment-info {
          background: #d1fae5;
          border: 1px solid #16a34a;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .payment-info h4 {
          color: #15803d;
          margin-top: 0;
        }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          font-size: 12px; 
          color: #64748b;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        .paid-stamp {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          background: #d1fae5;
          color: #065f46;
          border: 2px solid #16a34a;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoSection}
        <h1>RECIBO DE PAGAMENTO</h1>
        <h2>${receiptData.therapist.name}</h2>
        <p>${receiptData.therapist.profession} - CRP: ${receiptData.therapist.crp}</p>
        <p style="margin-top: 15px;"><strong>Recibo Nº:</strong> ${receiptData.receiptNumber}</p>
        <span class="paid-stamp">✓ PAGO</span>
      </div>

      <div class="receipt-info">
        <div class="info-section">
          <h3>📋 Dados do Paciente</h3>
          <p><strong>Nome:</strong> ${receiptData.patient.name}</p>
          <p><strong>E-mail:</strong> ${receiptData.patient.email}</p>
          <p><strong>Telefone:</strong> ${receiptData.patient.phone}</p>
          ${receiptData.patient.address ? `<p><strong>Endereço:</strong> ${receiptData.patient.address}</p>` : ''}
        </div>
        <div class="info-section">
          <h3>📅 Informações do Pagamento</h3>
          <p><strong>Data do Recibo:</strong> ${new Date(receiptData.generatedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
          <p><strong>Forma de Pagamento:</strong> ${paymentMethodNames[receiptData.receipt.paymentMethod] || receiptData.receipt.paymentMethod}</p>
          <p><strong>Sessões:</strong> ${receiptData.sessions.length} sessão${receiptData.sessions.length !== 1 ? 'ões' : ''}</p>
          <p><strong>Total de Horas:</strong> ${receiptData.totalHours.toFixed(2)}h</p>
        </div>
      </div>

      <div class="section">
        <h3 class="section-header">💼 Descrição dos Serviços Pagos</h3>
        <div class="section-content">
          <p><strong>Serviço:</strong> ${receiptData.receipt.description}</p>
          
          ${receiptData.sessions.length > 0 ? `
            <table class="sessions-table">
              <thead>
                <tr>
                  <th>📅 Data</th>
                  <th>🕐 Horário</th>
                  <th>⏱️ Duração</th>
                  <th>🎯 Tipo</th>
                  <th>💻 Modalidade</th>
                </tr>
              </thead>
              <tbody>
                ${receiptData.sessions.map((session: any) => `
                  <tr>
                    <td>${new Date(session.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>${session.time}</td>
                    <td>${session.duration} min</td>
                    <td>${session.treatmentType}</td>
                    <td>${session.sessionType}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${receiptData.sessionDetails ? `<p style="margin-top: 15px;"><strong>Detalhes Adicionais:</strong><br>${receiptData.sessionDetails.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
      </div>

      <div class="amount-section">
        <h3>💰 Valor Pago</h3>
        <div class="amount">${currencySymbol} ${receiptData.receipt.amount.toFixed(2).replace('.', ',')}</div>
        <p>Valor referente a ${receiptData.sessions.length} sessão${receiptData.sessions.length !== 1 ? 'ões' : ''} de ${receiptData.therapist.profession.toLowerCase()}</p>
      </div>

      <div class="payment-info">
        <h4>✅ Confirmação de Pagamento</h4>
        <p><strong>Forma de Pagamento:</strong> ${paymentMethodNames[receiptData.receipt.paymentMethod] || receiptData.receipt.paymentMethod}</p>
        <p><strong>Data do Recibo:</strong> ${new Date(receiptData.generatedDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
        <p><em>Este recibo confirma o pagamento dos serviços prestados.</em></p>
      </div>

      <div class="section">
        <h3 class="section-header">👩‍⚕️ Dados do Profissional</h3>
        <div class="section-content">
          <p><strong>Nome:</strong> ${receiptData.therapist.name}</p>
          <p><strong>Profissão:</strong> ${receiptData.therapist.profession}</p>
          <p><strong>CRP:</strong> ${receiptData.therapist.crp}</p>
          ${receiptData.therapist.email ? `<p><strong>E-mail:</strong> ${receiptData.therapist.email}</p>` : ''}
          ${receiptData.therapist.phone ? `<p><strong>Telefone:</strong> ${receiptData.therapist.phone}</p>` : ''}
          ${receiptData.therapist.address ? `<p><strong>Endereço:</strong> ${receiptData.therapist.address}</p>` : ''}
        </div>
      </div>

      <div class="footer">
        <p>Este recibo confirma o pagamento dos serviços de ${receiptData.therapist.profession.toLowerCase()} prestados.</p>
        <p>Em caso de dúvidas, entre em contato através dos dados acima.</p>
        <p>Documento gerado automaticamente em: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `;
}
