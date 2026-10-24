import { LoadingState } from '../../../components/feedback/LoadingState'

/** Displays the responsive full-screen placeholder while authentication initializes. */
export default function AuthLoadingScreen() {
  return (
    <main
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-page px-4 py-8 sm:px-6"
    >
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 sm:p-8">
        <LoadingState label="Restoring your session…" />
      </div>
    </main>
  )
}
