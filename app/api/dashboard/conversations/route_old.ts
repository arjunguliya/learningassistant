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

    // Fetch conversations with messages
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format the response
    const formattedConversations = conversations.map(conv => ({
      id: conv.id,
      topic: conv.topic,
      date: conv.createdAt.toISOString(),
      questionCount: conv.questionCount,
      messages: conv.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }))
    }));

    return NextResponse.json(formattedConversations);
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

  const kindeUser = await getUser();
  if (!kindeUser?.id) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { topic, messages } = body;

    // Find or create user
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

    // Count user questions
    const questionCount = messages.filter((m: any) => m.role === 'user').length;

    // Create conversation with messages
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        topic,
        questionCount,
        messages: {
          create: messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
          }))
        }
      },
      include: {
        messages: true
      }
    });

    // Update daily stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.dailyStat.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: today
        }
      },
      update: {
        questions: {
          increment: questionCount
        }
      },
      create: {
        userId: user.id,
        date: today,
        questions: questionCount
      }
    });

    return NextResponse.json({
      id: conversation.id,
      topic: conversation.topic,
      date: conversation.createdAt.toISOString(),
      questionCount: conversation.questionCount,
      messages: conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp.toISOString()
      }))
    });
  } catch (error) {
    console.error("Error saving conversation:", error);
    return NextResponse.json(
      { error: "Failed to save conversation" },
      { status: 500 }
    );
  }
}
