import { type FunctionComponent } from 'react'
import { OutboundLink } from 'react-ga'
import { Link } from 'react-router-dom'
import { ReactComponent as Logo } from '../../assets/logo.svg'
import { SettingsControls } from '../../features/settings/SettingsControls/SettingsControls'
import { Cookies } from './Cookies'
import './Greeter.css'
import { ReleaseNotes } from './ReleaseNotes/ReleaseNotes'

export const GreeterPage: FunctionComponent = () => {
  return (
    <div className="GreeterPage">
      <div className="settings-row">
        <Logo className="GreeterPage__logo" />
        <h1>
          <abbr title="Jack Off Instructions">JOI</abbr>.how
        </h1>
      </div>
      <p>
        Select your settings, and this app will guide ya&apos; thru a jack-off session. You can adjust most of the aspects of the game, as
        well as select some porn to help with &quot;motivation&quot;. It&apos;s all pulled from <a href="https://e621.net">E621.net</a>, <a href="https://www.redgifs.com">redgifs.com</a>, <a href="https://github.com/stashapp/stash">your own Stash server</a> or from your own local collection.{' '}
        <strong>You are responsible for what you choose to look at.</strong>
      </p>
      <p>
        <em>This app is meant for adults only, and should not be used by anyone under the age of 18.</em>
      </p>
      <Cookies />
      <div className="GreeterPage__settings">
        <SettingsControls />
      </div>
      <OutboundLink className="no-underline" target="_blank" eventLabel="Outbound.Pawflix" to="https://walltaker.joi.how">
        <div className="callout">
          <h2>
            Want to let other people set your wallpaper?{' '}
            <img src="https://cdn.discordapp.com/emojis/750074504528527421.gif?v=1" alt="throbbing cock" />
          </h2>{' '}
          <p>
            Checkout walltaker! It&apos;s a app made by me and the other folks at PawCorp, our little horny-coding collective! It lets you
            up a link where people can set the wallpaper on you phone or PC to an e621 post, within your blacklist!
          </p>
        </div>
      </OutboundLink>
      <ReleaseNotes />
      <p>
        This app is provided without express promise of support.
        <br />
        Check out the source code on{' '}
        <a href="https://github.com/PawCorp/joi.how" target={'_blank'} rel="noreferrer">
          GitHub!
        </a>{' '}
      </p>
      <section>
        Some rules to keep to:
        <ul>
          <li>Keep your strokes to the pace of the circle in the centre of the screen.</li>
          <li>Stroke using only the hand(s) shown in the top status bar.</li>
          <li>Only focus on the porn on screen.</li>
          <li>Watch out for events announced on the right side.</li>
        </ul>
      </section>
      <div className="settings-row GreeterPage__actions">
        <Link className="GreeterPage__begin settings-button" to="/play">
          Begin
        </Link>
      </div>
    </div>
  )
}
