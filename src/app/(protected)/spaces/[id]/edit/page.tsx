import { notFound } from 'next/navigation'
import { getSpaceAction } from '@/lib/actions/space'
import { SpaceForm } from '@/components/spaces/forms/space-form'

interface EditSpacePageProps {
  params: {
    id: string
  }
}

export default async function EditSpacePage({ params }: EditSpacePageProps) {
  const result = await getSpaceAction({ id: params.id })

  if (!result.success || !result.data) {
    notFound()
  }

  const space = result.data

  return <SpaceForm space={space} isEdit={true} />
}