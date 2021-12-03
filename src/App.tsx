import React, { useEffect } from 'react'
import { GreeterPage } from './pages/Greeter/Greeter'
import { PlayPage } from './pages/Play'
import { Router, LocationProvider, createHistory } from '@reach/router'
import { connect } from 'react-redux'
import { PropsForConnectedComponent } from './features/settings/types'
import { applyAllSettings, unpackSave } from './helpers/saveFormat'
import reactGA from './analytics'

interface IAppProps extends PropsForConnectedComponent {}

const history = createHistory(window as any)
history.listen(event => {
  if (localStorage.getItem('allowCookies') === 'true' || localStorage.getItem('allowCookies') === null) {
    reactGA.pageview(event.location.pathname)
  }
})

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
      <LocationProvider history={history}>
        <Router>
          <GreeterPage path="/" />
          <PlayPage path="/play" />
        </Router>
      </LocationProvider>
    </div>
  )
}

export default connect(
  null,
  dispatch => ({ dispatch }),
)(App)
