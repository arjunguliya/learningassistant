import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

// In a real app, you'd use a database. For now, we'll use a simple file-based storage
// You should replace this with your preferred database solution (PostgreSQL, MongoDB, etc.)

interface ConversationLog {
  id: string;
  userId: string;
  topic: string;
  date: string;
  questionCount: number;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

// Mock data for demonstration - Replace with actual database queries
const getMockConversations = (userId: string): ConversationLog[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  return [
    {
      id: "1",
      userId,
      topic: "Quantum Physics Basics",
      date: today.toISOString(),
      questionCount: 5,
      messages: [
        {
          role: "user",
          content: "What is quantum physics?",
          timestamp: today.toISOString(),
        },
        {
          role: "assistant",
          content: "Quantum physics is the branch of physics that studies matter and energy at the smallest scales...",
          timestamp: today.toISOString(),
        },
        {
          role: "user",
          content: "Can you explain wave-particle duality?",
          timestamp: today.toISOString(),
        },
        {
          role: "assistant",
          content: "Wave-particle duality is one of the fundamental concepts in quantum mechanics...",
          timestamp: today.toISOString(),
        },
      ],
    },
    {
      id: "2",
      userId,
      topic: "Climate Change Science",
      date: yesterday.toISOString(),
      questionCount: 3,
      messages: [
        {
          role: "user",
          content: "What causes climate change?",
          timestamp: yesterday.toISOString(),
        },
        {
          role: "assistant",
          content: "Climate change is primarily caused by increased greenhouse gas emissions...",
          timestamp: yesterday.toISOString(),
        },
      ],
    },
    {
      id: "3",
      userId,
      topic: "Financial Literacy",
      date: lastWeek.toISOString(),
      questionCount: 4,
      messages: [
        {
          role: "user",
          content: "How does compound interest work?",
          timestamp: lastWeek.toISOString(),
        },
        {
          role: "assistant",
          content: "Compound interest is the interest calculated on the initial principal and accumulated interest...",
          timestamp: lastWeek.toISOString(),
        },
      ],
    },
  ];
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
    // In a real app, fetch from your database
    // const conversations = await db.conversations.findMany({
    //   where: { userId: user.id },
    //   orderBy: { date: 'desc' }
    // });

    const conversations = getMockConversations(user.id);
    
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { isAuthenticated, getUser } = getKindeServerSession();
  
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { topic, messages } = body;

    // In a real app, save to your database
    // const conversation = await db.conversations.create({
    //   data: {
    //     userId: user.id,
    //     topic,
    //     date: new Date().toISOString(),
    //     questionCount: messages.filter(m => m.role === 'user').length,
    //     messages
    //   }
    // });

    const conversation = {
      id: Date.now().toString(),
      userId: user.id,
      topic,
      date: new Date().toISOString(),
      questionCount: messages.filter((m: any) => m.role === 'user').length,
      messages,
    };

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Error saving conversation:", error);
    return NextResponse.json(
      { error: "Failed to save conversation" },
      { status: 500 }
    );
  }
}
