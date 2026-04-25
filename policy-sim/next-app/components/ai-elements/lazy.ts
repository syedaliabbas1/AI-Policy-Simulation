/**
 * Lazy-loaded barrel export for all ai-elements components.
 *
 * Usage: import { Agent, Artifact } from "@/components/ai-elements/lazy"
 *
 * Each component is code-split via next/dynamic with ssr: false, so:
 * - Components not yet imported by any page stay out of the initial bundle
 * - First use of a component loads only that component's chunk
 *
 * The original direct imports (e.g. "@/components/ai-elements/agent")
 * remain available if needed, but prefer importing from here for
 * automatic code-splitting.
 *
 * Note: components already in use (conversation, reasoning) keep their
 * direct imports — this barrel is for future-use planned components.
 */

import dynamic from "next/dynamic"

// ─── Lazy Exports ───────────────────────────────────────────────────────────────
// Uses .then() to extract named exports from the module namespace.

export const Agent = dynamic(() => import("./agent").then((m) => m.Agent), { ssr: false })
export const Artifact = dynamic(() => import("./artifact").then((m) => m.Artifact), { ssr: false })
export const Attachments = dynamic(() => import("./attachments").then((m) => m.Attachments), { ssr: false })
export const AudioPlayer = dynamic(() => import("./audio-player").then((m) => m.AudioPlayer), { ssr: false })
export const Canvas = dynamic(() => import("./canvas").then((m) => m.Canvas), { ssr: false })
export const ChainOfThought = dynamic(() => import("./chain-of-thought").then((m) => m.ChainOfThought), { ssr: false })
export const Checkpoint = dynamic(() => import("./checkpoint").then((m) => m.Checkpoint), { ssr: false })
export const CodeBlock = dynamic(() => import("./code-block").then((m) => m.CodeBlock), { ssr: false })
export const Commit = dynamic(() => import("./commit").then((m) => m.Commit), { ssr: false })
export const Confirmation = dynamic(() => import("./confirmation").then((m) => m.Confirmation), { ssr: false })
export const Connection = dynamic(() => import("./connection").then((m) => m.Connection), { ssr: false })
export const Context = dynamic(() => import("./context").then((m) => m.Context), { ssr: false })
export const Controls = dynamic(() => import("./controls").then((m) => m.Controls), { ssr: false })
export const Conversation = dynamic(() => import("./conversation").then((m) => m.Conversation), { ssr: false })
export const ConversationContent = dynamic(() => import("./conversation").then((m) => m.ConversationContent), { ssr: false })
export const ConversationEmptyState = dynamic(() => import("./conversation").then((m) => m.ConversationEmptyState), { ssr: false })
export const ConversationScrollButton = dynamic(() => import("./conversation").then((m) => m.ConversationScrollButton), { ssr: false })
export const ConversationDownload = dynamic(() => import("./conversation").then((m) => m.ConversationDownload), { ssr: false })
export const EdgeAnimated = dynamic(() => import("./edge").then((m) => m.Edge.Animated), { ssr: false })
export const EdgeTemporary = dynamic(() => import("./edge").then((m) => m.Edge.Temporary), { ssr: false })
export const EnvironmentVariables = dynamic(() => import("./environment-variables").then((m) => m.EnvironmentVariables), { ssr: false })
export const FileTree = dynamic(() => import("./file-tree").then((m) => m.FileTree), { ssr: false })
export const Image = dynamic(() => import("./image").then((m) => m.Image), { ssr: false })
export const InlineCitation = dynamic(() => import("./inline-citation").then((m) => m.InlineCitation), { ssr: false })
export const JSXPreview = dynamic(() => import("./jsx-preview").then((m) => m.JSXPreview), { ssr: false })
export const JSXPreviewContent = dynamic(() => import("./jsx-preview").then((m) => m.JSXPreviewContent), { ssr: false })
export const JSXPreviewError = dynamic(() => import("./jsx-preview").then((m) => m.JSXPreviewError), { ssr: false })
export const Message = dynamic(() => import("./message").then((m) => m.Message), { ssr: false })
export const MicSelector = dynamic(() => import("./mic-selector").then((m) => m.MicSelector), { ssr: false })
export const ModelSelector = dynamic(() => import("./model-selector").then((m) => m.ModelSelector), { ssr: false })
export const Node = dynamic(() => import("./node").then((m) => m.Node), { ssr: false })
export const OpenIn = dynamic(() => import("./open-in-chat").then((m) => m.OpenIn), { ssr: false })
export const OpenInChatGPT = dynamic(() => import("./open-in-chat").then((m) => m.OpenInChatGPT), { ssr: false })
export const OpenInClaude = dynamic(() => import("./open-in-chat").then((m) => m.OpenInClaude), { ssr: false })
export const PackageInfo = dynamic(() => import("./package-info").then((m) => m.PackageInfo), { ssr: false })
export const Panel = dynamic(() => import("./panel").then((m) => m.Panel), { ssr: false })
export const Persona = dynamic(() => import("./persona").then((m) => m.Persona), { ssr: false })
export const Plan = dynamic(() => import("./plan").then((m) => m.Plan), { ssr: false })
export const PromptInput = dynamic(() => import("./prompt-input").then((m) => m.PromptInput), { ssr: false })
export const Queue = dynamic(() => import("./queue").then((m) => m.Queue), { ssr: false })
export const Reasoning = dynamic(() => import("./reasoning").then((m) => m.Reasoning), { ssr: false })
export const ReasoningTrigger = dynamic(() => import("./reasoning").then((m) => m.ReasoningTrigger), { ssr: false })
export const ReasoningContent = dynamic(() => import("./reasoning").then((m) => m.ReasoningContent), { ssr: false })
export const Sandbox = dynamic(() => import("./sandbox").then((m) => m.Sandbox), { ssr: false })
export const SchemaDisplay = dynamic(() => import("./schema-display").then((m) => m.SchemaDisplay), { ssr: false })
export const Shimmer = dynamic(() => import("./shimmer").then((m) => m.Shimmer), { ssr: false })
export const Snippet = dynamic(() => import("./snippet").then((m) => m.Snippet), { ssr: false })
export const Sources = dynamic(() => import("./sources").then((m) => m.Sources), { ssr: false })
export const SpeechInput = dynamic(() => import("./speech-input").then((m) => m.SpeechInput), { ssr: false })
export const StackTrace = dynamic(() => import("./stack-trace").then((m) => m.StackTrace), { ssr: false })
export const Suggestion = dynamic(() => import("./suggestion").then((m) => m.Suggestion), { ssr: false })
export const Task = dynamic(() => import("./task").then((m) => m.Task), { ssr: false })
export const Terminal = dynamic(() => import("./terminal").then((m) => m.Terminal), { ssr: false })
export const TestResults = dynamic(() => import("./test-results").then((m) => m.TestResults), { ssr: false })
export const Tool = dynamic(() => import("./tool").then((m) => m.Tool), { ssr: false })
export const Toolbar = dynamic(() => import("./toolbar").then((m) => m.Toolbar), { ssr: false })
export const Transcription = dynamic(() => import("./transcription").then((m) => m.Transcription), { ssr: false })
export const VoiceSelector = dynamic(() => import("./voice-selector").then((m) => m.VoiceSelector), { ssr: false })
export const WebPreview = dynamic(() => import("./web-preview").then((m) => m.WebPreview), { ssr: false })
