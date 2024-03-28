'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import menu from '@/data/menu.json'

export default function Page() {



  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">Bienvenue sur mon site !</h1>
      <p className="text-gray-600 mb-8">
        C'est ma page d'accueil, vous pouvez naviguer vers d'autres pages en utilisant le menu de navigation ci-dessus.
      </p>
      <ul>
        {menu.map((item) => (
          <li key={item.id}>
            <Link href={item.path}>
              <p className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4">{item.name}</p>
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/blob">
        <p className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Aller à la page Blob
        </p>
      </Link>
    </div>
  )
}
