import { useEffect, useRef } from 'react'
import './SettingsControls.css'
import { IState } from '../../../store'
import { Credentials, PornList } from '../../gameboard/types'
import { PaceSetting } from './PaceSetting/PaceSetting'
import { PornSetting } from './PornSetting/PornSetting'
import { SettingsActions, VibratorActions } from '../store'
import { DurationSetting } from './DurationSetting/DurationSetting'
import { EventsSetting } from './EventsSetting/EventsSetting'
import { HypnoSetting } from './HypnoSetting/HypnoSetting'
import { SaveSetting } from './SaveSetting/SaveSetting'
import { applyAllSettings, makeSave } from '../../../helpers/saveFormat'
import { debounce } from 'lodash'
import { CumSetting } from './CumSetting/CumSetting'
import { VibratorSetting } from './VibratorSetting/VibratorSetting'
import { WalltakerSetting } from './WalltakerSetting/WalltakerSetting'
import { PlayerSetting } from './PlayerSetting/PlayerSetting'
import { connect } from 'react-redux'
import { PropsForConnectedComponent } from '../../../store.types'

interface ISettingsControlsProps extends PropsForConnectedComponent {
  pace: IState['settings']['pace']
  steepness: IState['settings']['steepness']
  credentials: Credentials
  pornList: PornList
  eventList: IState['settings']['eventList']
  duration: IState['settings']['duration']
  hypnoMode: IState['settings']['hypnoMode']
  cum: IState['settings']['cum']
  vibrator: IState['vibrators']
  walltakerLink: IState['settings']['walltakerLink']
  player: IState['settings']['player']
}

export const SettingsControls = connect(
  (state: IState) =>
    ({
      pace: state.settings.pace,
      steepness: state.settings.steepness,
      credentials: state.settings.credentials,
      pornList: state.settings.pornList,
      eventList: state.settings.eventList,
      duration: state.settings.duration,
      hypnoMode: state.settings.hypnoMode,
      cum: state.settings.cum,
      vibrator: state.vibrators,
      walltakerLink: state.settings.walltakerLink,
      player: state.settings.player,
    } as ISettingsControlsProps),
)(function (props: ISettingsControlsProps) {
  const saveToLocalStorage = useRef(
    debounce((props: ISettingsControlsProps) => {
      localStorage.setItem('lastSession', makeSave(props, /*includeCredentials*/ true))
    }, 1000),
  )
  useEffect(() => saveToLocalStorage.current(props))

  return (
    <div className="SettingsControls" tabIndex={0} role="application" aria-label="Settings">
      <PaceSetting
        max={props.pace.max}
        min={props.pace.min}
        steepness={props.steepness}
        setMax={(pace) => props.dispatch(SettingsActions.SetMaxPace(pace))}
        setMin={(pace) => props.dispatch(SettingsActions.SetMinPace(pace))}
        setSteepness={(steepness) => props.dispatch(SettingsActions.SetSteepness(steepness))}
      />

      <DurationSetting duration={props.duration} setDuration={(newDuration) => props.dispatch(SettingsActions.SetDuration(newDuration))} />

      <EventsSetting eventList={props.eventList} setEventList={(newList) => props.dispatch(SettingsActions.SetEventList(newList))} />

      <PornSetting
        credentials={props.credentials}
        setCredentials={(newCredentials) => props.dispatch(SettingsActions.SetCredentials(newCredentials))}
        pornList={props.pornList}
        setPornList={(newList) => props.dispatch(SettingsActions.SetPornList(newList))}
      />

      <WalltakerSetting
        enabled={Boolean(props.walltakerLink ?? false)}
        link={props.walltakerLink}
        setLink={(newLink) => props.dispatch(SettingsActions.SetWalltakerLink(newLink))}
      />

      <CumSetting
        enabled={props.eventList.some((event) => event === 'cum')}
        ejaculateLikelihood={props.cum.ejaculateLikelihood}
        setEjaculateLikelihood={(newLikelihood) => props.dispatch(SettingsActions.SetEjaculateLikelihood(newLikelihood))}
        ruinLikelihood={props.cum.ruinLikelihood}
        setRuinLikelihood={(newLikelihood) => props.dispatch(SettingsActions.SetRuinLikelihood(newLikelihood))}
      />

      <HypnoSetting mode={props.hypnoMode} setMode={(newMode) => props.dispatch(SettingsActions.SetHypnoMode(newMode))} />

      <PlayerSetting
        gender={props.player.gender}
        parts={props.player.parts}
        setGender={(newGender) => props.dispatch(SettingsActions.SetPlayerGender(newGender))}
        setParts={(newParts) => props.dispatch(SettingsActions.SetPlayerParts(newParts))}
      />

      <VibratorSetting
        connection={props.vibrator.connection}
        error={props.vibrator.error}
        vibrators={props.vibrator.devices}
        mode={props.vibrator.mode}
        setMode={(newMode) => props.dispatch(VibratorActions.SetMode(newMode))}
        onConnect={() => props.dispatch(VibratorActions.Connect(null))}
        onDisconnect={() => props.dispatch(VibratorActions.Disconnect())}
      />

      <SaveSetting settings={props} setSettings={(settings) => applyAllSettings(props.dispatch, settings)} />
    </div>
  )
})
