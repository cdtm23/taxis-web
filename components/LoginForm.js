'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (isLogin) {
      // INICIAR SESIÓN
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        console.log('✅ Login exitoso:', data.user.email)
        router.push('/dashboard')
      }
    } else {
      // REGISTRARSE
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) {
        alert('Error: ' + error.message)
      } else {
        alert('✅ Cuenta creada! Puedes iniciar sesión.')
        setIsLogin(true)
        setEmail('')
        setPassword('')
      }
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🚕 Taxis App</h1>
          <p className="text-gray-700 mt-2">Gestión de liquidaciones diarias</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-900 mb-2 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder:text-gray-500" // ← TEXTO OSCURO AQUÍ
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-900 mb-2 font-medium">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-900 placeholder:text-gray-500" // ← TEXTO OSCURO AQUÍ
              placeholder="••••••••"
              required
              minLength="6"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin)
              setEmail('')
              setPassword('')
            }}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Para pruebas: test@test.com / 123456
          </p>
        </div>
      </div>
    </div>
  )
}
