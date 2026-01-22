'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Registro() {
  const [cantidad, setCantidad] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [notas, setNotas] = useState('')
  const [taxis, setTaxis] = useState([])
  const [taxiSeleccionado, setTaxiSeleccionado] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTaxis, setLoadingTaxis] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const taxiId = searchParams.get('taxi')
    if (taxiId) {
      setTaxiSeleccionado(taxiId)
    }
    fetchTaxis()
  }, [])

  const fetchTaxis = async () => {
    setLoadingTaxis(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    const { data, error } = await supabase
      .from('taxis')
      .select('*')
      .eq('user_id', user.id)
      .order('nombre', { ascending: true })
    
    if (error) {
      console.error('Error al cargar taxis:', error)
      alert('Error al cargar taxis: ' + error.message)
    } else {
      setTaxis(data || [])
      // Si hay un taxi en la URL y está en la lista, seleccionarlo
      const taxiId = searchParams.get('taxi')
      if (taxiId && data.some(t => t.id === taxiId)) {
        setTaxiSeleccionado(taxiId)
      }
    }
    setLoadingTaxis(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!taxiSeleccionado) {
      alert('❌ Por favor, selecciona un taxi')
      return
    }
    
    if (!cantidad || parseFloat(cantidad) <= 0) {
      alert('❌ Por favor, ingresa una cantidad válida')
      return
    }
    
    if (!fecha) {
      alert('❌ Por favor, selecciona una fecha')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('registros')
      .insert([{ 
        taxi_id: taxiSeleccionado, 
        fecha, 
        cantidad: parseFloat(cantidad),
        notas: notas.trim() || null
      }])

    if (error) {
      console.error('Error al guardar:', error)
      alert('❌ Error al guardar: ' + error.message)
    } else {
      alert('✅ ¡Cobro registrado correctamente!')
      // Limpiar formulario
      setCantidad('')
      setNotas('')
      // Redirigir al dashboard
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  const getTaxiNombre = () => {
    const taxi = taxis.find(t => t.id === taxiSeleccionado)
    return taxi ? `${taxi.nombre} (${taxi.conductor})` : 'Seleccionar taxi'
  }

  // Calcular total del día si hay registros
  const calcularTotalDelDia = () => {
    if (!taxiSeleccionado || !cantidad) return 0
    return parseFloat(cantidad)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4">
            <span className="mr-2">←</span> Volver al Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">💰 Registrar Cobro Diario</h1>
          <p className="text-gray-700 mt-2">Registra los ingresos de hoy o de cualquier día</p>
        </div>

        {/* FORMULARIO */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SELECCIONAR TAXI */}
            <div>
              <label className="block text-gray-900 font-bold mb-3">
                <span className="flex items-center">
                  <span className="mr-2">🚕</span>
                  Seleccionar Taxi
                </span>
              </label>
              
              {loadingTaxis ? (
                <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-gray-700">Cargando taxis...</span>
                </div>
              ) : taxis.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                  <p className="text-gray-700 mb-4">No tienes taxis registrados</p>
                  <Link href="/agregar-taxi">
                    <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
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
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                          taxiSeleccionado === taxi.id ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <span className="text-lg">🚖</span>
                        </div>
                        <div>
                          <h3 className={`font-bold ${
                            taxiSeleccionado === taxi.id ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {taxi.nombre}
                          </h3>
                          <p className={`text-sm ${
                            taxiSeleccionado === taxi.id ? 'text-blue-600' : 'text-gray-700'
                          }`}>
                            {taxi.conductor}
                          </p>
                        </div>
                      </div>
                      {taxiSeleccionado === taxi.id && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                            Seleccionado ✓
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FECHA */}
            <div>
              <label className="block text-gray-900 font-bold mb-2">
                <span className="flex items-center">
                  <span className="mr-2">📅</span>
                  Fecha del Cobro
                </span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-lg"
                  required
                  max={new Date().toISOString().split('T')[0]}
                />
                <div className="absolute right-3 top-3 text-gray-500 text-xl">
                  📅
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 ml-1">
                Selecciona la fecha correspondiente al cobro
              </p>
            </div>

            {/* CANTIDAD */}
            <div>
              <label className="block text-gray-900 font-bold mb-2">
                <span className="flex items-center">
                  <span className="mr-2">💵</span>
                  Cantidad Cobrada
                </span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-3 text-gray-900 font-bold text-lg">$</div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-lg"
                  placeholder="0.00"
                  required
                />
                <div className="absolute right-3 top-3 text-gray-500 text-xl">
                  💰
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2 ml-1">
                Ingresa el monto total cobrado en el día
              </p>
            </div>

            {/* NOTAS OBSERVACIONES */}
            <div>
              <label className="block text-gray-900 font-bold mb-2">
                <span className="flex items-center">
                  <span className="mr-2">📝</span>
                  Notas u Observaciones (Opcional)
                </span>
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 text-lg placeholder:text-gray-500"
                placeholder="Ej: Turno mañana, servicio especial, cliente frecuente, etc."
                rows="3"
              />
              <p className="text-sm text-gray-700 mt-2 ml-1">
                Puedes agregar información adicional sobre este cobro
              </p>
            </div>

            {/* RESUMEN DEL REGISTRO */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl p-5">
              <h3 className="font-bold text-green-800 mb-3 flex items-center">
                <span className="mr-2">📋</span>
                Resumen del Registro
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Taxi seleccionado:</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {taxiSeleccionado ? getTaxiNombre() : 'Ninguno'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Fecha:</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {fecha ? new Date(fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No seleccionada'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Cantidad a registrar:</span>
                  <span className="font-bold text-green-600 text-2xl">
                    {cantidad ? `$${parseFloat(cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'}
                  </span>
                </div>
                <div className="pt-3 mt-3 border-t border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total del día:</span>
                    <span className="font-bold text-green-700 text-2xl">
                      ${calcularTotalDelDia().toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES */}
            <div className="flex flex-col md:flex-row gap-4 pt-6">
              <Link href="/dashboard" className="md:flex-1">
                <button
                  type="button"
                  className="w-full bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-800 p-4 rounded-xl font-bold transition shadow-md text-lg"
                >
                  Cancelar
                </button>
              </Link>
              <button
                type="submit"
                disabled={loading || !taxiSeleccionado || taxis.length === 0 || !cantidad}
                className="md:flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-xl font-bold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Guardando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-3 text-xl">💾</span>
                    Guardar Cobro
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* CONSEJOS Y ESTADÍSTICAS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
            <h3 className="font-bold text-blue-800 mb-2 flex items-center">
              <span className="mr-2">💡</span>
              Consejo Práctico
            </h3>
            <p className="text-blue-700">
              Registra los cobros <strong>inmediatamente</strong> al terminar cada jornada para mantener un control preciso y actualizado.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-xl p-5">
            <h3 className="font-bold text-purple-800 mb-2 flex items-center">
              <span className="mr-2">📊</span>
              Beneficios
            </h3>
            <ul className="text-purple-700 text-sm space-y-1 ml-5 list-disc">
              <li>Control total de ingresos</li>
              <li>Reportes mensuales automáticos</li>
              <li>Análisis de rentabilidad por taxi</li>
              <li>Base para declaraciones fiscales</li>
            </ul>
          </div>
        </div>

        {/* ESTADÍSTICAS RÁPIDAS */}
        <div className="mt-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl shadow-xl p-6 text-white">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-2">📈</span>
            Estadísticas Rápidas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 p-4 rounded-xl">
              <p className="text-sm opacity-80">Taxis registrados</p>
              <p className="text-2xl font-bold mt-2">{taxis.length}</p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <p className="text-sm opacity-80">Cobro de hoy</p>
              <p className="text-2xl font-bold mt-2">
                ${cantidad ? parseFloat(cantidad).toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <p className="text-sm opacity-80">Fecha</p>
              <p className="text-lg font-bold mt-2">
                {new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-xl">
              <p className="text-sm opacity-80">Estado</p>
              <p className={`text-lg font-bold mt-2 ${taxiSeleccionado ? 'text-green-400' : 'text-yellow-400'}`}>
                {taxiSeleccionado ? 'Listo' : 'Esperando'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
