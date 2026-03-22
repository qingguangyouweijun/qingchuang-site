import { MainLayout } from '@/components/Layout/MainLayout'
import { AiAuthRequired } from '@/components/ai-auth-required'
import { AiCharacterDetailClient } from '@/components/ai-character-detail'
import { aiCharacterTemplates, getAiCurrentUser } from '@/lib/ai-companion'

export default async function AiCharacterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const current = await getAiCurrentUser()
  const { id } = await params

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-8">
        {current ? <AiCharacterDetailClient characterId={id} templates={aiCharacterTemplates} /> : <AiAuthRequired />}
      </div>
    </MainLayout>
  )
}
