import mongoose from "mongoose";

const MercadoPagoEventSchema = new mongoose.Schema(
  {
    // 🔑 Para deduplicar
    paymentId: { type: Number, index: true },

    // Evento MP
    action: String,
    type: String,
    api_version: String,
    live_mode: Boolean,
    user_id: Number,

    // Fecha del evento
    date_created: Date,

    // 🔥 TODO el payload completo (crudo)
    payload: mongoose.Schema.Types.Mixed,

    // Datos útiles ya procesados
    status: String,
    status_detail: String,
    transaction_amount: Number,
    description: String,
    external_reference: String,
    metadata: mongoose.Schema.Types.Mixed,

    // Para tu lógica
    relay: Number,
    relay_activated: { type: Boolean, default: false },
    activated_at: Date,
  },
  {
    timestamps: true, // createdAt / updatedAt
  }
);

// Anti duplicado real
MercadoPagoEventSchema.index({ paymentId: 1 }, { unique: true });

export default mongoose.models.MercadoPagoEvent ||
  mongoose.model("MercadoPagoEvent", MercadoPagoEventSchema);
