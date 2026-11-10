import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './shared/base.css'
import { useRoute, VariantDock } from './shared/ui'
import { NewCampaignTray } from './shared/motion'

// The product. Earlier explorations live under #/archive and #/v1…v5.
const DmsApp = lazy(() => import('./app/App'))
const Launcher = lazy(() => import('./Launcher'))
const Loaders = lazy(() => import('./loaders/Loaders'))
const Brand = lazy(() => import('./brand/Brand'))
const variants = {
  v1: lazy(() => import('./variants/v1/V1')),
  v2: lazy(() => import('./variants/v2/V2')),
  v3: lazy(() => import('./variants/v3/V3')),
  v4: lazy(() => import('./variants/v4/V4')),
  v5: lazy(() => import('./variants/v5/V5')),
}

function App() {
  const path = useRoute()
  const first = path.split('/')[1]
  const Variant = variants[first]
  if (window.location.pathname.replace(/\/$/, '') === '/brand' || first === 'brand') return <Suspense fallback={null}><Brand /></Suspense>
  if (window.location.pathname.replace(/\/$/, '') === '/loaders' || first === 'loaders') return <Suspense fallback={null}><Loaders /></Suspense>
  return (
    <>
      <Suspense fallback={null}>
        {Variant ? <Variant path={path} key={first} /> : first === 'archive' ? <Launcher /> : <DmsApp path={path} />}
      </Suspense>
      {Variant && <VariantDock current={first} />}
      {first !== 'archive' && <NewCampaignTray />}
      <Toaster position="bottom-right" offset={20} gap={8} visibleToasts={3} duration={3200} />
    </>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
