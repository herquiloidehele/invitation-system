import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { AUTH_COOKIE_NAME, signJwt } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Nome de utilizador e palavra-passe são obrigatórios" },
        { status: 400 },
      );
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    console.log("Log credentials", {
      username,
      password,
      adminUsername,
      adminPasswordHash,
    });

    if (!adminUsername || !adminPasswordHash) {
      console.error(
        "Admin credentials not configured in environment variables",
      );
      return NextResponse.json(
        { error: "Erro de configuração do servidor" },
        { status: 500 },
      );
    }

    if (username !== adminUsername) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    const passwordValid = await bcrypt.compare(password, adminPasswordHash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 },
      );
    }

    const token = await signJwt({ username });

    const response = NextResponse.json({ success: true });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
