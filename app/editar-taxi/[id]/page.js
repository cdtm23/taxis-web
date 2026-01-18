'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function EditarTaxi() {
  const [nombre, setNombre] = useState('')
  const [conductor, setConductor] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [taxi, setTaxi] = useState(null)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    const fetchTaxi = async () => {
      if (!params.id) {
        router.push('/dashboard')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Cargar el taxi específico
      const { data, error } = await supabase
        .from('taxis')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error al cargar taxi:', error)
        alert('❌ Error: No se pudo cargar el taxi')
        router.push('/dashboard')
      } else if (data) {
        setTaxi(data)
        setNombre(data.nombre)
        setConductor(data.conductor)
      }
      
      setLoading(false)
    }

    fetchTaxi()
  }, [params.id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!nombre.trim() || !conductor.trim()) {
      alert('❌ Por favor, completa todos los campos')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('taxis')
      .update({ 
        nombre: nombre.trim(),
        conductor: conductor.trim()
      })
      .eq('id', params.id)

    if (error) {
      console.error('Error al actualizar taxi:', error)
      alert('❌ Error al actualizar: ' + error.message)
    } else {
      alert('✅ ¡Taxi actualizado correctamente!')
      router.push('/dashboard')
    }
    
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-700 text-lg">Cargando información del taxi...</p>
        </div>
      </div>
    )
  }

  if (!taxi) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">❌ Taxi no encontrado</p>
          <Link href="/dashboard">
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Volver al Dashboard
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* HEADER */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center font-medium">
            ← Volver al Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <span className="mr-3">✏️</span>
            Editar Taxi
          </h2>
          <p className="text-gray-700 mb-6">Actualiza la información de este taxi</p>

          {/* INFO DEL TAXI */}
          <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow">
                <span className="text-2xl">🚖</span>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Editando taxi:</p>
                <p className="font-bold text-blue-900 text-lg">{taxi.nombre}</p>
                <p className="text-blue-700 text-sm">Conductor: {taxi.conductor}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-block bg-blue-200 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                ID: {taxi.id.substring(0, 10)}...
              </span>
              <span className="inline-block bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                Creado: {new Date(taxi.created_at).toLocaleDateString('es-ES')}
              </span>
            </div>
          </div>

          {/* FORMULARIO */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-900 font-bold mb-3">
                <span className="flex items-center">
                  <span className="mr-2">🏷️</span>
                  Nombre del Taxi
                </span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-lg font-medium"
                placeholder="Ej: Taxi Rojo, Taxi 1"
                required
              />
              <p className="text-sm text-gray-700 mt-2 ml-1">
                Nuevo nombre identificativo para este taxi
              </p>
            </div>

            <div>
              <label className="block text-gray-900 font-bold mb-3">
                <span className="flex items-center">
                  <span className="mr-2">👤</span>
                  Nombre del Conductor
                </span>
              </label>
              <input
                type="text"
                value={conductor}
                onChange={(e) => setConductor(e.target.value)}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-lg font-medium"
                placeholder="Ej: Juan Pérez, María González"
                required
              />
              <p className="text-sm text-gray-700 mt-2 ml-1">
                Nuevo nombre completo del conductor
              </p>
            </div>

            {/* RESULTADO */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-5">
              <h3 className="font-bold text-green-800 mb-3 flex items-center">
                <span className="mr-2">👁️</span>
                Vista Previa
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Nuevo nombre:</span>
                  <span className="font-bold text-gray-900 text-lg bg-white px-3 py-1 rounded-lg">
                    {nombre || "(sin cambios)"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Nuevo conductor:</span>
                  <span className="font-bold text-gray-900 text-lg bg-white px-3 py-1 rounded-lg">
                    {conductor || "(sin cambios)"}
                  </span>
                </div>
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex flex-col md:flex-row gap-4 pt-6">
              <Link href="/dashboard" className="md:flex-1">
                <button
                  type="button"
                  className="w-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 p-4 rounded-xl font-bold transition shadow-md"
                >
                  Cancelar
                </button>
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="md:flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-xl font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Guardando cambios...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">💾</span>
                    Guardar Cambios
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ADVERTENCIA */}
        <div className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-100 border border-yellow-300 rounded-xl p-5">
          <h3 className="font-bold text-yellow-800 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            Importante
          </h3>
          <ul className="text-yellow-700 text-sm space-y-1 ml-6 list-disc">
            <li>Los cambios se aplicarán inmediatamente</li>
            <li>Los registros de cobros anteriores mantendrán el nombre original</li>
            <li>Esta acción no se puede deshacer</li>
          </ul>
        </div>

        {/* INFO ADICIONAL */}
        <div className="mt-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white p-3 rounded-lg shadow">
              <p className="text-gray-600 font-medium">Fecha de creación</p>
              <p className="font-bold text-gray-900 text-lg">
                {new Date(taxi.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg shadow">
              <p className="text-gray-600 font-medium">Última actualización</p>
              <p className="font-bold text-gray-900 text-lg">
                {new Date().toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
