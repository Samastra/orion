import { redirect } from 'next/navigation';

export default function StudyModeRedirect() {
  // Use a random ID or just redirect to a new session
  const randomId = Math.random().toString(36).substring(7);
  redirect(`/study/session-${randomId}`);
}
