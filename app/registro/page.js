import { Suspense } from 'react'
import RegistroClient from './RegistroClient'

export default function Page() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <RegistroClient />
    </Suspense>
  )
}
