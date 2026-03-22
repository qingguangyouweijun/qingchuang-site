import { MainLayout } from '@/components/Layout/MainLayout'
import { AiAuthRequired } from '@/components/ai-auth-required'
import { AiCompanionHomeClient } from '@/components/ai-companion-home'
import { aiCharacterTemplates, getAiCurrentUser } from '@/lib/ai-companion'

export default async function AiCompanionPage() {
  const current = await getAiCurrentUser()

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8">
        {current ? <AiCompanionHomeClient templates={aiCharacterTemplates} /> : <AiAuthRequired />}
      </div>
    </MainLayout>
  )
}
