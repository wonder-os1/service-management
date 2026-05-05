export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-xl font-bold text-purple-600">Setup Wizard</h1>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-12">{children}</main>
    </div>
  )
}
