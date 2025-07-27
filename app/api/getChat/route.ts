import {
  TogetherAIStream,
  TogetherAIStreamPayload,
} from "@/utils/TogetherAIStream";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

let ratelimit: Ratelimit | undefined;

// Add rate limiting if Upstash API keys are set, otherwise skip
if (process.env.UPSTASH_REDIS_REST_URL) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    // Allow 10 requests per day
    limiter: Ratelimit.fixedWindow(10, "1440 m"),
    analytics: true,
    prefix: "llamatutor",
  });
}

export async function POST(request: Request) {
  try {
    let { messages } = await request.json();

    // Validate required environment variables early
    if (!process.env.TOGETHER_API_KEY) {
      console.error("TOGETHER_API_KEY is not set");
      return new Response("Server configuration error: Missing API key", { 
        status: 500 
      });
    }

    if (ratelimit) {
      const identifier = getIPAddress();

      const { success } = await ratelimit.limit(identifier);
      if (!success) {
        return Response.json("No requests left. Try again in 24h.", {
          status: 429,
        });
      }
    }

    const payload: TogetherAIStreamPayload = {
      model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
      messages,
      stream: true,
    };
    
    const stream = await TogetherAIStream(payload);

    return new Response(stream, {
      headers: new Headers({
        "Cache-Control": "no-cache",
        "Content-Type": "text/stream-event",
      }),
    });
  } catch (e) {
    console.error("Error in getChat route:", e);
    
    // Return more specific error messages
    if (e instanceof Error) {
      if (e.message.includes("Authentication failed")) {
        return new Response("Authentication error: Please check API configuration", { 
          status: 401 
        });
      } else if (e.message.includes("Rate limit exceeded")) {
        return new Response("Rate limit exceeded. Please try again later.", { 
          status: 429 
        });
      }
    }
    
    return new Response("Error processing request. Please try again.", { 
      status: 500 
    });
  }
}

function getIPAddress() {
  const FALLBACK_IP_ADDRESS = "0.0.0.0";
  const forwardedFor = headers().get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? FALLBACK_IP_ADDRESS;
  }

  return headers().get("x-real-ip") ?? FALLBACK_IP_ADDRESS;
}
