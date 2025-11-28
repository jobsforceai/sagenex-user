import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, topic, message } = await req.json();

    // Here you would typically handle the support request,
    // e.g., send an email, save to a database, etc.
    console.log("Support Request Received:");
    console.log({ fullName, email, topic, message });

    return NextResponse.json(
      { message: "Support request submitted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing support request:", error);
    return NextResponse.json(
      { message: "An error occurred while submitting the request." },
      { status: 500 }
    );
  }
}
