'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReporteMensual() {
  const [user, setUser] = useState(null)
  const [taxis, setTaxis] = useState([])
  const [reportesMensuales, setReportesMensuales] = useState([])
  const [mesSeleccionado, setMesSeleccionado] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  )
  const [loading, setLoading] = useState(true)
  const [totalMes, setTotalMes] = useState(0)
  const [diasTrabajados, setDiasTrabajados] = useState(0)
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

  useEffect(() => {
    if (taxis.length > 0 && mesSeleccionado) {
      fetchReporteMensual()
    }
  }, [taxis, mesSeleccionado])

  const fetchTaxis = async (userId) => {
    const { data } = await supabase
      .from('taxis')
      .select('*')
      .eq('user_id', userId)
    
    setTaxis(data || [])
  }

  const fetchReporteMensual = async () => {
    setLoading(true)
    
    const [anio, mes] = mesSeleccionado.split('-')
    const fechaInicio = `${anio}-${mes}-01`
    const fechaFin = new Date(anio, mes, 0).toISOString().split('T')[0] // Último día del mes
    
    const taxiIds = taxis.map(t => t.id)
    
    // Obtener registros del mes
    const { data: registros } = await supabase
      .from('registros')
      .select('*')
      .in('taxi_id', taxiIds)
      .gte('fecha', fechaInicio)
      .lte('fecha', fechaFin)
      .order('fecha', { ascending: true })

    // Procesar datos por taxi
    const reportePorTaxi = taxis.map(taxi => {
      const registrosTaxi = registros?.filter(r => r.taxi_id === taxi.id) || []
      const totalTaxi = registrosTaxi.reduce((sum, r) => sum + parseFloat(r.cantidad || 0), 0)
      
      return {
        taxi,
        registros: registrosTaxi,
        total: totalTaxi,
        cantidadDias: new Set(registrosTaxi.map(r => r.fecha)).size
      }
    })

    // Calcular totales
    const total = reportePorTaxi.reduce((sum, item) => sum + item.total, 0)
    const todosRegistros = registros || []
    const diasUnicos = new Set(todosRegistros.map(r => r.fecha)).size

    setReportesMensuales(reportePorTaxi)
    setTotalMes(total)
    setDiasTrabajados(diasUnicos)
    setLoading(false)
  }

  const generarMeses = () => {
    const meses = []
    const hoy = new Date()
    
    // Últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const valor = fecha.toISOString().slice(0, 7)
      const nombre = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      meses.push({ valor, nombre })
    }
    
    return meses
  }

  const mesesDisponibles = generarMeses()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📅</span>
                Reporte Mensual
              </h1>
              <p className="text-gray-700 mt-1">
                Análisis detallado de ingresos por mes
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/reportes">
                <button className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md">
                  ← Volver
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md">
                  Dashboard
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* SELECTOR DE MES */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Seleccionar Mes</h2>
              <p className="text-gray-600">Elige el mes que deseas analizar</p>
            </div>
            
            <div className="relative">
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="appearance-none bg-white border-2 border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 font-medium"
              >
                {mesesDisponibles.map((mes) => (
                  <option key={mes.valor} value={mes.valor}>
                    {mes.nombre.charAt(0).toUpperCase() + mes.nombre.slice(1)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                <span className="text-xl">📅</span>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMEN DEL MES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total del Mes</p>
                <p className="text-4xl font-bold mt-2">
                  ${totalMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Días Trabajados</p>
                <p className="text-4xl font-bold mt-2">{diasTrabajados}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Promedio Diario</p>
                <p className="text-3xl font-bold mt-2">
                  ${diasTrabajados > 0 ? (totalMes / diasTrabajados).toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}
                </p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Taxis Activos</p>
                <p className="text-4xl font-bold mt-2">
                  {reportesMensuales.filter(r => r.registros.length > 0).length}
                </p>
              </div>
              <div className="text-3xl">🚖</div>
            </div>
          </div>
        </div>

        {/* DETALLE POR TAXI */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-2">🚕</span>
            Desglose por Taxi
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              <p className="mt-6 text-gray-700 text-lg">Generando reporte...</p>
            </div>
          ) : reportesMensuales.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500 text-lg">No hay registros para este mes</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reportesMensuales
                .filter(r => r.registros.length > 0)
                .sort((a, b) => b.total - a.total)
                .map((reporte, index) => (
                  <div key={reporte.taxi.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                          <span className="text-xl">🚖</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-xl text-gray-900">{reporte.taxi.nombre}</h3>
                          <p className="text-gray-600">{reporte.taxi.conductor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">
                          ${reporte.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-gray-600">
                          {reporte.registros.length} registro{reporte.registros.length !== 1 ? 's' : ''} • {reporte.cantidadDias} día{reporte.cantidadDias !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* DETALLE DIARIO */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-700 mb-3">Detalle diario:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {reporte.registros.map((registro) => (
                          <div key={registro.id} className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(registro.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                            </p>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              ${parseFloat(registro.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                            </p>
                            {registro.notas && (
                              <p className="text-xs text-gray-500 mt-1 truncate" title={registro.notas}>
                                {registro.notas}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ESTADÍSTICAS DEL TAXI */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Promedio diario</p>
                          <p className="font-bold text-gray-900">
                            ${reporte.cantidadDias > 0 ? (reporte.total / reporte.cantidadDias).toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Días trabajados</p>
                          <p className="font-bold text-gray-900">{reporte.cantidadDias}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">Registros</p>
                          <p className="font-bold text-gray-900">{reporte.registros.length}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600">% del total</p>
                          <p className="font-bold text-gray-900">
                            {totalMes > 0 ? ((reporte.total / totalMes) * 100).toFixed(1) : '0'}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* RESUMEN */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-100 border border-blue-200 rounded-2xl p-6">
          <h3 className="font-bold text-blue-800 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Resumen del Mes {mesSeleccionado}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Estadísticas Generales</h4>
              <ul className="text-blue-700 space-y-2">
                <li className="flex justify-between">
                  <span>Total de taxis activos:</span>
                  <span className="font-bold">{reportesMensuales.filter(r => r.registros.length > 0).length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Días trabajados en el mes:</span>
                  <span className="font-bold">{diasTrabajados}</span>
                </li>
                <li className="flex justify-between">
                  <span>Total de registros:</span>
                  <span className="font-bold">{reportesMensuales.reduce((sum, r) => sum + r.registros.length, 0)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Promedio por día:</span>
                  <span className="font-bold">
                    ${diasTrabajados > 0 ? (totalMes / diasTrabajados).toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">Recomendaciones</h4>
              <ul className="text-blue-700 space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Compara con meses anteriores para identificar tendencias</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Revisa los taxis con menor rendimiento</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Considera optimizar los días de mayor ingreso</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Guarda este reporte para tu contabilidad</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-10 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
          <p>📅 Reporte Mensual • {mesesDisponibles.find(m => m.valor === mesSeleccionado)?.nombre} • Generado el {new Date().toLocaleDateString('es-ES')}</p>
        </footer>
      </div>
    </div>
  )
}
