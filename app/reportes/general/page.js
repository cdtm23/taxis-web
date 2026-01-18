'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReporteGeneral() {
  const [user, setUser] = useState(null)
  const [taxis, setTaxis] = useState([])
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')
  const [filtroTaxi, setFiltroTaxi] = useState('todos')
  const [ordenarPor, setOrdenarPor] = useState('fecha')
  const [ordenAscendente, setOrdenAscendente] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const registrosPorPagina = 20
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
      } else {
        setUser(user)
        fetchDatos(user.id)
      }
    }
    getUser()
  }, [])

  const fetchDatos = async (userId) => {
    setLoading(true)
    
    try {
      // Obtener taxis del usuario
      const { data: taxisData } = await supabase
        .from('taxis')
        .select('*')
        .eq('user_id', userId)
        .order('nombre', { ascending: true })

      setTaxis(taxisData || [])

      // Obtener todos los registros
      if (taxisData && taxisData.length > 0) {
        const taxiIds = taxisData.map(t => t.id)
        
        const { data: registrosData } = await supabase
          .from('registros')
          .select(`
            *,
            taxis (
              nombre,
              conductor
            )
          `)
          .in('taxi_id', taxiIds)
          .order('fecha', { ascending: false })

        setRegistros(registrosData || [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
    
    setLoading(false)
  }

  // Filtrar y ordenar registros
  const registrosFiltrados = useMemo(() => {
    let filtrados = [...registros]

    // Filtrar por taxi
    if (filtroTaxi !== 'todos') {
      filtrados = filtrados.filter(r => r.taxi_id === filtroTaxi)
    }

    // Filtrar por fecha de inicio
    if (filtroFechaInicio) {
      filtrados = filtrados.filter(r => r.fecha >= filtroFechaInicio)
    }

    // Filtrar por fecha de fin
    if (filtroFechaFin) {
      filtrados = filtrados.filter(r => r.fecha <= filtroFechaFin)
    }

    // Ordenar
    filtrados.sort((a, b) => {
      let valorA, valorB

      switch (ordenarPor) {
        case 'fecha':
          valorA = new Date(a.fecha).getTime()
          valorB = new Date(b.fecha).getTime()
          break
        case 'cantidad':
          valorA = parseFloat(a.cantidad)
          valorB = parseFloat(b.cantidad)
          break
        case 'taxi':
          valorA = a.taxis?.nombre || ''
          valorB = b.taxis?.nombre || ''
          break
        default:
          valorA = new Date(a.fecha).getTime()
          valorB = new Date(b.fecha).getTime()
      }

      if (ordenAscendente) {
        return valorA > valorB ? 1 : -1
      } else {
        return valorA < valorB ? 1 : -1
      }
    })

    return filtrados
  }, [registros, filtroTaxi, filtroFechaInicio, filtroFechaFin, ordenarPor, ordenAscendente])

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    if (registrosFiltrados.length === 0) {
      return {
        total: 0,
        promedio: 0,
        cantidadRegistros: 0,
        diasTrabajados: 0,
        promedioDiario: 0,
        mejorDia: null,
        peorDia: null,
        porTaxi: [] // Asegurar que porTaxi siempre sea un array
      }
    }

    const total = registrosFiltrados.reduce((sum, r) => sum + parseFloat(r.cantidad || 0), 0)
    const promedio = total / registrosFiltrados.length
    const diasUnicos = new Set(registrosFiltrados.map(r => r.fecha)).size
    const promedioDiario = total / diasUnicos

    // Encontrar mejor y peor día
    const mejorDia = registrosFiltrados.reduce((max, r) => 
      parseFloat(r.cantidad) > parseFloat(max.cantidad) ? r : max
    , registrosFiltrados[0])
    
    const peorDia = registrosFiltrados.reduce((min, r) => 
      parseFloat(r.cantidad) < parseFloat(min.cantidad) ? r : min
    , registrosFiltrados[0])

    // Agrupar por taxi
    const porTaxi = registrosFiltrados.reduce((acc, registro) => {
      const taxiId = registro.taxi_id
      if (!acc[taxiId]) {
        acc[taxiId] = {
          taxi: registro.taxis,
          total: 0,
          cantidad: 0
        }
      }
      acc[taxiId].total += parseFloat(registro.cantidad)
      acc[taxiId].cantidad += 1
      return acc
    }, {})

    const taxisOrdenados = Object.values(porTaxi)
      .sort((a, b) => b.total - a.total)
      .map((item, index) => ({
        ...item,
        porcentaje: (item.total / total) * 100
      }))

    return {
      total,
      promedio,
      cantidadRegistros: registrosFiltrados.length,
      diasTrabajados: diasUnicos,
      promedioDiario,
      mejorDia,
      peorDia,
      porTaxi: taxisOrdenados
    }
  }, [registrosFiltrados])

  // Paginación
  const totalPaginas = Math.ceil(registrosFiltrados.length / registrosPorPagina)
  const registrosPagina = registrosFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  )

  // Funciones de exportación
  const exportarCSV = () => {
    const cabeceras = ['Fecha', 'Taxi', 'Conductor', 'Cantidad ($)', 'Notas', 'Día']
    const filas = registrosFiltrados.map(r => [
      r.fecha,
      r.taxis?.nombre || 'N/A',
      r.taxis?.conductor || 'N/A',
      parseFloat(r.cantidad).toFixed(2),
      r.notas || '',
      new Date(r.fecha).toLocaleDateString('es-ES', { weekday: 'long' })
    ])
    
    const csv = [
      'Reporte General de Taxis',
      `Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`,
      `Total registros: ${estadisticas.cantidadRegistros}`,
      `Total dinero: $${estadisticas.total.toFixed(2)}`,
      '',
      cabeceras.join(','),
      ...filas.map(f => f.join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-general-taxis-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const exportarPDF = () => {
    alert('📄 Función de exportación a PDF en desarrollo')
    // En una implementación real, podrías usar librerías como jsPDF o html2canvas
  }

  // Formatear fecha para input
  const hoy = new Date().toISOString().split('T')[0]
  const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <header className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">📊</span>
                Reporte General
              </h1>
              <p className="text-gray-700 mt-1">
                Vista completa de todas las operaciones • {user?.email}
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

        {/* FILTROS Y CONTROLES */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* FILTRO POR TAXI */}
            <div>
              <label className="block text-gray-900 font-medium mb-2">
                <span className="flex items-center text-sm">
                  <span className="mr-1">🚕</span>
                  Filtrar por Taxi
                </span>
              </label>
              <select
                value={filtroTaxi}
                onChange={(e) => setFiltroTaxi(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 text-sm"
              >
                <option value="todos">Todos los taxis</option>
                {taxis.map((taxi) => (
                  <option key={taxi.id} value={taxi.id}>
                    {taxi.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* FILTRO FECHA INICIO */}
            <div>
              <label className="block text-gray-900 font-medium mb-2">
                <span className="flex items-center text-sm">
                  <span className="mr-1">📅</span>
                  Fecha inicio
                </span>
              </label>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                max={hoy}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 text-sm"
              />
            </div>

            {/* FILTRO FECHA FIN */}
            <div>
              <label className="block text-gray-900 font-medium mb-2">
                <span className="flex items-center text-sm">
                  <span className="mr-1">📅</span>
                  Fecha fin
                </span>
              </label>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                max={hoy}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 text-sm"
              />
            </div>

            {/* ORDENAR POR */}
            <div>
              <label className="block text-gray-900 font-medium mb-2">
                <span className="flex items-center text-sm">
                  <span className="mr-1">↕️</span>
                  Ordenar por
                </span>
              </label>
              <div className="flex gap-2">
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition text-gray-900 text-sm"
                >
                  <option value="fecha">Fecha</option>
                  <option value="cantidad">Cantidad</option>
                  <option value="taxi">Taxi</option>
                </select>
                <button
                  onClick={() => setOrdenAscendente(!ordenAscendente)}
                  className="px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  title={ordenAscendente ? 'Ascendente' : 'Descendente'}
                >
                  {ordenAscendente ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setFiltroTaxi('todos')
                setFiltroFechaInicio('')
                setFiltroFechaFin('')
                setPaginaActual(1)
              }}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              Limpiar filtros
            </button>
            <button
              onClick={() => {
                setFiltroFechaInicio(primerDiaMes)
                setFiltroFechaFin(hoy)
                setPaginaActual(1)
              }}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-medium text-sm transition"
            >
              Este mes
            </button>
            <button
              onClick={exportarCSV}
              disabled={registrosFiltrados.length === 0}
              className="bg-green-100 hover:bg-green-200 text-green-800 px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50"
            >
              📥 Exportar CSV
            </button>
            <button
              onClick={exportarPDF}
              disabled={registrosFiltrados.length === 0}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50"
            >
              📄 Exportar PDF
            </button>
          </div>
        </div>

        {/* ESTADÍSTICAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total General</p>
                <p className="text-3xl font-bold mt-2">
                  ${estadisticas.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
            <p className="text-sm opacity-80 mt-2">
              {estadisticas.cantidadRegistros} registro{estadisticas.cantidadRegistros !== 1 ? 's' : ''}
            </p>
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
            <p className="text-sm opacity-80 mt-2">
              {estadisticas.diasTrabajados} día{estadisticas.diasTrabajados !== 1 ? 's' : ''} trabajado{estadisticas.diasTrabajados !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Taxis Activos</p>
                <p className="text-3xl font-bold mt-2">
                  {estadisticas.porTaxi.length}
                </p>
              </div>
              <div className="text-3xl">🚖</div>
            </div>
            <p className="text-sm opacity-80 mt-2">
              {taxis.length} taxi{taxis.length !== 1 ? 's' : ''} registrado{taxis.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Promedio por Registro</p>
                <p className="text-3xl font-bold mt-2">
                  ${estadisticas.promedio.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
            <p className="text-sm opacity-80 mt-2">
              {registrosFiltrados.length} mostrando
            </p>
          </div>
        </div>

        {/* DISTRIBUCIÓN POR TAXI */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-2">📊</span>
            Distribución por Taxi
          </h2>

          {estadisticas.porTaxi.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500">No hay datos para mostrar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {estadisticas.porTaxi.map((item, index) => (
                <div key={item.taxi?.id || index} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-lg">🚖</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{item.taxi?.nombre || 'Taxi no disponible'}</h3>
                        <p className="text-gray-600 text-sm">{item.taxi?.conductor || 'Sin conductor'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        ${item.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {item.cantidad} registro{item.cantidad !== 1 ? 's' : ''} • {item.porcentaje.toFixed(1)}% del total
                      </p>
                    </div>
                  </div>
                  
                  {/* BARRA DE PROGRESO */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full"
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                  
                  {/* ESTADÍSTICAS DEL TAXI */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Promedio por día</p>
                      <p className="font-bold text-gray-900">
                        ${item.cantidad > 0 ? (item.total / item.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Registros</p>
                      <p className="font-bold text-gray-900">{item.cantidad}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Porcentaje</p>
                      <p className="font-bold text-gray-900">{item.porcentaje.toFixed(1)}%</p>
                    </div>
                    <div className="text-center">
                      <Link href={`/reportes/taxi?id=${item.taxi?.id}`}>
                        <button className="text-purple-600 hover:text-purple-800 font-medium text-sm">
                          Ver detalle →
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TABLA DE REGISTROS */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-2">📋</span>
              Registros ({registrosFiltrados.length})
            </h2>
            
            {/* PAGINACIÓN */}
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  ←
                </button>
                <span className="text-gray-700 font-medium">
                  Página {paginaActual} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  →
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mx-auto"></div>
              <p className="mt-6 text-gray-700 text-lg">Cargando registros...</p>
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <p className="text-gray-500 text-lg">No hay registros con los filtros aplicados</p>
              <button
                onClick={() => {
                  setFiltroTaxi('todos')
                  setFiltroFechaInicio('')
                  setFiltroFechaFin('')
                }}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Mostrar todos
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-4 font-bold text-gray-700">Fecha</th>
                    <th className="text-left p-4 font-bold text-gray-700">Taxi</th>
                    <th className="text-left p-4 font-bold text-gray-700">Conductor</th>
                    <th className="text-left p-4 font-bold text-gray-700">Cantidad</th>
                    <th className="text-left p-4 font-bold text-gray-700">Notas</th>
                    <th className="text-left p-4 font-bold text-gray-700">Día</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {registrosPagina.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50 transition">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {new Date(registro.fecha).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-gray-900">
                          {registro.taxis?.nombre || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-700">
                          {registro.taxis?.conductor || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-green-600">
                          ${parseFloat(registro.cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-700 max-w-xs truncate" title={registro.notas || ''}>
                          {registro.notas || '-'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-600">
                          {new Date(registro.fecha).toLocaleDateString('es-ES', { weekday: 'short' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RESUMEN Y RECOMENDACIONES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-100 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-800 mb-4 flex items-center">
              <span className="mr-2">📈</span>
              Resumen del Período
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Período analizado:</span>
                <span className="font-bold text-blue-900">
                  {filtroFechaInicio 
                    ? `${new Date(filtroFechaInicio).toLocaleDateString('es-ES')} - ${filtroFechaFin ? new Date(filtroFechaFin).toLocaleDateString('es-ES') : 'Hoy'}`
                    : 'Todo el historial'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Taxis incluidos:</span>
                <span className="font-bold text-blue-900">
                  {filtroTaxi === 'todos' ? 'Todos' : taxis.find(t => t.id === filtroTaxi)?.nombre || '1 taxi'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Densidad de trabajo:</span>
                <span className="font-bold text-blue-900">
                  {(estadisticas.diasTrabajados > 0 && registrosFiltrados.length > 0) 
                    ? (estadisticas.diasTrabajados / registrosFiltrados.length).toFixed(2) + ' días/registro'
                    : '0 días/registro'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Eficiencia promedio:</span>
                <span className="font-bold text-blue-900">
                  ${estadisticas.promedioDiario.toLocaleString('es-ES', { minimumFractionDigits: 2 })}/día
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-2xl p-6">
            <h3 className="font-bold text-green-800 mb-4 flex items-center">
              <span className="mr-2">💡</span>
              Recomendaciones
            </h3>
            <ul className="text-green-700 space-y-2 text-sm">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Los mejores días para trabajar son los <strong>viernes y sábados</strong></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Considera optimizar las rutas de los taxis menos rentables</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Exporta este reporte mensualmente para tu contador</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Revisa las notas para identificar patrones de clientes frecuentes</span>
              </li>
            </ul>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mt-10 pt-8 border-t border-gray-200 text-center text-gray-600 text-sm">
          <p>📊 Reporte General • Generado el {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} • {estadisticas.cantidadRegistros} registros analizados</p>
          <p className="mt-1">Sistema de Gestión de Taxis • Todos los derechos reservados</p>
        </footer>
      </div>
    </div>
  )
}
