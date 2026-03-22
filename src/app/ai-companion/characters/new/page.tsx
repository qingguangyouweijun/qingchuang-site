import { MainLayout } from '@/components/Layout/MainLayout'
import { AiAuthRequired } from '@/components/ai-auth-required'
import { AiCharacterForm } from '@/components/ai-character-form'
import { aiCharacterTemplates, getAiCurrentUser } from '@/lib/ai-companion'

export default async function NewAiCharacterPage() {
  const current = await getAiCurrentUser()

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8">
        {current ? <AiCharacterForm mode="create" templates={aiCharacterTemplates} /> : <AiAuthRequired />}
      </div>
    </MainLayout>
  )
}
