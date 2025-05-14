import { jwtVerify } from "jose";
import { env } from "@/env";

export async function validateCredentials(
  credToken: string,
  testId: string,
): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(
      credToken,
      new TextEncoder().encode(env.AUTH_SECRET),
    );

    if (!payload) {
      return false;
    }

    const { exp, testId: tokenTestId } = payload as {
      exp: number;
      testId: string;
    };
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    const isValidTestId = tokenTestId === testId;

    if (!isValidTestId) {
      return false;
    }

    // Check if the token is expired
    if (exp < currentTime) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error validating credentials:", error);
    return false;
  }
}
