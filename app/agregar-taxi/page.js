'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AgregarTaxi() {
  const [nombre, setNombre] = useState('')
  const [conductor, setConductor] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('taxis')
      .insert([{ 
        nombre, 
        conductor, 
        user_id: user.id 
      }])

    if (error) {
      alert('Error al agregar taxi: ' + error.message)
    } else {
      alert('✅ Taxi agregado correctamente!')
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center">
            ← Volver al Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Agregar Nuevo Taxi</h2>
          <p className="text-gray-600 mb-6">Registra un taxi para comenzar a llevar su contabilidad</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-black mb-2 font-medium">Nombre del Taxi</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                placeholder="Ej: Taxi Rojo, Taxi 1, Mercedes Negro"
                required
              />
              <p className="text-sm text-black mt-1 font-medium">Un nombre identificativo para este taxi</p>
            </div>

            <div>
              <label className="block text-black mb-2 font-medium">Nombre del Conductor</label>
              <input
                type="text"
                value={conductor}
                onChange={(e) => setConductor(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
                placeholder="Ej: Juan Pérez, María González"
                required
              />
              <p className="text-sm text-black mt-1 font-medium">Nombre completo del conductor</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/dashboard" className="flex-1">
                <button
                  type="button"
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 p-3 rounded-lg font-medium"
                >
                  Cancelar
                </button>
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar Taxi'}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-bold text-blue-800 mb-2">💡 Consejo</h3>
          <p className="text-blue-700 text-sm">
            Puedes agregar todos los taxis que necesites. Cada taxi tendrá su propio historial de cobros.
          </p>
        </div>
      </div>
    </div>
  )
}
