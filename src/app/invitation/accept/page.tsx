import { Metadata } from 'next'
import InvitationAcceptClient from './client'

export const metadata: Metadata = {
  title: 'Aceptar Invitación - SweetSpot Cowork',
  description: 'Acepta tu invitación y únete a nuestro coworking',
  robots: 'noindex, nofollow',
}

export default function InvitationAcceptPage() {
  return <InvitationAcceptClient />
}