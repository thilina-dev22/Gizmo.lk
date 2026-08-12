import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No slip file attached" },
        { status: 400 }
      );
    }

    // Convert file to mock base64/URL for previewing in admin dashboard
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

    return NextResponse.json({
      url: dataUrl,
      fileName: file.name,
      message: "Bank deposit slip uploaded successfully",
    });
  } catch (error) {
    console.error("Upload slip error:", error);
    return NextResponse.json(
      { error: "Failed to process bank slip image" },
      { status: 500 }
    );
  }
}
