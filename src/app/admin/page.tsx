import { redirect } from 'next/navigation'

// Admin root — redirect straight to the applications queue
export default function AdminPage() {
  redirect('/admin/creators')
}
