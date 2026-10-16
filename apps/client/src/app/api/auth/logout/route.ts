import { cookies } from "next/headers";
import { COOKIE_ACCESS_TOKEN, COOKIE_REFRESH_TOKEN } from "@/lib/cookies";

export const POST = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_ACCESS_TOKEN)?.value;
  const refreshToken = cookieStore.get(COOKIE_REFRESH_TOKEN)?.value;

  if (refreshToken) {
    try {
      const apiUrl =
        process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${apiUrl}/api/v1/user/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (err) {
      console.error("Server logout revocation failed:", err);
    }
  }

  cookieStore.delete(COOKIE_ACCESS_TOKEN);
  cookieStore.delete(COOKIE_REFRESH_TOKEN);
  return Response.json({ message: "Success" }, { status: 200 });
};
