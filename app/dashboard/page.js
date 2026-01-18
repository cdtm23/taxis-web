'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [taxis, setTaxis] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        fetchTaxis(user.id)
      }
    }
    getUser()
  }, [])

  const fetchTaxis = async (userId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('taxis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error al cargar taxis:', error)
      alert('Error al cargar taxis: ' + error.message)
    } else {
      setTaxis(data || [])
    }
    setLoading(false)
  }

  const handleDeleteTaxi = async (taxiId, taxiNombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el taxi "${taxiNombre}"?\n\n⚠️ Se eliminarán TODOS sus registros de cobros.`)) {
      return
    }

    try {
      // Primero eliminar registros relacionados
      const { error: registrosError } = await supabase
        .from('registros')
        .delete()
        .eq('taxi_id', taxiId)

      if (registrosError) {
        console.error('Error al eliminar registros:', registrosError)
      }

      // Luego eliminar el taxi
      const { error: taxiError } = await supabase
        .from('taxis')
        .delete()
        .eq('id', taxiId)

      if (taxiError) {
        alert('❌ Error al eliminar taxi: ' + taxiError.message)
      } else {
        // Actualizar la lista
        const { data: { user } } = await supabase.auth.getUser()
        fetchTaxis(user.id)
        alert(`✅ Taxi "${taxiNombre}" eliminado correctamente`)
      }
    } catch (err) {
      console.error('Error inesperado:', err)
      alert('❌ Error inesperado al eliminar')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">🚕 Gestión de Taxis</h1>
              <p className="text-gray-700 mt-1">
                {user?.email} • {taxis.length} {taxis.length === 1 ? 'taxi' : 'taxis'} registrado{taxis.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/agregar-taxi">
                <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md">
                  ＋ Agregar Taxi
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUMNA IZQUIERDA - MIS TAXIS */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Mis Taxis</h2>
                  <p className="text-gray-700 mt-1">Gestiona tu flota de taxis</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-blue-600">{taxis.length}</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
                  <p className="mt-6 text-gray-700 text-lg">Cargando taxis...</p>
                </div>
              ) : taxis.length === 0 ? (
                <div className="text-center py-12 border-3 border-dashed border-gray-300 rounded-2xl bg-gray-50">
                  <div className="text-6xl mb-4">🚕</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No tienes taxis registrados</h3>
                  <p className="text-gray-600 mb-6">Comienza agregando tu primer taxi</p>
                  <Link href="/agregar-taxi">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-lg shadow-lg">
                      Agregar mi primer taxi
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {taxis.map((taxi) => (
                    <div key={taxi.id} className="border-2 border-gray-200 rounded-2xl p-5 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                              <span className="text-xl">🚖</span>
                            </div>
                            <div>
                              <h3 className="font-bold text-xl text-gray-900">{taxi.nombre}</h3>
                              <p className="text-gray-700 flex items-center gap-1">
                                <span>👤</span>
                                {taxi.conductor}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                              ID: {taxi.id.substring(0, 8)}...
                            </span>
                            <span className="inline-block ml-2 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                              Creado: {new Date(taxi.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
<div className="flex gap-3 pt-4 border-t border-gray-100">
  <Link href={`/registro?taxi=${taxi.id}`} className="flex-1">
    <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2">
      <span>💰</span>
      Registrar Cobro
    </button>
  </Link>
  
  <div className="flex gap-2">
    <Link href={`/editar-taxi/${taxi.id}`}>
      <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center gap-1">
        <span>✏️</span>
        Editar
      </button>
    </Link>
    
    <button 
      onClick={() => handleDeleteTaxi(taxi.id, taxi.nombre)}
      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center gap-1"
    >
      <span>🗑️</span>
      Eliminar
    </button>
  </div>
</div>                      
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RESUMEN RÁPIDO */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 mt-8 text-white">
              <h2 className="text-2xl font-bold mb-6">📊 Resumen del Mes</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                  <p className="text-sm opacity-90">Total del Mes</p>
                  <p className="text-3xl font-bold mt-2">$0.00</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                  <p className="text-sm opacity-90">Días Trabajados</p>
                  <p className="text-3xl font-bold mt-2">0</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                  <p className="text-sm opacity-90">Promedio Diario</p>
                  <p className="text-3xl font-bold mt-2">$0.00</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                  <p className="text-sm opacity-90">Taxi Más Activo</p>
                  <p className="text-xl font-bold mt-2">-</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA - ACCIONES RÁPIDAS */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">⚡ Acciones Rápidas</h2>
              <div className="space-y-4">
                <Link href="/registro">
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white p-4 rounded-xl font-semibold text-left flex items-center gap-4 shadow-md transition-all">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">💰</span>
                    </div>
                    <div>
                      <p className="text-lg">Registrar Cobro Diario</p>
                      <p className="text-sm opacity-90">Agrega ingresos de hoy</p>
                    </div>
                  </button>
                </Link>
                
                <Link href="/reportes">
                  <button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white p-4 rounded-xl font-semibold text-left flex items-center gap-4 shadow-md transition-all">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📊</span>
                    </div>
                    <div>
                      <p className="text-lg">Ver Reportes Completos</p>
                      <p className="text-sm opacity-90">Estadísticas detalladas</p>
                    </div>
                  </button>
                </Link>
                
                <button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 rounded-xl font-semibold text-left flex items-center gap-4 shadow-md transition-all">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📤</span>
                  </div>
                  <div>
                    <p className="text-lg">Exportar Datos</p>
                    <p className="text-sm opacity-90">Excel o PDF</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 text-white">
              <h2 className="text-xl font-bold mb-6">📈 Estadísticas</h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white/10 rounded-xl">
                  <div>
                    <p className="text-sm opacity-80">Total de Taxis</p>
                    <p className="text-4xl font-bold mt-2">{taxis.length}</p>
                  </div>
                  <div className="text-4xl">🚖</div>
                </div>
                
                <div className="p-4 bg-white/10 rounded-xl">
                  <p className="text-sm opacity-80">Último Acceso</p>
                  <p className="text-lg font-semibold mt-2">Hace unos momentos</p>
                  <p className="text-sm opacity-70 mt-1">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-start gap-4">
                <div className="text-3xl">💡</div>
                <div>
                  <h3 className="font-bold text-lg mb-2">Consejo del Día</h3>
                  <p className="opacity-90">
                    Registra los cobros inmediatamente después de cada jornada para mantener la contabilidad precisa y actualizada.
                  </p>
                </div>
              </div>
            </div>
            
            {/* SECCIÓN "PRÓXIMOS PASOS" ELIMINADA */}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-10 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
          <p>🚕 Taxis App • Sistema de gestión de liquidaciones • {new Date().getFullYear()}</p>
          <p className="mt-1">v1.0 • Desarrollado por Cristian David Torres Marulanda</p>
        </footer>
      </div>
    </div>
  )
}
