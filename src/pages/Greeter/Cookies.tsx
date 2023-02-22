import React, { useState, useEffect } from 'react'
import '../../features/settings/SettingsControls/settings.css'

export function Cookies() {
  const [allowed, setAllowed] = useState(localStorage.getItem('allowCookies') === 'true' || localStorage.getItem('allowCookies') === null)

  useEffect(() => {
    localStorage.setItem('allowCookies', allowed.toString())
  })

  return (
    <>
      <section>
        This site uses cookies and an analytics tool (Google Analytics) to improve the web app and collect feedback. We collect the minimum
        data that's usable for our purpose.
        <strong>
          Acceptance of the usage of these cookies allows of the recording of pseudo-anonymized details like your IP address for this
          purpose. We don't know anything about ya when this is allowed, just stuff about how you use joi.how.
        </strong>
        <div className="settings-row">
          <em>{allowed ? 'Cookies are enabled! Thanks, it helps us make things better.' : 'Cookies are NOT BEING USED.'}</em>

          <button onClick={() => setAllowed(!allowed)}>{allowed ? 'Disallow' : 'Allow'} Cookies</button>
        </div>
      </section>
    </>
  )
}
