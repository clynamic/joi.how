import reactGA, { initialize, pageview } from 'react-ga'
initialize('UA-158605688-1')
if (localStorage.getItem('allowCookies') === 'true' || localStorage.getItem('allowCookies') === null) {
  pageview(window.location.pathname)
}

export default reactGA
