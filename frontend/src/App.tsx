import { Route, Routes } from 'react-router'

function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center">
      <h1 className="text-3xl text-center font-bold">Tennis Xpress</h1>
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center">
      <h1 className="text-3xl text-center font-bold">Page not found</h1>
    </main>
  )
}

/** Renders the application's top-level routes. */
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
