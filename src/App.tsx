import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { useEffect, type FunctionComponent } from 'react'
import { GreeterPage } from './pages/Greeter/Greeter'
import { loadSettings } from './helpers/saveFormat'
import { useDispatch } from 'react-redux'
import { PlayPage } from './pages/Play'

export const App: FunctionComponent = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    try {
      loadSettings(dispatch)
    } catch (e) {
      console.warn(e)
    }
  })

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GreeterPage />} />
          <Route path="/play" element={<PlayPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
