import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();

    // Mercado Pago manda distintos eventos
    const paymentId = body?.data?.id;
    const topic = body?.type || body?.topic;

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    // 1️⃣ Consultar el pago real en Mercado Pago
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await mpRes.json();

    // 2️⃣ Validaciones IMPORTANTES
    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    // 🔒 anti-duplicado (acá luego va DB)
    // ahora solo logueamos
    console.log("PAGO APROBADO:", {
      id: payment.id,
      amount: payment.transaction_amount,
      description: payment.description,
    });

    // 3️⃣ ACÁ va la activación del relé (luego)
    // publish MQTT / llamar ESP32 / guardar en DB

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
