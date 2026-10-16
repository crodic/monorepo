import { cookies } from "next/headers";
import { decodeJwt } from "jose";
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from "@/lib/cookies";

export const GET = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value || "";

  return Response.json({ accessToken }, { status: 200 });
};

export const POST = async (req: Request) => {
  const body: { accessToken?: string; refreshToken?: string } =
    await req.json();
  const cookieStore = await cookies();
  const { accessToken, refreshToken } = body;

  if (!accessToken && !refreshToken) {
    return Response.json({ message: "Tokens are required" }, { status: 400 });
  }

  if (accessToken) {
    const expAccessToken = decodeJwt(accessToken).exp;
    if (!expAccessToken) {
      return Response.json({ message: "Invalid accessToken" }, { status: 400 });
    }
    cookieStore.set(COOKIE_ACCESS_TOKEN, accessToken, {
      path: "/",
      httpOnly: true,
      expires: new Date(expAccessToken * 1000),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (refreshToken) {
    const expRefreshToken = decodeJwt(refreshToken).exp;
    if (!expRefreshToken) {
      return Response.json(
        { message: "Invalid refreshToken" },
        { status: 400 },
      );
    }
    cookieStore.set(COOKIE_REFRESH_TOKEN, refreshToken, {
      path: "/",
      httpOnly: true,
      expires: new Date(expRefreshToken * 1000),
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return Response.json({ success: true }, { status: 200 });
};

export const DELETE = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_ACCESS_TOKEN);
  cookieStore.delete(COOKIE_REFRESH_TOKEN);
  return Response.json({ message: "Success" }, { status: 200 });
};
