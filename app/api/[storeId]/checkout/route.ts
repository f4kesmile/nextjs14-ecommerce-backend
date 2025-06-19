import { NextResponse } from "next/server";
import midtransClient from "midtrans-client";
import db from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://ecommerce-backend-hedigas.vercel.app", // Ganti dengan domain frontend Anda
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  req: Request,
  { params }: { params: { storeId: string } }
) {
  try {
    const storeId = (params.storeId);
    const { items, phone, address } = await req.json();

    if (!items || items.length === 0) {
      return new NextResponse("No items in cart", { 
        status: 400,
        headers: corsHeaders
      });
    }

    const totalPrice = items.reduce((sum: number, item: any) => {
      return sum + Number(item.price);
    }, 0);

    const order = await db.order.create({
      data: {
        storeId: storeId,
        isPaid: false,
        phone,
        address,
        orderItems: {
          create: items.map((item: any) => ({
            product: {
              connect: { id: item.productId },
            },
          })),
        },
      },
    });

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY!,
      clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!,
    });
    
    
    const midtransParams = {
      transaction_details: {
        order_id: order.id,
        gross_amount: totalPrice,
      },
      customer_details: {
        phone,
        shipping_address: { address },
      },
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/success`,
      },
    };

    const transaction = await snap.createTransaction(midtransParams);
    return NextResponse.json({ token: transaction.token }, { headers: corsHeaders });
    
    
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error);
    return new NextResponse("Internal Server Error", {
      status: 500,
      headers: corsHeaders
    });
  }
}
