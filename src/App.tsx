import { FunctionComponent, PropsWithChildren, useEffect } from 'react'
import { GreeterPage } from './pages/Greeter/Greeter'
import { PlayPage } from './pages/Play'
import { applyAllSettings, unpackSave } from './helpers/saveFormat'
import reactGA from './analytics'
import { connect } from 'react-redux'
import { PropsForConnectedComponent } from './store.types'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'

interface IAppProps extends PropsForConnectedComponent {}

function App(props: IAppProps) {
  useEffect(() => {
    const lastSession = localStorage.getItem('lastSession')
    try {
      if (lastSession) applyAllSettings(props.dispatch, unpackSave(lastSession))
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

export default connect(null, (dispatch) => ({ dispatch }))(App)
