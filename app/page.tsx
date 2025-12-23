import { redirect } from 'next/navigation';

export default function HomePage() {
 // Root page redirects to login - middleware will handle to thandhenticated users
 redirect('/to thandh/login');
}
