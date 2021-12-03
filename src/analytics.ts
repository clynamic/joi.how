import reactGA from 'react-ga'
reactGA.initialize('UA-158605688-1')
if (localStorage.getItem('allowCookies') === 'true' || localStorage.getItem('allowCookies') === null) {
  reactGA.pageview(window.location.pathname)
}

export default reactGA
