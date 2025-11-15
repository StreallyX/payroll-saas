import { redirect } from 'next/navigation';

export default function HomePage() {
  // Root page redirects to login - middleware will handle authenticated users
  redirect('/auth/login');
}
