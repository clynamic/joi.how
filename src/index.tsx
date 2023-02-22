import ReactDOM from 'react-dom/client'
import App from './App'
import { store } from './store'
import './main.css'
import { Provider } from 'react-redux'
import React from 'react'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
)
