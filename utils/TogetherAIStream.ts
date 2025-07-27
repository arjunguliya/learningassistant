import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

export type ChatGPTAgent = "user" | "system";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export interface TogetherAIStreamPayload {
  model: string;
  messages: ChatGPTMessage[];
  stream: boolean;
}

export async function TogetherAIStream(payload: TogetherAIStreamPayload) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Add validation for required API keys
  const togetherApiKey = process.env.TOGETHER_API_KEY;
  const heliconeApiKey = process.env.HELICONE_API_KEY;

  if (!togetherApiKey) {
    throw new Error("TOGETHER_API_KEY environment variable is required");
  }

  // Prepare headers with proper validation
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${togetherApiKey}`,
  };

  // Only add Helicone headers if the API key is available
  if (heliconeApiKey) {
    headers["Helicone-Auth"] = `Bearer ${heliconeApiKey}`;
    headers["Helicone-Property-AppName"] = "llamatutor";
  }

  // Choose endpoint based on whether Helicone is configured
  const endpoint = heliconeApiKey 
    ? "https://together.helicone.ai/v1/chat/completions"
    : "https://api.together.xyz/v1/chat/completions";

  const res = await fetch(endpoint, {
    headers,
    method: "POST",
    body: JSON.stringify(payload),
  });

  const readableStream = new ReadableStream({
    async start(controller) {
      // callback
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === "event") {
          const data = event.data;
          controller.enqueue(encoder.encode(data));
        }
      };

      // optimistic error handling
      if (res.status !== 200) {
        const data = {
          status: res.status,
          statusText: res.statusText,
          body: await res.text(),
        };
        console.log(
          `Error: received non-200 status code, ${JSON.stringify(data)}`,
        );
        
        // Provide better error messages based on status code
        if (res.status === 401) {
          throw new Error("Authentication failed. Please check your TOGETHER_API_KEY environment variable.");
        } else if (res.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        } else {
          throw new Error(`API request failed with status ${res.status}: ${data.statusText}`);
        }
      }

      // stream response (SSE) from Together AI may be fragmented into multiple chunks
      // this ensures we properly read chunks and invoke an event for each SSE event stream
      const parser = createParser(onParse);
      // https://web.dev/streams/#asynchronous-iteration
      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  let counter = 0;
  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      const data = decoder.decode(chunk);
      // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
      if (data === "[DONE]") {
        controller.terminate();
        return;
      }
      try {
        const json = JSON.parse(data);
        const text = json.choices[0].delta?.content || "";
        if (counter < 2 && (text.match(/\n/) || []).length) {
          // this is a prefix character (i.e., "\n\n"), do nothing
          return;
        }
        // stream transformed JSON response as SSE
        const payload = { text: text };
        // https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#event_stream_format
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
        counter++;
      } catch (e) {
        // maybe parse error
        controller.error(e);
      }
    },
  });

  return readableStream.pipeThrough(transformStream);
}
