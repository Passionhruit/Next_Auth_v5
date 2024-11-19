import { getVerificationTokenByEmail } from "@/data/verification-token";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";

// you are gonna generate this token when you send an email
export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  // token is gonna be expired in 1 hour.
  const expires = new Date(new Date().getTime() + 3600 * 1000);

  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    });
  }

  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return verificationToken;
};