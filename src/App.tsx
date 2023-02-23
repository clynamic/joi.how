import { useEffect, type FunctionComponent, type PropsWithChildren } from 'react'
import { useDispatch } from 'react-redux'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import reactGA from './analytics'
import { applyAllSettings, unpackSave } from './helpers/saveFormat'
import { GreeterPage } from './pages/Greeter/Greeter'
import { PlayPage } from './pages/Play'

export const App: FunctionComponent = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const lastSession = localStorage.getItem('lastSession')
    try {
      if (lastSession != null) applyAllSettings(dispatch, unpackSave(lastSession))
    } catch (e) {
      console.warn(e)
    }
  })

  return (
    <div className="App">
      <BrowserRouter>
        <Tracker />
        <Routes>
          <Route path="/" element={<GreeterPage />} />
          <Route path="/play" element={<PlayPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

const Tracker: FunctionComponent<PropsWithChildren> = ({ children }) => {
  const location = useLocation()
  useEffect(() => {
    if (localStorage.getItem('allowCookies') === 'true' || localStorage.getItem('allowCookies') === null) {
      reactGA.pageview(location.pathname)
    }
  }, [location])

  return <>{children}</>
}
