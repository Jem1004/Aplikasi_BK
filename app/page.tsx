import { redirect } from 'next/navigation'

export default function LandingPage() {
  // Direct redirect to login page
  redirect('/login')
}