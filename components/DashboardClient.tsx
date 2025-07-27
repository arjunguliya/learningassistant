"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ConversationLog {
  id: string;
  topic: string;
  date: string;
  questionCount: number;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
}

interface DayStats {
  date: string;
  questions: number;
}

interface DashboardClientProps {
  userId: string;
}

export default function DashboardClient({ userId }: DashboardClientProps) {
  const [conversations, setConversations] = useState<ConversationLog[]>([]);
  const [dayStats, setDayStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationLog | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch conversation logs
      const conversationsRes = await fetch("/api/dashboard/conversations");
      if (conversationsRes.ok) {
        const conversationsData = await conversationsRes.json();
        setConversations(conversationsData);
      }

      // Fetch daily stats
      const statsRes = await fetch("/api/dashboard/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setDayStats(statsData.dayStats);
        setTotalQuestions(statsData.totalQuestions);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Questions</h3>
          <p className="text-3xl font-bold text-blue-600">{totalQuestions}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversations</h3>
          <p className="text-3xl font-bold text-green-600">{conversations.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">This Week</h3>
          <p className="text-3xl font-bold text-purple-600">
            {dayStats.slice(-7).reduce((sum, day) => sum + day.questions, 0)}
          </p>
        </div>
      </div>

      {/* Questions Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions Over Time</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dayStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => formatDate(value)}
                formatter={(value) => [value, "Questions"]}
              />
              <Line 
                type="monotone" 
                dataKey="questions" 
                stroke="#5170ff" 
                strokeWidth={2}
                dot={{ fill: "#5170ff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversation Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversation List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Conversation History</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No conversations yet. Start asking questions!
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedConversation?.id === conversation.id ? "bg-blue-50 border-blue-200" : ""
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.topic}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(conversation.date)} • {conversation.questionCount} questions
                      </p>
                    </div>
                    <div className="ml-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {conversation.messages.length} messages
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedConversation ? selectedConversation.topic : "Select a Conversation"}
            </h3>
            {selectedConversation && (
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(selectedConversation.date)}
              </p>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto p-4">
            {selectedConversation ? (
              <div className="space-y-4">
                {selectedConversation.messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === "user" ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Select a conversation to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
