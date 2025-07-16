import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  
  if (await isAuthenticated()) {
    const user = await getUser();
    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: user?.id,
        email: user?.email,
        name: `${user?.given_name} ${user?.family_name}`.trim()
      }
    });
  } else {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
