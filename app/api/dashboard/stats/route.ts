import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const kindeUser = await getUser();
  if (!kindeUser?.id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Find or create user in our database
    let user = await prisma.user.findUnique({
      where: { kindeId: kindeUser.id }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          kindeId: kindeUser.id,
          email: kindeUser.email || "",
          name: `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim(),
        }
      });
    }

    // Get total questions count
    const totalQuestionsResult = await prisma.conversation.aggregate({
      where: { userId: user.id },
      _sum: { questionCount: true }
    });
    const totalQuestions = totalQuestionsResult._sum.questionCount || 0;

    // Get daily stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await prisma.dailyStat.findMany({
      where: {
        userId: user.id,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: { date: 'asc' }
    });

    // Fill in missing days with 0 questions
    const dayStatsMap = new Map();
    dailyStats.forEach(stat => {
      dayStatsMap.set(stat.date.toISOString().split('T')[0], stat.questions);
    });

    const dayStats = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dayStats.push({
        date: dateStr,
        questions: dayStatsMap.get(dateStr) || 0
      });
    }

    return NextResponse.json({
      dayStats,
      totalQuestions,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
