import { MainLayout } from '@/components/Layout/MainLayout'
import { AiAuthRequired } from '@/components/ai-auth-required'
import { AiCompanionHomeClient } from '@/components/ai-companion-home'
import { aiCharacterTemplates, getAiCurrentUser } from '@/lib/ai-companion'

export default async function AiCompanionPage() {
  let current = null

  try {
    current = await getAiCurrentUser()
  } catch {
    current = null
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl py-8">
        {current ? <AiCompanionHomeClient templates={aiCharacterTemplates} /> : <AiAuthRequired />}
      </div>
    </MainLayout>
  )
}
