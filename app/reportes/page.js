'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Reportes() {
  const [user, setUser] = useState(null)
  const [taxis, setTaxis] = useState([])
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [totalDinero, setTotalDinero] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        fetchData(user.id)
      }
    }
    getUser()
  }, [])

  const fetchData = async (userId) => {
    setLoading(true)
    
    try {
      // Obtener taxis del usuario
      const { data: taxisData } = await supabase
        .from('taxis')
        .select('*')
        .eq('user_id', userId)

      setTaxis(taxisData || [])

      // Obtener total de registros y dinero
      if (taxisData && taxisData.length > 0) {
        const taxiIds = taxisData.map(t => t.id)
        
        const { data: registrosData } = await supabase
          .from('registros')
          .select('cantidad')
          .in('taxi_id', taxiIds)

        if (registrosData) {
          setTotalRegistros(registrosData.length)
          const total = registrosData.reduce((sum, r) => sum + parseFloat(r.cantidad || 0), 0)
          setTotalDinero(total)
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
    
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📊</span>
                Reportes y Estadísticas
              </h1>
              <p className="text-gray-700 mt-1">
                {user?.email} • Análisis completo de tus operaciones
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md">
                  ← Dashboard
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

        {/* ESTADÍSTICAS GENERALES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total de Taxis</p>
                <p className="text-4xl font-bold mt-2">{taxis.length}</p>
              </div>
              <div className="text-3xl">🚖</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Registros Totales</p>
                <p className="text-4xl font-bold mt-2">{totalRegistros}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Dinero Total</p>
                <p className="text-4xl font-bold mt-2">
                  ${totalDinero.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Promedio por Día</p>
                <p className="text-3xl font-bold mt-2">
                  ${totalRegistros > 0 ? (totalDinero / totalRegistros).toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
        </div>

        {/* TIPOS DE REPORTES */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* REPORTE MENSUAL */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl text-blue-600">📅</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reporte Mensual</h2>
                <p className="text-gray-600">Ingresos organizados por mes</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Visualiza tus ingresos organizados por meses. Ideal para control mensual y declaraciones fiscales.
              </p>
              <ul className="text-gray-600 text-sm space-y-2 ml-5 list-disc">
                <li>Totales por cada mes</li>
                <li>Comparativa mensual</li>
                <li>Días trabajados por mes</li>
                <li>Promedio diario mensual</li>
              </ul>
            </div>

            <Link href="/reportes/mensual">
              <button className="w-full mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl font-bold transition shadow-md">
                <span className="flex items-center justify-center">
                  <span className="mr-2">📅</span>
                  Ver Reporte Mensual
                </span>
              </button>
            </Link>
          </div>

          {/* REPORTE POR TAXI */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl text-green-600">🚕</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reporte por Taxi</h2>
                <p className="text-gray-600">Rendimiento individual de cada taxi</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Analiza el rendimiento de cada taxi por separado. Identifica cuáles son más rentables.
              </p>
              <ul className="text-gray-600 text-sm space-y-2 ml-5 list-disc">
                <li>Historial completo por taxi</li>
                <li>Comparativa entre taxis</li>
                <li>Rentabilidad individual</li>
                <li>Estadísticas detalladas</li>
              </ul>
            </div>

            <Link href="/reportes/taxi">
              <button className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-xl font-bold transition shadow-md">
                <span className="flex items-center justify-center">
                  <span className="mr-2">🚖</span>
                  Ver Reporte por Taxi
                </span>
              </button>
            </Link>
          </div>

          {/* REPORTE GENERAL */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl text-purple-600">📊</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reporte General</h2>
                <p className="text-gray-600">Vista completa de todas las operaciones</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                Todos tus registros en una sola vista. Filtra, ordena y exporta tus datos fácilmente.
              </p>
              <ul className="text-gray-600 text-sm space-y-2 ml-5 list-disc">
                <li>Todos los registros históricos</li>
                <li>Filtros avanzados por fecha</li>
                <li>Ordenar por cualquier campo</li>
                <li>Exportar a Excel/PDF</li>
              </ul>
            </div>

            <Link href="/reportes/general">
              <button className="w-full mt-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 rounded-xl font-bold transition shadow-md">
                <span className="flex items-center justify-center">
                  <span className="mr-2">📋</span>
                  Ver Reporte General
                </span>
              </button>
            </Link>
          </div>
        </div>

        {/* CONSEJOS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-100 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-800 mb-3 flex items-center">
              <span className="mr-2">💡</span>
              ¿Para qué sirven estos reportes?
            </h3>
            <ul className="text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Control preciso de ingresos mensuales</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Análisis de rentabilidad por taxi</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Base para declaraciones de impuestos</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Toma de decisiones informadas</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6">
            <h3 className="font-bold text-green-800 mb-3 flex items-center">
              <span className="mr-2">🎯</span>
              Recomendaciones
            </h3>
            <ul className="text-green-700 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Revisa los reportes mensualmente</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Compara el rendimiento entre taxis</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Exporta los datos para tu contador</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Identifica tendencias y oportunidades</span>
              </li>
            </ul>
          </div>
        </div>

        {/* LISTA DE TAXIS */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-2">🚖</span>
            Tus Taxis ({taxis.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando taxis...</p>
            </div>
          ) : taxis.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500">No tienes taxis registrados</p>
              <Link href="/agregar-taxi">
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Agregar primer taxi
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {taxis.map((taxi) => (
                <div key={taxi.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-lg">🚖</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{taxi.nombre}</h3>
                      <p className="text-sm text-gray-600">{taxi.conductor}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                    <Link href={`/reportes/taxi?id=${taxi.id}`}>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Ver reporte →
                      </button>
                    </Link>
                    <span className="text-xs text-gray-500">
                      ID: {taxi.id.substring(0, 6)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-10 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
          <p>📊 Sistema de Reportes • Taxis App • {new Date().getFullYear()}</p>
          <p className="mt-1">Todos los derechos reservados • Desarrollado por Cristian David Torres Marulanda</p>
        </footer>
      </div>
    </div>
  )
}
