Threads

Threads are a way to group messages together in a linear history. All messages saved in the Agent component are associated with a thread. When a message is generated based on a prompt, it saves the user message and generated agent message(s) automatically.

Threads can be associated with a user, and messages can each individually be associated with a user. By default, messages are associated with the thread's user.

Creating a thread

You can create a thread in a mutation or action. If you create it in an action, it will also return a thread (see below) and you can start calling LLMs and generating messages. If you specify a userId, the thread will be associated with that user and messages will be saved to the user's history.

import { createThread } from "@convex-dev/agent";

const threadId = await createThread(ctx, components.agent);

You may also pass in metadata to set on the thread:

const userId = await getAuthUserId(ctx);
const threadId = await createThread(ctx, components.agent, {
  userId,
  title: "My thread",
  summary: "This is a summary of the thread",
});

Metadata may be provided as context to the agent automatically in the future, but for now it's a convenience that helps organize threads in the Playground.

Generating a message in a thread

You can generate a message in a thread via the agent functions: agent.generateText, agent.generateObject, agent.streamText, and agent.streamObject. Any agent can generate a message in a thread created by any other agent.

const agent = new Agent(components.agent, { languageModel, instructions });

export const generateReplyToPrompt = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    // await authorizeThreadAccess(ctx, threadId);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});


See Messages for more details on creating and saving messages.

Continuing a thread using the thread object from agent.continueThread

You can also continue a thread by creating an agent-specific thread object, either when calling agent.createThread or agent.continueThread from within an action. This allows calling methods without specifying those parameters each time.

const { thread } = await agent.continueThread(ctx, { threadId });
const result = await thread.generateText({ prompt });

The thread from continueThread or createThread (available in actions only) is a Thread object, which has convenience methods that are thread-specific:

thread.getMetadata() to get the userId, title, summary etc.
thread.updateMetadata({ patch: { title, summary, userId} }) to update the metadata
thread.generateText({ prompt, ... }) - equivalent to agent.generateText(ctx, { threadId }, { prompt, ... })
thread.streamText({ prompt, ... }) - equivalent to agent.streamText(ctx, { threadId }, { prompt, ... })
thread.generateObject({ prompt, ... }) - equivalent to agent.generateObject(ctx, { threadId }, { prompt, ... })
thread.streamObject({ prompt, ... }) - equivalent to agent.streamObject(ctx, { threadId }, { prompt, ... })
See Messages docs for more details on generating messages.

Deleting threads

You can delete threads by their threadId.

Asynchronously (from a mutation or action):

await agent.deleteThreadAsync(ctx, { threadId });

Synchronously in batches (from an action):

await agent.deleteThreadSync(ctx, { threadId });

You can also delete all threads by a user by their userId.

await agent.deleteThreadsByUserId(ctx, { userId });

Getting all threads owned by a user

const threads = await ctx.runQuery(
  components.agent.threads.listThreadsByUserId,
  { userId, paginationOpts: args.paginationOpts },
);

Deleting all threads and messages associated with a user

Asynchronously (from a mutation or action):

await ctx.runMutation(components.agent.users.deleteAllForUserIdAsync, {
  userId,
});

Synchronously (from an action):

await ctx.runMutation(components.agent.users.deleteAllForUserId, { userId });


Getting messages in a thread

See messages.mdx for more details.

import { listMessages } from "@convex-dev/agent";

const messages = await listMessages(ctx, components.agent, {
  threadId,
  excludeToolMessages: true,
  paginationOpts: { cursor: null, numItems: 10 }, // null means start from the beginning
});


Or for the UIMessage type (easier for rendering UIs):

import { listUIMessages } from "@convex-dev/agent";

const messages = await listUIMessages(ctx, components.agent, {
  threadId,
  paginationOpts: { cursor: null, numItems: 10 },
});

Messages

The Agent component stores message and thread history to enable conversations between humans and agents.

To see how humans can act as agents, see Human Agents.

Retrieving messages

For clients to show messages, you need to expose a query that returns the messages. For streaming, see retrieving streamed deltas for a modified version of this query.

See chat/basic.ts for the server-side code, and chat/streaming.ts for the streaming example.

import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { listUIMessages } from "@convex-dev/agent";
import { components } from "./_generated/api";

export const listThreadMessages = query({
  args: { threadId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await authorizeThreadAccess(ctx, threadId);

    const paginated = await listUIMessages(ctx, components.agent, args);

    // Here you could filter out / modify the documents
    return paginated;
  },
});

Note: Above we used listUIMessages, which returns UIMessages, specifically the Agent extension that includes some extra fields like order, status, etc. UIMessages combine multiple MessageDocs into a single UIMessage when there are multiple tool calls followed by an assistant message, making it easy to build UIs that work with the various "parts" on the UIMessage.

If you want to get MessageDocs, you can use listMessages instead.

Showing messages in React

See ChatStreaming.tsx for a streaming example, or ChatBasic.tsx for a non-streaming example.

useUIMessages hook

The crux is to use the useUIMessages hook. For streaming, pass in stream: true to the hook.

import { api } from "../convex/_generated/api";
import { useUIMessages } from "@convex-dev/agent/react";

function MyComponent({ threadId }: { threadId: string }) {
  const { results, status, loadMore } = useUIMessages(
    api.chat.streaming.listMessages,
    { threadId },
    { initialNumItems: 10 /* stream: true */ },
  );
  return (
    <div>
      {results.map((message) => (
        <div key={message.key}>{message.text}</div>
      ))}
    </div>
  );
}

Note: If you want to work with MessageDocs instead of UIMessages, you can use the older useThreadMessages hook instead. However, working with UIMessages enables richer streaming capabilities, such as status on whether the agent is actively reasoning.

UIMessage type

The Agent component extends the AI SDK's UIMessage type to provide convenient metadata for rendering messages.

The core UIMessage type from the AI SDK is:

parts is an array of parts (e.g. "text", "file", "image", "toolCall", "toolResult")
content is a string of the message content.
role is the role of the message (e.g. "user", "assistant", "system").
The helper adds these additional fields:

key is a unique identifier for the message.
order is the order of the message in the thread.
stepOrder is the step order of the message in the thread.
status is the status of the message (or "streaming").
agentName is the name of the agent that generated the message.
text is the text of the message.
_creationTime is the timestamp of the message. For streaming messages, it's currently assigned to the current time on the streaming client.
To reference these, ensure you're importing UIMessage from @convex-dev/agent.

toUIMessages helper

toUIMessages is a helper function that transforms MessageDocs into AI SDK "UIMessage"s. This is a convenient data model for displaying messages.

If you are using useThreadMessages for instance, you can convert the messages to UIMessages like this:

import { toUIMessages, type UIMessage } from "@convex-dev/agent";

...
const { results } = useThreadMessages(...);
const uiMessages = toUIMessages(results);

Optimistic updates for sending messages

The optimisticallySendMessage function is a helper function for sending a message, so you can optimistically show a message in the message list until the mutation has completed on the server.

Pass in the query that you're using to list messages, and it will insert the ephemeral message at the top of the list.

const sendMessage = useMutation(
  api.streaming.streamStoryAsynchronously,
).withOptimisticUpdate(
  optimisticallySendMessage(api.streaming.listThreadMessages),
);

If your arguments don't include { threadId, prompt } then you can use it as a helper function in your optimistic update:

import { optimisticallySendMessage } from "@convex-dev/agent/react";

const sendMessage = useMutation(
  api.chatStreaming.streamStoryAsynchronously,
).withOptimisticUpdate(
  (store, args) => {
    optimisticallySendMessage(api.chatStreaming.listThreadMessages)(store, {
      threadId:
      prompt: /* change your args into the user prompt. */,
    })
  }
);


Saving messages

By default, the Agent will save messages to the database automatically when you provide them as a prompt, as well as all generated messages.

However, it is useful to save the prompt message ahead of time and use the promptMessageId to continue the conversation. See Agent Usage for more details.

You can save messages to the database manually using saveMessage or saveMessages, either on the Agent class or as a direct function call.

You can pass a prompt or a full message (ModelMessage type)
The metadata argument is optional and allows you to provide more details, such as sources, reasoningDetails, usage, warnings, error, etc.
const { messageId } = await saveMessage(ctx, components.agent, {
  threadId,
  userId,
  message: { role: "user", content: "The user message" },
});

Note: when calling agent.generateText with the raw prompt, embeddings are generated automatically for vector search (if you have a text embedding model configured). Similarly with agent.saveMessage when calling from an action. However, if you're saving messages in a mutation, where calling an LLM is not possible, it will generate them automatically if generateText receives a promptMessageId that lacks an embedding (and you have a text embedding model configured).

Without the Agent class:

Note: If you aren't using the Agent class with a text embedding model set, you need to pass an embedding if you want to save it at the same time.

import { saveMessage } from "@convex-dev/agent";

const { messageId } = await saveMessage(ctx, components.agent, {
  threadId,
  userId,
  message: { role: "assistant", content: result },
  metadata: [{ reasoning, usage, ... }] // See MessageWithMetadata type
  agentName: "my-agent",
  embedding: { vector: [0.1, 0.2, ...], model: "text-embedding-3-small" },
});

Using the Agent class:

const { messageId } = await agent.saveMessage(ctx, {
  threadId,
  userId,
  prompt,
  metadata,
});

const { messages } = await agent.saveMessages(ctx, {
  threadId, userId,
  messages: [{ role, content }],
  metadata: [{ reasoning, usage, ... }] // See MessageWithMetadata type
});

If you are saving the message in a mutation and you have a text embedding model set, pass skipEmbeddings: true. The embeddings for the message will be generated lazily if the message is used as a prompt. Or you can provide an embedding upfront if it's available, or later explicitly generate them using agent.generateEmbeddings.

Configuring the storage of messages

Generally the defaults are fine, but if you want to pass in multiple messages and have them all saved (vs. just the last one), or avoid saving any input or output messages, you can pass in a storageOptions object, either to the Agent constructor or per-message.

The use-case for passing in multiple messages but not saving them is if you want to include some extra messages for context to the LLM, but only the last message is the user's actual request. e.g. messages = [...messagesFromRag, messageFromUser]. The default is to save the prompt and all output messages.

const result = await thread.generateText({ messages }, {
  storageOptions: {
    saveMessages: "all" | "none" | "promptAndOutput";
  },
});

Message ordering

Each message has order and stepOrder fields, which are incrementing integers specific to a thread.

When saveMessage or generateText is called, the message is added to the thread's next order with a stepOrder of 0.

As response message(s) are generated in response to that message, they are added at the same order with the next stepOrder.

To associate a response message with a previous message, you can pass in the promptMessageId to generateText and others.

Note: if the promptMessageId is not the latest message in the thread, the context for the message generation will not include any messages following the promptMessageId.

Deleting messages

You can delete messages by their _id (returned from saveMessage or generateText) or order / stepOrder.

By ID:

await agent.deleteMessage(ctx, { messageId });
// batch delete
await agent.deleteMessages(ctx, { messageIds });

By order (start is inclusive, end is exclusive):

// Delete all messages with the same order as a given message:
await agent.deleteMessageRange(ctx, {
  threadId,
  startOrder: message.order,
  endOrder: message.order + 1,
});
// Delete all messages with order 1 or 2.
await agent.deleteMessageRange(ctx, { threadId, startOrder: 1, endOrder: 3 });
// Delete all messages with order 1 and stepOrder 2-4
await agent.deleteMessageRange(ctx, {
  threadId,
  startOrder: 1,
  startStepOrder: 2,
  endOrder: 2,
  endStepOrder: 5,
});


Other utilities:

import { ... } from "@convex-dev/agent";

serializeDataOrUrl is a utility function that serializes an AI SDK DataContent or URL to a Convex-serializable format.
filterOutOrphanedToolMessages is a utility function that filters out tool call messages that don't have a corresponding tool result message.
extractText is a utility function that extracts text from a ModelMessage-like object.
Validators and types

There are types to validate and provide types for various values

import { ... } from "@convex-dev/agent";

vMessage is a validator for a ModelMessage-like object (with a role and content field e.g.).
MessageDoc and vMessageDoc are the types for a message (which includes a .message field with the vMessage type).
Thread is the type of a thread returned from continueThread or createThread.
ThreadDoc and vThreadDoc are the types for thread metadata.
AgentComponent is the type of the installed component (e.g. components.agent).
ToolCtx is the ctx type for calls to createTool tools.

Streaming

Streaming messages is a great way to give a user feedback and keep an application feeling responsive while using LLMs.

Traditionally streaming happens via HTTP streaming, where the client sends a request and waits until the full response is streamed back. This works out of the box when using the Agent, in the same way you would with the AI SDK. See below if that is all you're looking for.

However, with the Agent component you can also stream messages asynchronously, meaning the generation doesn't have to happen in an HTTP handler (httpAction), and the response can be streamed back to one or more clients even if their network connection is interrupted.

It works by saving the streaming parts to the database in groups (deltas), and the clients subscribe to new deltas for the given thread, as they're generated. As a bonus, you don't even need to use the Agent's version of streamText to use the delta streaming approach (see below).

Example:

Server: streaming.ts
Client: ChatStreaming.tsx
Streaming message deltas

The easiest way to stream is to pass { saveStreamDeltas: true } to agent.streamText. This will save chunks of the response as deltas as they're generated, so all clients can subscribe to the stream and get live-updating text via normal Convex queries.

agent.streamText(ctx, { threadId }, { prompt }, { saveStreamDeltas: true });


This can be done in an async function, where http streaming to a client is not possible. Under the hood it will chunk up the response and debounce saving the deltas to prevent excessive bandwidth usage. You can pass more options to saveStreamDeltas to configure the chunking and debouncing.

  { saveStreamDeltas: { chunking: "line", throttleMs: 1000 } },

chunking can be "word", "line", a regex, or a custom function.
throttleMs is how frequently the deltas are saved. This will send multiple chunks per delta, writes sequentially, and will not write faster than the throttleMs (single-flighted ).
Retrieving streamed deltas

For clients to stream messages, you need to expose a query that returns the stream deltas. This is very similar to retrieving messages, with a few changes:

import { paginationOptsValidator } from "convex/server";
import { vStreamArgs, listUIMessages, syncStreams } from "@convex-dev/agent";
import { components } from "./_generated/api";

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    // Pagination options for the non-streaming messages.
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    await authorizeThreadAccess(ctx, threadId);

    // Fetches the regular non-streaming messages.
    const paginated = await listUIMessages(ctx, components.agent, args);

    const streams = await syncStreams(ctx, components.agent, args);

    return { ...paginated, streams };
  },
});


Similar to with non-streaming messages, you can use the useUIMessages hook to fetch the messages, passing in stream: true to enable streaming.

const { results, status, loadMore } = useUIMessages(
  api.chat.streaming.listMessages,
  { threadId },
  { initialNumItems: 10, stream: true },
);

Text smoothing with SmoothText and useSmoothText

The useSmoothText hook is a simple hook that smooths the text as it changes. It can work with any text, but is especially handy for streaming text.

import { useSmoothText } from "@convex-dev/agent/react";

// in the component
const [visibleText] = useSmoothText(message.text);

You can configure the initial characters per second. It will adapt over time to match the average speed of the text coming in.

By default it won't stream the first text it receives unless you pass in startStreaming: true. To start streaming immediately when you have a mix of streaming and non-streaming messages, do:

import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";

function Message({ message }: { message: UIMessage }) {
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });
  return <div>{visibleText}</div>;
}

If you don't want to use the hook, you can use the SmoothText component.

import { SmoothText } from "@convex-dev/agent/react";

//...
<SmoothText text={message.text} />;

Consuming the stream yourself with the Agent

You can consume the stream in all the ways you can with the underlying AI SDK - for instance iterating over the content, or using result.toDataStreamResponse().

If you are not also saving the deltas, it might look like this:

const result = await agent.streamText(ctx, { threadId }, { prompt });

for await (const textPart of result.textStream) {
  console.log(textPart);
}

If you want to both iterate as the stream is happening, as well as save the deltas, you can pass { saveStreamDeltas: { returnImmediately: true } } to streamText. This will return immediately, and you can then iterate over the stream live, or return the stream in an HTTP Response.

const result = await agent.streamText(
  ctx,
  { threadId },
  { prompt },
  { saveStreamDeltas: { returnImmediately: true } },
);

return result.toUIMessageStreamResponse();

If you don't want to have the Agent involved at all, the next section will show you how to save the deltas yourself.

Advanced: Streaming deltas asynchronously without using an Agent

To stream messages without using the Agent's wrapper of streamText, you can use the streamText function from the AI SDK directly.

It consists of using the DeltaStreamer class to save the deltas to the database, and then using the above approach to retrieve the messages, though you can use a more direct useStreamingUIMessages hook that doesn't involve reading any non-streaming messages from the database.

The requirements for reading and writing the streams are just that they use a threadId from the Agent component, and that each stream is saved with a distinct order, for ordering on the client side.

import { components } from "./_generated/api";
import { type ActionCtx } from "./_generated/server";
import { DeltaStreamer, compressUIMessageChunks } from "@convex-dev/agent";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

async function stream(ctx: ActionCtx, threadId: string, order: number) {
  const streamer = new DeltaStreamer(
    components.agent,
    ctx,
    {
      throttleMs: 100,
      onAsyncAbort: async () => console.error("Aborted asynchronously"),
      // This will collapse multiple tiny deltas into one if they're being sent
      // in quick succession.
      compress: compressUIMessageChunks,
      abortSignal: undefined,
    },
    {
      threadId,
      format: "UIMessageChunk",
      order,
      stepOrder: 0,
      userId: undefined,
    },
  );
  // Do the normal streaming with the AI SDK
  const response = streamText({
    model: openai.chat("gpt-4o-mini"),
    prompt: "Tell me a joke",
    abortSignal: streamer.abortController.signal,
    onError: (error) => {
      console.error(error);
      streamer.fail(errorToString(error.error));
    },
  });

  // We could await here if we wanted to wait for the stream to finish,
  // but instead we have it process asynchronously so we can return a streaming
  // http Response.
  void streamer.consumeStream(response.toUIMessageStream());

  return {
    // e.g. to do `response.toTextStreamResponse()` for HTTP streaming.
    response,
    // We don't need this on the client, but with it we can have some clients
    // selectively not stream down deltas when they're using HTTP streaming
    // already.
    streamId: await streamer.getStreamId(),
  };
}


To fetch the deltas for the client, you can use the syncStreams function, as you would with normal Agent streaming. If you don't want to fetch the non-streaming messages, it can be simplified to:

import { v } from "convex/values";
import { vStreamArgs, syncStreams } from "@convex-dev/agent";
import { query } from "./_generated/server";
import { components } from "./_generated/api";

export const listStreams = query({
  args: {
    threadId: v.string(),
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    // await authorizeThreadAccess(ctx, args.threadId);
    const streams = await syncStreams(ctx, components.agent, {
      ...args,
      // By default syncStreams only returns streaming messages. However, if
      // your messages aren't saved in the same transaction as the streaming
      // ends, you might want to include them here to avoid UI flashes.
      includeStatuses: ["streaming", "aborted", "finished"],
    });
    return { streams };
  },
});


On the client side, you can use the useStreamingUIMessages hook to fetch the messages. If you defined more arguments than just threadId, they'll get passed along with threadId here.

const messages = useStreamingUIMessages(api.example.listStreams, { threadId });


You can pass in another parameter to either skip certain streamIds or to start at some order to ignore previous streams.

Playground

The Playground UI is a simple way to test, debug, and develop with the agent.

Playground UI Screenshot

Pick a user to list their threads.
Browse the user's threads.
List the selected thread's messages, along with tool call details.
Show message metadata details.
Experiment with contextual message lookup, adjusting context options.
Send a message to the thread, with configurable saving options.
It uses api keys to communicate securely with the backend.
There is also a hosted version here.

Setup

Note: You must already have a Convex project set up with the Agent. See the docs for setup instructions.

In your agent Convex project, make a file convex/playground.ts with:

import { definePlaygroundAPI } from "@convex-dev/agent";
import { components } from "./_generated/api";
import { weatherAgent, fashionAgent } from "./example";

/**
 * Here we expose the API so the frontend can access it.
 * Authorization is handled by passing up an apiKey that can be generated
 * on the dashboard or via CLI via:
 * npx convex run --component agent apiKeys:issue
 */
export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, {
  agents: [weatherAgent, fashionAgent],
});

From in your project's repo, issue yourself an API key:

npx convex run --component agent apiKeys:issue '{name:"..."}'

Note: to generate multiple keys, give a different name to each key. To revoke and reissue a key, pass the same name.

Then visit the hosted version.

It will ask for your Convex deployment URL, which can be found in .env.local. It will also ask for your API key that you generated above. If you used a different path for convex/playground.ts you can enter it. E.g. if you had convex/foo/bar.ts where you exported the playground API, you'd put in foo/bar.

Running it locally

You can run the playground locally with:

npx @convex-dev/agent-playground

It uses the VITE_CONVEX_URL env variable, usually pulling it from .env.local.
Previous
Streaming

Tools

The Agent component supports tool calls, which are a way to allow an LLM to call out to external services or functions. This can be useful for:

Retrieving data from the database
Writing or updating data in the database
Searching the web for more context
Calling an external API
Requesting that a user takes an action before proceeding (human-in-the-loop)
Defining tools

You can provide tools at different times:

Agent constructor: (new Agent(components.agent, { tools: {...} }))
Creating a thread: createThread(ctx, { tools: {...} })
Continuing a thread: continueThread(ctx, { tools: {...} })
On thread functions: thread.generateText({ tools: {...} })
Outside of a thread: supportAgent.generateText(ctx, {}, { tools: {...} })
Specifying tools at each layer will overwrite the defaults. The tools will be args.tools ?? thread.tools ?? agent.options.tools. This allows you to create tools in a context that is convenient.

Using tools

The Agent component will automatically handle passing tool call results back in and re-generating if you pass stopWhen: stepCountIs(num) where num > 1 to generateText or streamText.

The tool call and result will be stored as messages in the thread associated with the source message. See Messages for more details.

Creating a tool with a Convex context

There are two ways to create a tool that has access to the Convex context.

Use the createTool function, which is a wrapper around the AI SDK's tool function.
export const ideaSearch = createTool({
  description: "Search for ideas in the database",
  args: z.object({ query: z.string().describe("The query to search for") }),
  handler: async (ctx, args, options): Promise<Array<Idea>> => {
    // ctx has agent, userId, threadId, messageId
    // as well as ActionCtx properties like auth, storage, runMutation, and runAction
    const ideas = await ctx.runQuery(api.ideas.searchIdeas, {
      query: args.query,
    });
    console.log("found ideas", ideas);
    return ideas;
  },
});


Define tools at runtime in a context with the variables you want to use.
async function createTool(ctx: ActionCtx, teamId: Id<"teams">) {
  const myTool = tool({
    description: "My tool",
    parameters: z.object({...}).describe("The arguments for the tool"),
    execute: async (args, options): Promise<BarReturnType> => {
      return await ctx.runQuery(internal.foo.bar, args);
    },
  });
}

In both cases, the args and options match the underlying AI SDK's tool function.

If you run into type errors, ensure you're annotating the return type of the execute function, and if necessary, the return type of the handlers of any functions you call with ctx.run*.

Note: it's highly recommended to use zod with .describe to provide details about each parameter. This will be used to provide a description of the tool to the LLM.

Adding custom context to tools

It's often useful to have extra metadata in the context of a tool.

By default, the context passed to a tool is a ToolCtx with:

agent - the Agent instance calling it
userId - the user ID associated with the call, if any
threadId - the thread ID, if any
messageId - the message ID of the prompt message passed to generate/stream.
Everything in ActionCtx, such as auth, storage, runQuery, etc. Note: in scheduled functions, workflows, etc, the auth user will be null.
To add more fields to the context, you can pass a custom context to the call, such as agent.generateText({ ...ctx, orgId: "123" }).

You can enforce the type of the context by passing a type when constructing the Agent.

const myAgent = new Agent<{ orgId: string }>(...);

Then, in your tools, you can use the orgId field.

type MyCtx = ToolCtx & { orgId: string };

const myTool = createTool({
  args: z.object({ ... }),
  description: "...",
  handler: async (ctx: MyCtx, args) => {
    // use ctx.orgId
  },
});

Using an LLM or Agent as a tool

You can do generation within a tool call, for instance if you wanted one Agent to ask another Agent a question.

Note: you don't have to structure agents calling each other as tool calls. You could instead decide which Agent should respond next based on other context and have many Agents contributing in the same thread.

The simplest way to model Agents as tool calls is to have each tool call work in an independent thread, or do generation without a thread at all. Then, the output is returned as the tool call result for the next LLM step to use. When you do it this way, you don't need to explicitly save the tool call result to the parent thread.

Direct LLM generation without a thread:

const llmTool = createTool({
  description: "Ask a question to some LLM",
  args: z.object({
    message: z.string().describe("The message to ask the LLM"),
  }),
  handler: async (ctx, args): Promise<string> => {
    const result = await generateText({
      system: "You are a helpful assistant.",
      // Pass through all messages from the current generation
      prompt: [...options.messages, { role: "user", content: args.message }],
      model: myLanguageModel,
    });
    return result.text;
  },
});


Using an Agent as a tool

const agentTool = createTool({
  description: `Ask a question to agent ${agent.name}`,
  args: z.object({
    message: z.string().describe("The message to ask the agent"),
  }),
  handler: async (ctx, args, options): Promise<string> => {
    const { userId } = ctx;
    const { thread } = await agent.createThread(ctx, { userId });
    const result = await thread.generateText(
      {
        // Pass through all messages from the current generation
        prompt: [...options.messages, { role: "user", content: args.message }],
      },
      // Save all the messages from the current generation to this thread.
      { storageOptions: { saveMessages: "all" } },
    );
    // Optionally associate the child thread with the parent thread in your own
    // tables.
    await saveThreadAsChild(ctx, ctx.threadId, thread.threadId);
    return result.text;
  },
});

LLM Context

By default, the Agent will provide context based on the message history of the thread. This context is used to generate the next message.

The context can include recent messages, as well as messages found via text and /or vector search.

If a promptMessageId is provided, the context will include that message, as well as any other messages on that same order. More details on order are in messages.mdx, but in practice this means that if you pass the ID of the user-submitted message as the promptMessageId and there had already been some assistant and/or tool responses, those will be included in the context, allowing the LLM to continue the conversation.

You can also use RAG to add extra context to your prompt.

Customizing the context

You can customize the context provided to the agent when generating messages with custom contextOptions. These can be set as defaults on the Agent, or provided at the call-site for generateText or others.

const result = await agent.generateText(
  ctx,
  { threadId },
  { prompt },
  {
    // Values shown are the defaults.
    contextOptions: {
      // Whether to exclude tool messages in the context.
      excludeToolMessages: true,
      // How many recent messages to include. These are added after the search
      // messages, and do not count against the search limit.
      recentMessages: 100,
      // Options for searching messages via text and/or vector search.
      searchOptions: {
        limit: 10, // The maximum number of messages to fetch.
        textSearch: false, // Whether to use text search to find messages.
        vectorSearch: false, // Whether to use vector search to find messages.
        // Note, this is after the limit is applied.
        // E.g. this will quadruple the number of messages fetched.
        // (two before, and one after each message found in the search)
        messageRange: { before: 2, after: 1 },
      },
      // Whether to search across other threads for relevant messages.
      // By default, only the current thread is searched.
      searchOtherThreads: false,
    },
  },
);


Full context control

To have full control over which messages are passed to the LLM, you can either:

Provide a contextHandler to filter, modify, or enrich the context messages.
Provide all messages manually via the messages argument and specify contextOptions to use no recent or search messages. See below for how to fetch context messages manually.
Providing a contextHandler

The Agent will combine messages from search, recent, input messages, and all messages on the same order as the promptMessageId if that is provided.

You can customize how they are combined, as well as add or remove messages by providing a contextHandler which returns the ModelMessage[] which will be passed to the LLM.

You can specify a contextHandler in the Agent constructor, or at the call-site for a single generation, which overrides any Agent default.

const myAgent = new Agent(components.agent, {
  ///...
  contextHandler: async (ctx, args) => {
    // This is the default behavior.
    return [
      ...args.search,
      ...args.recent,
      ...args.inputMessages,
      ...args.inputPrompt,
      ...args.existingResponses,
    ];
    // Equivalent to:
    return args.allMessages;
  },
);

With this callback, you can:

Filter out messages you don't want to include.
Add memories or other context.
Add sample messages to guide the LLM on how it should respond.
Inject extra context based on the user or thread.
Copy in messages from other threads.
Summarize messages.
For example:

// Note: when you specify it at the call-site, you can also leverage variables
// available in the scope, e.g. if the user is in a specific step in a workflow.
const result = await agent.generateText(
  ctx,
  { threadId },
  { prompt },
  {
    contextHandler: async (ctx, args) => {
      // Filter out messages that are not relevant.
      const relevantSearch = args.search.filter((m) => messageIsRelevant(m));
      // Fetch user memories to include in every prompt.
      const userMemories = await getUserMemories(ctx, args.userId);
      // Fetch sample messages to instruct the LLM on how to respond.
      const sampleMessages = [
        { role: "user", content: "Generate a function that adds two numbers" },
        { role: "assistant", content: "function add(a, b) { return a + b; }" },
      ];
      // Fetch user context to include in every prompt.
      const userContext = await getUserContext(ctx, args.userId, args.threadId);
      // Fetch messages from a related / parent thread.
      const related = await getRelatedThreadMessages(ctx, args.threadId);
      return [
        // Summarize or truncate context messages if they are too long.
        ...(await summarizeOrTruncateIfTooLong(related)),
        ...relevantSearch,
        ...userMemories,
        ...sampleMessages,
        ...userContext,
        ...args.recent,
        ...args.inputMessages,
        ...args.inputPrompt,
        ...args.existingResponses,
      ];
    },
  },
);


Fetch context manually

If you want to get context messages for a given prompt, without calling the LLM, you can use fetchContextWithPrompt. This is used internally to get the context messages passed to the AI SDK generateText, streamText, etc.

As with normal generation, you can provide a prompt or messages, and/or a promptMessageId to fetch the context messages using a given pre-saved message as the prompt.

This will return recent and search messages combined with the input messages.

import { fetchContextWithPrompt } from "@convex-dev/agent";

const { messages } = await fetchContextWithPrompt(ctx, components.agent, {
  prompt,
  messages,
  promptMessageId,
  userId,
  threadId,
  contextOptions,
});

Search for messages

This is what the agent does automatically, but it can be useful to do manually, e.g. to find custom context to include.

For text and vector search, you can provide a targetMessageId and/or searchText. It will embed the text for vector search. If searchText is not provided, it will use the target message's text.

If targetMessageId is provided, it will only fetch search messages previous to that message, and recent messages up to and including that message's "order". This enables re-generating a response for an earlier message.

import type { MessageDoc } from "@convex-dev/agent";

const messages: MessageDoc[] = await agent.fetchContextMessages(ctx, {
  threadId,
  searchText: prompt, // Optional unless you want text/vector search.
  targetMessageId: promptMessageId, // Optionally target the search.
  userId, // Optional, unless `searchOtherThreads` is true.
  contextOptions, // Optional, defaults are used if not provided.
});

Note: you can also search for messages without an agent. The main difference is that in order to do vector search, you need to create the embeddings yourself, and it will not run your usage handler.

import { fetchRecentAndSearchMessages } from "@convex-dev/agent";

const { recentMessages, searchMessages } = await fetchRecentAndSearchMessages(
  ctx,
  components.agent,
  {
    threadId,
    searchText: prompt, // Optional unless you want text/vector search.
    targetMessageId: promptMessageId, // Optionally target the search.
    contextOptions, // Optional, defaults are used if not provided.
    getEmbedding: async (text) => {
      const embedding = await textEmbeddingModel.embed(text);
      return { embedding, textEmbeddingModel };
    },
  },
);


Searching other threads

If you set searchOtherThreads to true, the agent will search across all threads belonging to the provided userId. This can be useful to have multiple conversations that the Agent can reference.

The search will use a hybrid of text and vector search.

Passing in messages as context

You can pass in messages as context to the Agent's LLM, for instance to implement Retrieval-Augmented Generation. The final messages sent to the LLM will be:

The system prompt, if one is provided or the agent has instructions
The messages found via contextOptions
The messages argument passed into generateText or other function calls.
If a prompt argument was provided, a final { role: "user", content: prompt } message.
This allows you to pass in messages that are not part of the thread history and will not be saved automatically, but that the LLM will receive as context.

Manage embeddings manually

The textEmbeddingModel argument to the Agent constructor allows you to specify a text embedding model to use for vector search.

If you set this, the agent will automatically generate embeddings for messages and use them for vector search.

When you change models or decide to start or stop using embeddings for vector search, you can manage the embeddings manually.

Generate embeddings for a set of messages. Optionally pass config with a usage handler, which can be a globally shared Config.

import { embedMessages } from "@convex-dev/agent";

const embeddings = await embedMessages(
  ctx,
  { userId, threadId, textEmbeddingModel, ...config },
  [{ role: "user", content: "What is love?" }],
);

Generate and save embeddings for existing messages.

const embeddings = await supportAgent.generateAndSaveEmbeddings(ctx, {
  messageIds,
});

Get and update embeddings, e.g. for a migration to a new model.

const messages = await ctx.runQuery(components.agent.vector.index.paginate, {
  vectorDimension: 1536,
  targetModel: "gpt-4o-mini",
  cursor: null,
  limit: 10,
});


Updating the embedding by ID.

const messages = await ctx.runQuery(components.agent.vector.index.updateBatch, {
  vectors: [{ model: "gpt-4o-mini", vector: embedding, id: msg.embeddingId }],
});


Note: If the dimension changes, you need to delete the old and insert the new.

Delete embeddings

await ctx.runMutation(components.agent.vector.index.deleteBatch, {
  ids: [embeddingId1, embeddingId2],
});

Insert embeddings

const ids = await ctx.runMutation(components.agent.vector.index.insertBatch, {
  vectorDimension: 1536,
  vectors: [
    {
      model: "gpt-4o-mini",
      table: "messages",
      userId: "123",
      threadId: "123",
      vector: embedding,
      // Optional, if you want to update the message with the embeddingId
      messageId: messageId,
    },
  ],
});

RAG (Retrieval-Augmented Generation) with the Agent component

The Agent component has built-in capabilities to search message history with hybrid text & vector search. You can also use the RAG component to use other data to search for context.

What is RAG?

Retrieval-Augmented Generation (RAG) is a technique that allows an LLM to search through custom knowledge bases to answer questions.

RAG combines the power of Large Language Models (LLMs) with knowledge retrieval. Instead of relying solely on the model's training data, RAG allows your AI to:

Search through custom documents and knowledge bases
Retrieve relevant context for answering questions
Provide more accurate, up-to-date, and domain-specific responses
Cite sources and explain what information was used
RAG Component


The RAG component is a Convex component that allows you to add data that you can search. It breaks up the data into chunks and generates embeddings to use for vector search. See the RAG component docs for details, but here are some key features:

Namespaces: Use namespaces for user-specific or team-specific data to isolate search domains.
Add Content: Add or replace text content by key.
Semantic Search: Vector-based search using configurable embedding models
Custom Filtering: Define filters on each document for efficient vector search.
Chunk Context: Get surrounding chunks for better context.
Importance Weighting: Weight content by providing a 0 to 1 "importance" to affect per-document vector search results.
Chunking flexibility: Bring your own document chunking, or use the default.
Graceful Migrations: Migrate content or whole namespaces without disruption.
CONVEX COMPONENT
RAG (Retrieval-Augmented Generation)
Search documents for relevant content to prompt an LLM using embeddings.
RAG Approaches

This directory contains two different approaches to implementing RAG:

1. Prompt-based RAG

A straightforward implementation where the system automatically searches for relevant context for a user query.

The message history will only include the original user prompt and the response, not the context.
Looks up the context and injects it into the user's prompt.
Works well if you know the user's question will always benefit from extra context.
For example code, see ragAsPrompt.ts for the overall code. The simplest version is:

const context = await rag.search(ctx, {
  namespace: "global",
  query: userPrompt,
  limit: 10,
});

const result = await agent.generateText(
  ctx,
  { threadId },
  {
    prompt: `# Context:\n\n ${context.text}\n\n---\n\n# Question:\n\n"""${userPrompt}\n"""`,
  },
);


2. Tool-based RAG

The LLM can intelligently decide when to search for context or add new information by providing a tool to search for context.

The message history will include the original user prompt and message history.
After a tool call and response, the message history will include the tool call and response for the LLM to reference.
The LLM can decide when to search for context or add new information.
This works well if you want the Agent to be able to dynamically search.
See ragAsTools.ts for the code. The simplest version is:

searchContext: createTool({
  description: "Search for context related to this user prompt",
  args: z.object({ query: z.string().describe("Describe the context you're looking for") }),
  handler: async (ctx, { query }) => {
    const context = await rag.search(ctx, { namespace: userId, query });
    return context.text;
  },
}),


Key Differences

Feature	Basic RAG	Tool-based RAG
Context Search	Always searches	AI decides when to search
Adding Context	Manual via separate function	AI can add context during conversation
Flexibility	Simple, predictable	Intelligent, adaptive
Use Case	FAQ systems, document search	Dynamic knowledge management
Predictability	Defined by code	AI may query too much or little
Ingesting content

On the whole, the RAG component works with text. However, you can turn other files into text, either using parsing tools or asking an LLM to do it.

Parsing images

Image parsing does oddly well with LLMs. You can use generateText to describe and transcribe the image, and then use that description to search for relevant context. And by storing the associated image, you can then pass the original file around once you've retrieved it via searching.

See an example here.

const description = await thread.generateText({
  message: {
    role: "user",
    content: [{ type: "image", data: url, mimeType: blob.type }],
  },
});

Parsing PDFs

For PDF parsing, I suggest using Pdf.js in the browser.

Why not server-side?

Opening up the pdf can use hundreds of MB of memory, and requires downloading a big pdfjs bundle - so big it's usually fetched dynamically in practice. You probably wouldn't want to load that bundle on every function call server-side, and you're more limited on memory usage in serverless environments. If the browser already has the file, it's a pretty good environment to do the heavy lifting in (and free!).

There's an example in the RAG demo, used in the UI here, with Pdf.js served statically.

If you really want to do it server-side and don't worry about cost or latency, you can pass it to an LLM, but note it takes a long time for big files.

See an example here.

Parsing text files

Generally you can use text files directly, for code or markdown or anything with a natural structure an LLM can understand.

However, to get good embeddings, you can once again use an LLM to translate the text into a more structured format.

See an example here.

Examples in Action

To see these examples in action, check out the RAG example.

Adding text, pdf, and image content to the RAG component
Searching and generating text based on the context.
Introspecting the context produced by searching.
Browsing the chunks of documents produced.
Try out searching globally, per-user, or with custom filters.
Run the example with:

git clone https://github.com/get-convex/rag.git
cd rag
npm run setup
npm run example

Workflows

Agentic Workflows can be decomposed into two elements:

Prompting an LLM (including message history, context, etc.).
Deciding what to do with the LLM's response.
We generally call them workflows when there are multiple steps involved, they involve dynamically deciding what to do next, are long-lived, or have a mix of business logic and LLM calls.

Tool calls and MCP come into play when the LLM's response is a specific request for an action to take. The list of available tools and result of the calls are used in the prompt to the LLM.

One especially powerful form of Workflows are those that can be modeled as durable functions that can be long-lived, survive server restarts, and have strong guarantees around retrying, idempotency, and completing.

The simplest version of this could be doing a couple pre-defined steps, such as first getting the weather forecast, then getting fashion advice based on the weather. For a code example, see workflows/chaining.ts.

export const getAdvice = action({
  args: { location: v.string(), threadId: v.string() },
  handler: async (ctx, { location, threadId }) => {
    // This uses tool calls to get the weather forecast.
    await weatherAgent.generateText(
      ctx,
      { threadId },
      { prompt: `What is the weather in ${location}?` },
    );
    // This includes previous message history from the thread automatically and
    // uses tool calls to get user-specific fashion advice.
    await fashionAgent.generateText(
      ctx,
      { threadId },
      { prompt: `What should I wear based on the weather?` },
    );
    // We don't need to return anything, since the messages are saved
    // automatically and clients will get the response via subscriptions.
  },
});


Building reliable workflows

One common pitfall when working with LLMs is their unreliability. API providers have outages, and LLMs can be flaky. To build reliable workflows, you often need three properties:

Reliable retries
Load balancing
Durability and idempotency for multi-step workflows
Thankfully there are Convex components to leverage for these properties.

Retries

By default, Convex mutations have these properties by default. However, calling LLMs require side-effects and using the network calls, which necessitates using actions. If you are only worried about retries, you can use the Action Retrier component.

However, keep reading, as the Workpool and Workflow components provide more robust solutions, including retries.

Load balancing

With long-running actions in a serverless environment, you may consume a lot of resources. And with tasks like ingesting data for RAG or other spiky workloads, there's a risk of running out of resources. To mitigate this, you can use the Workpool component. You can set a limit on the number of concurrent workers and add work asynchronously, with configurable retries and a callback to handle eventual success / failure.

However, if you also want to manage multi-step workflows, you should use the Workflow component, which also provides retries and load balancing out of the box.

Durability and idempotency for multi-step workflows

When doing multi-step workflows that can fail mid-way, you need to ensure that the workflow can be resumed from where it left off, without duplicating work. The Workflow builds on the Workpool to provide durable execution of long running functions with retries and delays.

Each step in the workflow is run, with the result recorded. Even if the server fails mid-way, it will resume with the latest incomplete step, with configurable retry settings.

Using the Workflow component for long-lived durable workflows

The Workflow component is a great way to build long-lived, durable workflows. It handles retries and guarantees of eventually completing, surviving server restarts, and more. Read more about durable workflows in this Stack post.

To use the agent alongside workflows, you can run individual idempotent steps that the workflow can run, each with configurable retries, with guarantees that the workflow will eventually complete. Even if the server crashes mid-workflow, the workflow will pick up from where it left off and run the next step. If a step fails and isn't caught by the workflow, the workflow's onComplete handler will get the error result.

Exposing the agent as Convex actions

You can expose the agent's capabilities as Convex functions to be used as steps in a workflow.

To create a thread as a standalone mutation, similar to createThread:

export const createThread = supportAgent.createThreadMutation();

For an action that generates text in a thread, similar to thread.generateText:

export const getSupport = supportAgent.asTextAction({
  stopWhen: stepCountIs(10),
});

You can also expose a standalone action that generates an object.

export const getStructuredSupport = supportAgent.asObjectAction({
  schema: z.object({
    analysis: z.string().describe("A detailed analysis of the user's request."),
    suggestion: z.string().describe("A suggested action to take."),
  }),
});


To save messages explicitly as a mutation, similar to agent.saveMessages:

export const saveMessages = supportAgent.asSaveMessagesMutation();

This is useful for idempotency, as you can first create the user's message, then generate a response in an unreliable action with retries, passing in the existing messageId instead of a prompt.

Using the agent actions within a workflow

You can use the Workflow component to run agent flows. It handles retries and guarantees of eventually completing, surviving server restarts, and more. Read more about durable workflows in this Stack post.

const workflow = new WorkflowManager(components.workflow);

export const supportAgentWorkflow = workflow.define({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (step, { prompt, userId }) => {
    const { threadId } = await step.runMutation(internal.example.createThread, {
      userId,
      title: "Support Request",
    });
    const suggestion = await step.runAction(internal.example.getSupport, {
      threadId,
      userId,
      prompt,
    });
    const { object } = await step.runAction(
      internal.example.getStructuredSupport,
      {
        userId,
        message: suggestion,
      },
    );
    await step.runMutation(internal.example.sendUserMessage, {
      userId,
      message: object.suggestion,
    });
  },
});


See the code in workflows/chaining.ts.

Complex workflow patterns

While there is only an example of a simple workflow here, there are many complex patterns that can be built with the Agent component:

Dynamic routing to agents based on an LLM call or vector search
Fanning out to LLM calls, then combining the results
Orchestrating multiple agents
Cycles of Reasoning and Acting (ReAct)
Modeling a network of agents messaging each other
Workflows that can be paused and resumed
CONVEX COMPONENT
Action Retrier
Add reliability to unreliable external service calls. Retry idempotent calls with exponential backoff until success.
CONVEX COMPONENT
Workpool
Builds on the Action Retrier to provide parallelism limits and retries to manage large numbers of external requests efficiently.
CONVEX COMPONENT
Workflow
Builds on the Workpool to provide durable execution of long running functions with retries and delays.

Human Agents

The Agent component generally takes a prompt from a human or agent, and uses an LLM to generate a response.

However, there are cases where you want to generate the reply from a human acting as an agent, such as for customer support.

For full code, check out chat/human.ts

Saving a user message without generating a reply

You can save a message from a user without generating a reply by using the saveMessage function.

import { saveMessage } from "@convex-dev/agent";
import { components } from "./_generated/api";

await saveMessage(ctx, components.agent, {
  threadId,
  prompt: "The user message",
});

Saving a message from a human as an agent

Similarly, you can save a message from a human as an agent in the same way, using the message field to specify the role and agent name:

import { saveMessage } from "@convex-dev/agent";
import { components } from "./_generated/api";

await saveMessage(ctx, components.agent, {
  threadId,
  agentName: "Alex",
  message: { role: "assistant", content: "The human reply" },
});

Storing additional metadata about human agents

You can store additional metadata about human agents by using the saveMessage function, and adding the metadata field.

await saveMessage(ctx, components.agent, {
  threadId,
  agentName: "Alex",
  message: { role: "assistant", content: "The human reply" },
  metadata: {
    provider: "human",
    providerMetadata: {
      human: {
        /* ... */
      },
    },
  },
});

Deciding who responds next

You can choose whether the LLM or human responds next in a few ways:

Explicitly store in the database whether the user or LLM is assigned to the thread.
Using a call to a cheap and fast LLM to decide if the user question requires a human response.
Using vector embeddings of the user question and message history to make the decision, based on a corpus of sample questions and what questions are better handled by humans.
Have the LLM generate an object response that includes a field indicating whether the user question requires a human response.
Providing a tool to the LLM to decide if the user question requires a human response. The human response is then the tool response message.
Human responses as tool calls

You can have the LLM generate a tool call to a human agent to provide context to answer the user question by providing a tool that doesn't have a handler. Note: this generally happens when the LLM still intends to answer the question, but needs human intervention to do so, such as confirmation of a fact.

import { tool } from "ai";
import { z } from "zod/v3";

const askHuman = tool({
  description: "Ask a human a question",
  parameters: z.object({
    question: z.string().describe("The question to ask the human"),
  }),
});

export const ask = action({
  args: { question: v.string(), threadId: v.string() },
  handler: async (ctx, { question, threadId }) => {
    const result = await agent.generateText(
      ctx,
      { threadId },
      {
        prompt: question,
        tools: { askHuman },
      },
    );
    const supportRequests = result.toolCalls
      .filter((tc) => tc.toolName === "askHuman")
      .map(({ toolCallId, args: { question } }) => ({
        toolCallId,
        question,
      }));
    if (supportRequests.length > 0) {
      // Do something so the support agent knows they need to respond,
      // e.g. save a message to their inbox
      // await ctx.runMutation(internal.example.sendToSupport, {
      //   threadId,
      //   supportRequests,
      // });
    }
  },
});

export const humanResponseAsToolCall = internalAction({
  args: {
    humanName: v.string(),
    response: v.string(),
    toolCallId: v.string(),
    threadId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    await agent.saveMessage(ctx, {
      threadId: args.threadId,
      message: {
        role: "tool",
        content: [
          {
            type: "tool-result",
            result: args.response,
            toolCallId: args.toolCallId,
            toolName: "askHuman",
          },
        ],
      },
      metadata: {
        provider: "human",
        providerMetadata: {
          human: { name: args.humanName },
        },
      },
    });
    // Continue generating a response from the LLM
    await agent.generateText(
      ctx,
      { threadId: args.threadId },
      {
        promptMessageId: args.messageId,
      },
    );
  },
});

Files and Images in Agent messages

You can add images and files for the LLM to reference in the messages.

NOTE: Sending URLs to LLMs is much easier with the cloud backend, since it has publicly available storage URLs. To develop locally you can use ngrok or similar to proxy the traffic.

Example code:

files/autoSave.ts has a simple example of how to use the automatic file saving.
files/addFile.ts has an example of how to save the file, submit a question, and generate a response in separate steps.
files/generateImage.ts has an example of how to generate an image and save it in an assistant message.
FilesImages.tsx has client-side code.
Running the example

git clone https://github.com/get-convex/agent.git
cd agent
npm run setup
npm run example

Sending an image by uploading first and generating asynchronously

The standard approach is to:

Upload the file to the database (uploadFile action). Note: this can be in a regular action or in an httpAction, depending on what's more convenient.
Send a message to the thread (submitFileQuestion action)
Send the file to the LLM to generate / stream text asynchronously (generateResponse action)
Query for the messages from the thread (listThreadMessages query)
Rationale:

It's better to submit a message in a mutation vs. an action because you can use an optimistic update on the client side to show the sent message immediately and have it disappear exactly when the message comes down in the query.

However, you can't save to file storage from a mutation, so the file needs to already exist (hence the fileId).

You can then asynchronously generate the response (with retries / etc) without the client waiting.

1: Saving the file

import { storeFile } from "@convex-dev/agent";
import { components } from "./_generated/api";

const { file } = await storeFile(
  ctx,
  components.agent,
  new Blob([bytes], { type: mimeType }),
  {
    filename,
    sha256,
  },
);
const { fileId, url, storageId } = file;

2: Sending the message

// in your mutation
const { filePart, imagePart } = await getFile(ctx, components.agent, fileId);
const { messageId } = await fileAgent.saveMessage(ctx, {
  threadId,
  message: {
    role: "user",
    content: [
      imagePart ?? filePart, // if it's an image, prefer that kind.
      { type: "text", text: "What is this image?" },
    ],
  },
  metadata: { fileIds: [fileId] }, // IMPORTANT: this tracks the file usage.
});


3: Generating the response & querying the responses

This is done in the same way as text inputs.

// in an action
await thread.generateText({ promptMessageId: messageId });

// in a query
const messages = await agent.listMessages(ctx, { threadId, paginationOpts });


Inline saving approach

You can also pass in an image / file direction when generating text, if you're in an action. Any image or file passed in the message argument will automatically be saved in file storage if it's larger than 64k, and a fileId will be saved to the message.

Example:

await thread.generateText({
  message: {
    role: "user",
    content: [
      { type: "image", image: imageBytes, mimeType: "image/png" },
      { type: "text", text: "What is this image?" },
    ],
  },
});

Under the hood

Saving to the files has 3 components:

Saving to file storage (in your app, not in the component's storage). This means you can access it directly with the storageId and generate URLs.
Saving a reference (the storageId) to the file in the component. This will automatically keep track of how many messages are referencing the file, so you can vacuum files that are no longer used (see files/vacuum.ts).
Inserting a URL in place of the data in the message sent to the LLM, along with the mimeType and other metadata provided. It will be inferred if not provided in guessMimeType.
Can I just store the file myself and pass in a URL?

Yes! You can always pass a URL in the place of an image or file to the LLM.

const storageId = await ctx.storage.store(blob);
const url = await ctx.storage.getUrl(storageId);

await thread.generateText({
  message: {
    role: "user",
    content: [
      { type: "image", data: url, mimeType: blob.type },
      { type: "text", text: "What is this image?" },
    ],
  },
});

Generating images

There's an example in files/generateImage.ts that takes a prompt, generates an image with OpenAI's dall-e 2, then saves the image to a thread.

You can try it out with:

npx convex run files:generateImage:replyWithImage '{prompt: "make a picture of a cat" }'

Debugging

Debugging in the Playground

Generally the Playground gives a lot of information about what's happening, but when that is insufficient, you have other options.

Logging the raw request and response from LLM calls

You can provide a rawRequestResponseHandler to the agent to log the raw request and response from the LLM.

You could use this to log the request and response to a table, or use console logs with Log Streaming to allow debugging and searching through Axiom or another logging service.

const supportAgent = new Agent(components.agent, {
  ...
  rawRequestResponseHandler: async (ctx, { request, response }) => {
    console.log("request", request);
    console.log("response", response);
  },
});

Logging the context messages via the contextHandler

You can log the context messages via the contextHandler, if you're curious what exactly the LLM is receiving.

const supportAgent = new Agent(components.agent, {
  ...
  contextHandler: async (ctx, { allMessages }) => {
    console.log("context", allMessages);
    return allMessages;
  },
});

Inspecting the database in the dashboard

You can go to the Data tab in the dashboard and select the agent component above the table list to see the Agent data. The organization of the tables matches the schema. The most useful tables are:

threads has one row per thread
messages has a separate row for each ModelMessage - e.g. a user message, assistant tool call, tool result, assistant message, etc. The most important fields are agentName for which agent it's associated with, status, order and stepOrder which are used to order the messages, and message which is roughly what is passed to the LLM.
streamingMessages has an entry for each streamed message, until it's cleaned up. You can take the ID to look at the associated streamDeltas table.
files captures the files tracked by the Agent from content that was sent in a message that got stored in File Storage.
Troubleshooting

Type errors on components.agent

If you get type errors about components.agent, ensure you've run npx convex dev to generate code for the component. The types expected by the library are in the npm library, and the types for components.agent currently come from generated code in your project (via npx convex dev).

Circular dependencies

Having the return value of workflows depend on other Convex functions can lead to circular dependencies due to the internal.foo.bar way of specifying functions. The way to fix this is to explicitly type the return value of the workflow. When in doubt, add return types to more handler functions, like this:

export const supportAgentWorkflow = workflow.define({
  args: { prompt: v.string(), userId: v.string(), threadId: v.string() },
  handler: async (step, { prompt, userId, threadId }): Promise<string> => {
    // ...
  },
});

// And regular functions too:
export const myFunction = action({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }): Promise<string> => {
    // ...
  },
});

Rate Limiting

Rate limiting is a way to control the rate of requests to your AI agent, preventing abuse and managing API budgets.

To demonstrate using the Rate Limiter component, there is an example implementation you can run yourself.

It rate limits the number of messages a user can send in a given time period, as well as the total token usage for a user. When a limit is exceeded, the client can reactively tell the user how long to wait (even if they exceeded the limit in another browser tab!).

For general usage tracking, see Usage Tracking.

Overview

The rate limiting example demonstrates two types of rate limiting:

Message Rate Limiting: Prevents users from sending messages too frequently
Token Usage Rate Limiting: Controls AI model token consumption over time
Running the Example

git clone https://github.com/get-convex/agent.git
cd agent
npm run setup
npm run example

Try sending multiple questions quickly to see the rate limiting in action!

Rate Limiting Strategy

Below we'll go through each configuration. You can also see the full example implementation in rateLimiting.ts.

import { MINUTE, RateLimiter, SECOND } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  sendMessage: {
    kind: "fixed window",
    period: 5 * SECOND,
    rate: 1,
    capacity: 2,
  },
  globalSendMessage: { kind: "token bucket", period: MINUTE, rate: 1_000 },
  tokenUsagePerUser: {
    kind: "token bucket",
    period: MINUTE,
    rate: 2000,
    capacity: 10000,
  },
  globalTokenUsage: { kind: "token bucket", period: MINUTE, rate: 100_000 },
});


1. Fixed Window Rate Limiting for Messages

// export const rateLimiter = new RateLimiter(components.rateLimiter, {
sendMessage: { kind: "fixed window", period: 5 * SECOND, rate: 1, capacity: 2 }


Allows 1 message every 5 seconds per user.
Prevents spam and rapid-fire requests.
Allows up to a 2 message burst to be sent within 5 seconds via capacity, if they had usage leftover from the previous 5 seconds.
Global limit:

globalSendMessage: { kind: "token bucket", period: MINUTE, rate: 1_000 },

Allows 1000 messages per minute globally, to stay under the API limit.
As a token bucket, it will continuously accrue tokens at the rate of 1000 tokens per minute until it caps out at 1000. All available tokens can be used in quick succession.
2. Token Bucket Rate Limiting for Token Usage

tokenUsage: { kind: "token bucket", period: MINUTE, rate: 1_000 }
globalTokenUsage: { kind: "token bucket", period: MINUTE, rate: 100_000 },

Allows 1000 tokens per minute per user (a userId is provided as the key), and 100k tokens per minute globally.
Provides burst capacity while controlling overall usage. If it hasn't been used in a while, you can consume all tokens at once. However, you'd then need need to wait for tokens to gradually accrue before making more requests.
Having a per-user limit is useful to prevent single users from hogging all of the token bandwidth you have available with your LLM provider, while a global limit helps stay under the API limit without throwing an error midway through a potentially long multi-step request.
How It Works

Step 1: Pre-flight Rate Limit Checks

Before processing a question, the system:

Checks if the user can send another message (frequency limit)
Estimates token usage for the question
Verifies the user has sufficient token allowance
Throws an error if either limit would be exceeded
If the rate limits aren't exceeded, the LLM request is made.
See rateLimiting.ts for the full implementation.

// In the mutation that would start generating a message.
await rateLimiter.limit(ctx, "sendMessage", { key: userId, throws: true });
// Also check global limit.
await rateLimiter.limit(ctx, "globalSendMessage", { throws: true });

// A heuristic based on the previous token usage in the thread + the question.
const count = await estimateTokens(ctx, args.threadId, args.question);
// Check token usage, but don't consume the tokens yet.
await rateLimiter.check(ctx, "tokenUsage", {
  key: userId,
  count: estimateTokens(args.question),
  throws: true,
});
// Also check global limit.
await rateLimiter.check(ctx, "globalTokenUsage", {
  count,
  reserve: true,
  throws: true,
});


If there is not enough allowance, the rate limiter will throw an error that the client can catch and prompt the user to wait a bit before trying again.

The difference between limit and check is that limit will consume the tokens immediately, while check will only check if the limit would be exceeded. We actually mark the tokens as used once the request is complete with the total usage.

Step 2: Post-generation Usage Tracking

While rate limiting message sending frequency is a good way to prevent many messages being sent in a short period of time, each message could generate a very long response or use a lot of context tokens. For this we also track token usage as its own rate limit.

After the AI generates a response, we mark the tokens as used using the total usage. We use reserve: true to allow a (temporary) negative balance, in case the generation used more tokens than estimated. A "reservation" here means allocating tokens beyond what is allowed. Typically this is done ahead of time, to "reserve" capacity for a big request that can be scheduled in advance. In this case, we're marking capacity that has already been consumed. This prevents future requests from starting until the "debt" is paid off.

When using the Agent component, we can do this in the "usageHandler", which is called after the AI generates a response.

import { Agent, type Config } from "@convex-dev/rate-limiter";

const sharedConfig = {
  usageHandler: async (ctx, { usage, userId }) => {
    if (!userId) {
      return;
    }
    // We consume the token usage here, once we know the full usage.
    // This is too late for the first generation, but prevents further requests
    // until we've paid off that debt.
    await rateLimiter.limit(ctx, "tokenUsage", {
      key: userId,
      // You could weight different kinds of tokens differently here.
      count: usage.totalTokens,
      // Reserving the tokens means it won't fail here, but will allow it
      // to go negative, disallowing further requests at the `check` call below.
      reserve: true,
    });
  },
} satisfies Config;

// use it in your agent definitions
const agent = new Agent(components.agent, {
  name,
  languageModel,
  ...sharedConfig,
});


The "trick" here is that, while a user can make a request that exceeds the limit for a single request, they then have to wait longer to accrue the tokens for another request. So averaged over time they can't consume more than the rate limit.

This balances pragmatism of trying to prevent requests ahead of time with an estimate, while also rate limiting the actual usage.

Client-side Handling

See RateLimiting.tsx for the client-side code.

While the client isn't the final authority on whether a request should be allowed, it can still show a waiting message while the rate limit is being checked, and an error message when the rate limit is exceeded. This prevents the user from making attempts that are likely to fail.

It makes use of the useRateLimit hook to check the rate limits. See the full Rate Limiting docs here.

import { useRateLimit } from "@convex-dev/rate-limiter/react";
//...
const { status } = useRateLimit(api.example.getRateLimit);

In convex/example.ts we expose getRateLimit:

export const { getRateLimit, getServerTime } = rateLimiter.hookAPI<DataModel>(
  "sendMessage",
  { key: (ctx) => getAuthUserId(ctx) },
);


Showing a waiting message while the rate limit is being checked:

{status && !status.ok && (
    <div className="text-xs text-gray-500 text-center">
    <p>Message sending rate limit exceeded.</p>
    <p>
        Try again after <Countdown ts={status.retryAt} />
    </p>
    </div>
)}

Showing an error message when the rate limit is exceeded:

import { isRateLimitError } from "@convex-dev/rate-limiter";

// in a button handler
await submitQuestion({ question, threadId }).catch((e) => {
  if (isRateLimitError(e)) {
    toast({
      title: "Rate limit exceeded",
      description: `Rate limit exceeded for ${e.data.name}.
          Try again after ${getRelativeTime(Date.now() + e.data.retryAfter)}`,
    });
  }
});


Token Estimation

The example includes a simple token estimation function:

import { QueryCtx } from "./_generated/server";
import { fetchContextMessages } from "@convex-dev/agent";
import { components } from "./_generated/api";

// This is a rough estimate of the tokens that will be used.
// It's not perfect, but it's a good enough estimate for a pre-generation check.
export async function estimateTokens(
  ctx: QueryCtx,
  threadId: string | undefined,
  question: string,
) {
  // Assume roughly 4 characters per token
  const promptTokens = question.length / 4;
  // Assume a longer non-zero reply
  const estimatedOutputTokens = promptTokens * 3 + 1;
  const latestMessages = await fetchContextMessages(ctx, components.agent, {
    threadId,
    searchText: question,
    contextOptions: { recentMessages: 2 },
  });
  // Our new usage will roughly be the previous tokens + the question.
  // The previous tokens include the tokens for the full message history and
  // output tokens, which will be part of our new history.
  const lastUsageMessage = latestMessages
    .reverse()
    .find((message) => message.usage);
  const lastPromptTokens = lastUsageMessage?.usage?.totalTokens ?? 1;
  return lastPromptTokens + promptTokens + estimatedOutputTokens;
}

Usage Tracking

You can provide a usageHandler to the agent to track token usage. See an example in this demo that captures usage to a table, then scans it to generate per-user invoices.

You can provide a usageHandler to the agent, per-thread, or per-message.

const supportAgent = new Agent(components.agent, {
  ...
  usageHandler: async (ctx, args) => {
    const {
      // Who used the tokens
      userId, threadId, agentName,
      // What LLM was used
      model, provider,
      // How many tokens were used (extra info is available in providerMetadata)
      usage, providerMetadata
    } = args;
    // ... log, save usage to your database, etc.
  },
});


Tip: Define the usageHandler within a function where you have more variables available to attribute the usage to a different user, team, project, etc.

Storing usage in a table

To track usage for e.g. billing, you can define a table in your schema and insert usage into it for later processing.

export const usageHandler: UsageHandler = async (ctx, args) => {
  if (!args.userId) {
    console.debug("Not tracking usage for anonymous user");
    return;
  }
  await ctx.runMutation(internal.example.insertRawUsage, {
    userId: args.userId,
    agentName: args.agentName,
    model: args.model,
    provider: args.provider,
    usage: args.usage,
    providerMetadata: args.providerMetadata,
  });
};

export const insertRawUsage = internalMutation({
  args: {
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),
    usage: vUsage,
    providerMetadata: v.optional(vProviderMetadata),
  },
  handler: async (ctx, args) => {
    const billingPeriod = getBillingPeriod(Date.now());
    return await ctx.db.insert("rawUsage", {
      ...args,
      billingPeriod,
    });
  },
});

function getBillingPeriod(at: number) {
  const now = new Date(at);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth());
  return startOfMonth.toISOString().split("T")[0];
}

With an associated schema in convex/schema.ts:

export const schema = defineSchema({
  rawUsage: defineTable({
    userId: v.string(),
    agentName: v.optional(v.string()),
    model: v.string(),
    provider: v.string(),

    // stats
    usage: vUsage,
    providerMetadata: v.optional(vProviderMetadata),

    // In this case, we're setting it to the first day of the current month,
    // using UTC time for the month boundaries.
    // You could alternatively store it as a timestamp number.
    // You can then fetch all the usage at the end of the billing period
    // and calculate the total cost.
    billingPeriod: v.string(), // When the usage period ended
  }).index("billingPeriod_userId", ["billingPeriod", "userId"]),

  invoices: defineTable({
    userId: v.string(),
    billingPeriod: v.string(),
    amount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("failed"),
    ),
  }).index("billingPeriod_userId", ["billingPeriod", "userId"]),
  // ... other tables
});


Generating invoices via a cron job

You can use a cron job to generate invoices at the end of the billing period.

See usage_tracking/invoicing.ts for an example of how to generate invoices.

You can then add it to convex/crons.ts:

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Generate invoices for the previous month
crons.monthly(
  "generateInvoices",
  // Wait a day after the new month starts to generate invoices
  { day: 2, hourUTC: 0, minuteUTC: 0 },
  internal.usage.generateInvoices,
  {},
);

export default crons;
