'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function ReporteTaxi() {
  const [user, setUser] = useState(null)
  const [taxis, setTaxis] = useState([])
  const [taxiSeleccionado, setTaxiSeleccionado] = useState('')
  const [registrosTaxi, setRegistrosTaxi] = useState([])
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingRegistros, setLoadingRegistros] = useState(false)
  const [filtroMes, setFiltroMes] = useState('todos')
  const router = useRouter()
  const searchParams = useSearchParams()

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
    const taxiId = searchParams.get('id')
    if (taxiId) {
      setTaxiSeleccionado(taxiId)
    }
  }, [searchParams])

  useEffect(() => {
    if (taxiSeleccionado && taxis.length > 0) {
      fetchRegistrosTaxi()
    }
  }, [taxiSeleccionado, filtroMes])

  const fetchTaxis = async (userId) => {
    setLoading(true)
    const { data } = await supabase
      .from('taxis')
      .select('*')
      .eq('user_id', userId)
      .order('nombre', { ascending: true })
    
    setTaxis(data || [])
    
    // Si hay un taxi en la URL, seleccionarlo
    const taxiId = searchParams.get('id')
    if (taxiId && data?.some(t => t.id === taxiId)) {
      setTaxiSeleccionado(taxiId)
    } else if (data && data.length > 0) {
      setTaxiSeleccionado(data[0].id)
    }
    
    setLoading(false)
  }

  const fetchRegistrosTaxi = async () => {
    if (!taxiSeleccionado) return
    
    setLoadingRegistros(true)
    
    let query = supabase
      .from('registros')
      .select('*')
      .eq('taxi_id', taxiSeleccionado)
      .order('fecha', { ascending: false })

    // Aplicar filtro de mes si no es "todos"
    if (filtroMes !== 'todos') {
      const [anio, mes] = filtroMes.split('-')
      const fechaInicio = `${anio}-${mes}-01`
      const fechaFin = new Date(anio, parseInt(mes), 0).toISOString().split('T')[0]
      
      query = query
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin)
    }

    const { data: registros } = await query

    // Calcular estadísticas
    if (registros && registros.length > 0) {
      const total = registros.reduce((sum, r) => sum + parseFloat(r.cantidad || 0), 0)
      const promedio = total / registros.length
      
      // Encontrar mejor y peor día
      const mejorDia = registros.reduce((max, r) => 
        parseFloat(r.cantidad) > parseFloat(max.cantidad) ? r : max
      , registros[0])
      
      const peorDia = registros.reduce((min, r) => 
        parseFloat(r.cantidad) < parseFloat(min.cantidad) ? r : min
      , registros[0])

      // Días únicos trabajados
      const diasUnicos = new Set(registros.map(r => r.fecha)).size
      const promedioDiario = total / diasUnicos

      // Agrupar por mes para gráfico
      const porMes = registros.reduce((acc, registro) => {
        const mes = registro.fecha.slice(0, 7) // YYYY-MM
        if (!acc[mes]) {
          acc[mes] = { total: 0, cantidad: 0 }
        }
        acc[mes].total += parseFloat(registro.cantidad)
        acc[mes].cantidad += 1
        return acc
      }, {})

      const mesesOrdenados = Object.entries(porMes)
        .map(([mes, datos]) => ({
          mes,
          total: datos.total,
          cantidad: datos.cantidad,
          promedio: datos.total / datos.cantidad
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes))

      setEstadisticas({
        total,
        promedio,
        mejorDia,
        peorDia,
        totalRegistros: registros.length,
        diasTrabajados: diasUnicos,
        promedioDiario,
        porMes: mesesOrdenados
      })
    } else {
      setEstadisticas(null)
    }

    setRegistrosTaxi(registros || [])
    setLoadingRegistros(false)
  }

  const getTaxiActual = () => {
    return taxis.find(t => t.id === taxiSeleccionado)
  }

  const generarMesesDisponibles = () => {
    const meses = []
    const hoy = new Date()
    
    // Últimos 6 meses
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const valor = fecha.toISOString().slice(0, 7)
      const nombre = fecha.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      meses.push({ valor, nombre })
    }
    
    return [{ valor: 'todos', nombre: 'Todos los meses' }, ...meses]
  }

  const mesesFiltro = generarMesesDisponibles()

  const exportarCSV = () => {
    if (!registrosTaxi.length) return
    
    const taxi = getTaxiActual()
    const cabeceras = ['Fecha', 'Cantidad ($)', 'Notas']
    const filas = registrosTaxi.map(r => [
      r.fecha,
      parseFloat(r.cantidad).toFixed(2),
      r.notas || ''
    ])
    
    const csv = [
      `Reporte de ${taxi?.nombre || 'Taxi'}`,
      `Conductor: ${taxi?.conductor || 'N/A'}`,
      `Total: $${estadisticas?.total.toFixed(2) || '0.00'}`,
      '',
      cabeceras.join(','),
      ...filas.map(f => f.join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-taxi-${taxi?.nombre || 'taxi'}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">🚕</span>
                Reporte por Taxi
              </h1>
              <p className="text-gray-700 mt-1">
                Análisis detallado del rendimiento de cada taxi
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

        {/* SELECTOR DE TAXI Y FILTROS */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* SELECTOR DE TAXI */}
            <div>
              <label className="block text-gray-900 font-bold mb-3">
                <span className="flex items-center">
                  <span className="mr-2">🚖</span>
                  Seleccionar Taxi
                </span>
              </label>
              
              {loading ? (
                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-700">Cargando taxis...</span>
                </div>
              ) : taxis.length === 0 ? (
                <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <p className="text-gray-700 mb-3">No tienes taxis registrados</p>
                  <Link href="/agregar-taxi">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm">
                      ＋ Agregar Taxi
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taxis.map((taxi) => (
                    <div
                      key={taxi.id}
                      onClick={() => setTaxiSeleccionado(taxi.id)}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        taxiSeleccionado === taxi.id 
                          ? 'border-green-500 bg-green-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          taxiSeleccionado === taxi.id ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <span className="text-lg">🚖</span>
                        </div>
                        <div>
                          <h3 className={`font-bold ${
                            taxiSeleccionado === taxi.id ? 'text-green-700' : 'text-gray-900'
                          }`}>
                            {taxi.nombre}
                          </h3>
                          <p className={`text-sm ${
                            taxiSeleccionado === taxi.id ? 'text-green-600' : 'text-gray-700'
                          }`}>
                            {taxi.conductor}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FILTROS Y ACCIONES */}
            <div>
              <label className="block text-gray-900 font-bold mb-3">
                <span className="flex items-center">
                  <span className="mr-2">📅</span>
                  Filtrar por Mes
                </span>
              </label>
              
              <div className="relative mb-6">
                <select
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(e.target.value)}
                  className="w-full appearance-none bg-white border-2 border-gray-300 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-gray-900 font-medium"
                  disabled={!taxiSeleccionado}
                >
                  {mesesFiltro.map((mes) => (
                    <option key={mes.valor} value={mes.valor}>
                      {mes.nombre}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                  <span className="text-xl">📅</span>
                </div>
              </div>

              <button
                onClick={exportarCSV}
                disabled={!registrosTaxi.length || loadingRegistros}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-xl font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center">
                  <span className="mr-2">📤</span>
                  Exportar a Excel
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* INFORMACIÓN DEL TAXI SELECCIONADO */}
        {taxiSeleccionado && getTaxiActual() && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mr-6 shadow">
                  <span className="text-3xl">🚖</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{getTaxiActual().nombre}</h2>
                  <p className="text-gray-700 text-lg">Conductor: {getTaxiActual().conductor}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-block bg-green-200 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                      ID: {getTaxiActual().id.substring(0, 8)}...
                    </span>
                    <span className="inline-block bg-blue-200 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      Creado: {new Date(getTaxiActual().created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">Estado actual</p>
                <p className={`text-xl font-bold ${estadisticas ? 'text-green-600' : 'text-gray-500'}`}>
                  {estadisticas ? 'Activo con registros' : 'Sin registros aún'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ESTADÍSTICAS PRINCIPALES */}
        {taxiSeleccionado && estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Acumulado</p>
                  <p className="text-3xl font-bold mt-2">
                    ${estadisticas.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Promedio por Día</p>
                  <p className="text-3xl font-bold mt-2">
                    ${estadisticas.promedioDiario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Días Trabajados</p>
                  <p className="text-3xl font-bold mt-2">{estadisticas.diasTrabajados}</p>
                </div>
                <div className="text-3xl">📅</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Registros</p>
                  <p className="text-3xl font-bold mt-2">{estadisticas.totalRegistros}</p>
                </div>
                <div className="text-3xl">📋</div>
              </div>
            </div>
          </div>
        )}

        {/* MEJOR Y PEOR DÍA */}
        {taxiSeleccionado && estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-r from-emerald-50 to-green-100 border border-green-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl text-green-700">🏆</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Mejor Día</h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(estadisticas.mejorDia.fecha).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-green-600">
                  ${parseFloat(estadisticas.mejorDia.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
                {estadisticas.mejorDia.notas && (
                  <p className="text-gray-600 mt-2 text-sm italic">"{estadisticas.mejorDia.notas}"</p>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-rose-100 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center mr-4">
                  <span className="text-2xl text-red-700">📉</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Peor Día</h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(estadisticas.peorDia.fecha).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-red-600">
                  ${parseFloat(estadisticas.peorDia.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
                {estadisticas.peorDia.notas && (
                  <p className="text-gray-600 mt-2 text-sm italic">"{estadisticas.peorDia.notas}"</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* HISTORIAL DE REGISTROS */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">📋</span>
              Historial de Registros
              {taxiSeleccionado && (
                <span className="ml-3 text-sm font-normal text-gray-500">
                  ({registrosTaxi.length} registro{registrosTaxi.length !== 1 ? 's' : ''})
                </span>
              )}
            </h2>
            
            {taxiSeleccionado && (
              <div className="text-sm text-gray-600">
                Mostrando {filtroMes === 'todos' ? 'todos los meses' : mesesFiltro.find(m => m.valor === filtroMes)?.nombre}
              </div>
            )}
          </div>

          {loadingRegistros ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto"></div>
              <p className="mt-6 text-gray-700 text-lg">Cargando registros...</p>
            </div>
          ) : !taxiSeleccionado ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500 text-lg">Selecciona un taxi para ver su historial</p>
            </div>
          ) : registrosTaxi.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500 text-lg">No hay registros para este taxi</p>
              <Link href={`/registro?taxi=${taxiSeleccionado}`}>
                <button className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  ＋ Registrar primer cobro
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 font-bold text-gray-700">Fecha</th>
                    <th className="text-left p-4 font-bold text-gray-700">Cantidad</th>
                    <th className="text-left p-4 font-bold text-gray-700">Notas</th>
                    <th className="text-left p-4 font-bold text-gray-700">Día</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrosTaxi.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {new Date(registro.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-green-600 text-lg">
                          ${parseFloat(registro.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-700 max-w-xs truncate">
                          {registro.notas || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-600">
                          {new Date(registro.fecha).toLocaleDateString('es-ES', { weekday: 'long' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* EVOLUCIÓN POR MESES */}
        {taxiSeleccionado && estadisticas?.porMes && estadisticas.porMes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-2">📈</span>
              Evolución por Meses
            </h2>
            
            <div className="space-y-6">
              {estadisticas.porMes.map((mesData) => (
                <div key={mesData.mes} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-900">
                      {new Date(mesData.mes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {mesData.cantidad} día{mesData.cantidad !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Total del mes</p>
                      <p className="text-2xl font-bold text-green-600">
                        ${mesData.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Promedio por día</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${mesData.promedio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Días trabajados</p>
                      <p className="text-2xl font-bold text-purple-600">{mesData.cantidad}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="mt-10 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
          <p>🚕 Reporte por Taxi • {getTaxiActual()?.nombre || 'Selecciona un taxi'} • Generado el {new Date().toLocaleDateString('es-ES')}</p>
        </footer>
      </div>
    </div>
  )
}
