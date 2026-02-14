import { NextResponse } from "next/server";
import { dbConnect } from "@/config/mongo";
import MercadoPagoEvent from "@/models/MercadoPagoEvent";

export async function POST(req) {
  try {
    const body = await req.json();
    const paymentId = body?.data?.id;

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    // Conectar DB
    await dbConnect();

    // Consultar pago real
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!mpRes.ok) {
      return NextResponse.json({ ok: true });
    }

    const payment = await mpRes.json();

    // Guardar evento (anti duplicado automático)
    await MercadoPagoEvent.create({
      paymentId: payment.id,
      action: body.action,
      type: body.type,
      api_version: body.api_version,
      live_mode: body.live_mode,
      user_id: body.user_id,
      date_created: body.date_created
        ? new Date(body.date_created)
        : new Date(),

      payload: body,

      status: payment.status,
      status_detail: payment.status_detail,
      transaction_amount: payment.transaction_amount,
      description: payment.description,
      external_reference: payment.external_reference,
      metadata: payment.metadata,
    });

    // Solo pagos aprobados
    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    // 👉 acá después activamos relé

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Si es duplicado (E11000), lo ignoramos
    if (err?.code === 11000) {
      return NextResponse.json({ ok: true });
    }

    console.error("WEBHOOK ERROR", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";

// export async function POST(req) {
//   try {
//     const body = await req.json();

//     // Mercado Pago manda distintos eventos
//     const paymentId = body?.data?.id;
//     const topic = body?.type || body?.topic;

//     if (!paymentId) {
//       return NextResponse.json({ ok: true });
//     }

//     // 1️⃣ Consultar el pago real en Mercado Pago
//     const mpRes = await fetch(
//       `https://api.mercadopago.com/v1/payments/${paymentId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
//         },
//       }
//     );

//     const payment = await mpRes.json();

//     // 2️⃣ Validaciones IMPORTANTES
//     if (payment.status !== "approved") {
//       return NextResponse.json({ ok: true });
//     }

//     // 🔒 anti-duplicado (acá luego va DB)
//     // ahora solo logueamos
//     console.log("PAGO APROBADO:", {
//       id: payment.id,
//       amount: payment.transaction_amount,
//       description: payment.description,
//     });

//     // 3️⃣ ACÁ va la activación del relé (luego)
//     // publish MQTT / llamar ESP32 / guardar en DB

//     return NextResponse.json({ ok: true });
//   } catch (err) {
//     console.error("Webhook error:", err);
//     return NextResponse.json({ ok: false }, { status: 500 });
//   }
// }


// export function GET() {
//   return NextResponse.json({ ok: true, msg: "webhook up" });
// }