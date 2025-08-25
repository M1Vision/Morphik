import Chat from "@/components/chat"

export default function Page() {
  // Authentication is handled by AuthGuard in layout
  // This page only renders when user is authenticated
  return <Chat />
}
