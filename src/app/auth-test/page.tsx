'use client'

import { useSession, signIn, signOut } from "next-auth/react"

export default function AuthTestPage() {
  const { data: session, status } = useSession()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl mb-2">Session Status: {status}</h2>
        {session ? (
          <div>
            <p>Signed in as: {session.user?.email}</p>
            <pre className="bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
            <button 
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" 
              onClick={() => signOut()}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div>
            <p>Not signed in</p>
            <button 
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" 
              onClick={() => signIn('google')}
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <a href="/api/test" target="_blank" className="text-blue-500 hover:underline">
          Test Auth API Route
        </a>
      </div>
    </div>
  )
} 