import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

interface DayStats {
  date: string;
  questions: number;
}

// Mock data for demonstration - Replace with actual database queries
const getMockDayStats = (userId: string): DayStats[] => {
  const stats: DayStats[] = [];
  const today = new Date();
  
  // Generate stats for the last 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate some random question counts
    const questions = Math.floor(Math.random() * 10) + (i < 7 ? 2 : 0); // More questions in recent days
    
    stats.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      questions,
    });
  }
  
  return stats;
};

const getTotalQuestions = (userId: string): number => {
  // In a real app, this would be a database query
  // return await db.conversations.aggregate({
  //   where: { userId },
  //   _sum: { questionCount: true }
  // })._sum.questionCount || 0;
  
  // Mock total
  return 47;
};

export async function GET() {
  const { isAuthenticated, getUser } = getKindeServerSession();
  
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // In a real app, these would be database queries
    const dayStats = getMockDayStats(user.id);
    const totalQuestions = getTotalQuestions(user.id);
    
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
