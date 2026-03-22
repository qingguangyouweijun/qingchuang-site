import { MainLayout } from '@/components/Layout/MainLayout'
import { AiAuthRequired } from '@/components/ai-auth-required'
import { AiChatClient } from '@/components/ai-chat'
import { getAiCurrentUser } from '@/lib/ai-companion'

export default async function AiConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const current = await getAiCurrentUser()
  const { id } = await params

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8">
        {current ? <AiChatClient conversationId={id} /> : <AiAuthRequired />}
      </div>
    </MainLayout>
  )
}
