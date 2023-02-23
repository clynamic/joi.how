import { type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit'
import { debounce } from 'lodash'
import { useEffect, useRef, type FunctionComponent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { applyAllSettings, makeSave } from '../../../helpers/saveFormat'
import { type IState } from '../../../store'
import { type Credentials, type PornList } from '../../gameboard/types'
import { SettingsActions, VibratorActions } from '../store'
import { CumSetting } from './CumSetting/CumSetting'
import { DurationSetting } from './DurationSetting/DurationSetting'
import { EventsSetting } from './EventsSetting/EventsSetting'
import { HypnoSetting } from './HypnoSetting/HypnoSetting'
import { PaceSetting } from './PaceSetting/PaceSetting'
import { PlayerSetting } from './PlayerSetting/PlayerSetting'
import { PornSetting } from './PornSetting/PornSetting'
import { SaveSetting } from './SaveSetting/SaveSetting'
import './SettingsControls.css'
import { VibratorSetting } from './VibratorSetting/VibratorSetting'
import { WalltakerSetting } from './WalltakerSetting/WalltakerSetting'

interface ISettingsControlsProps {
  pace: IState['settings']['pace']
  steepness: IState['settings']['steepness']
  credentials: Credentials | null
  pornList: PornList
  eventList: IState['settings']['eventList']
  duration: IState['settings']['duration']
  hypnoMode: IState['settings']['hypnoMode']
  cum: IState['settings']['cum']
  vibrator: IState['vibrators']
  walltakerLink: IState['settings']['walltakerLink']
  player: IState['settings']['player']
}

export const SettingsControls: FunctionComponent = () => {
  const dispatch: ThunkDispatch<IState, unknown, AnyAction> = useDispatch()
  const settings: ISettingsControlsProps = useSelector<IState, ISettingsControlsProps>((state) => ({
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
  }))

  const saveToLocalStorage = useRef(
    debounce((props: ISettingsControlsProps) => {
      localStorage.setItem('lastSession', makeSave(props, /* includeCredentials */ true))
    }, 1000),
  )
  useEffect(() => saveToLocalStorage.current(settings))

  return (
    <div className="SettingsControls" tabIndex={0} role="application" aria-label="Settings">
      <PaceSetting
        max={settings.pace.max}
        min={settings.pace.min}
        steepness={settings.steepness}
        setMax={(pace) => dispatch(SettingsActions.SetMaxPace(pace))}
        setMin={(pace) => dispatch(SettingsActions.SetMinPace(pace))}
        setSteepness={(steepness) => dispatch(SettingsActions.SetSteepness(steepness))}
      />

      <DurationSetting duration={settings.duration} setDuration={(newDuration) => dispatch(SettingsActions.SetDuration(newDuration))} />

      <EventsSetting eventList={settings.eventList} setEventList={(newList) => dispatch(SettingsActions.SetEventList(newList))} />

      <PornSetting
        credentials={settings.credentials}
        setCredentials={(newCredentials) => dispatch(SettingsActions.SetCredentials(newCredentials))}
        pornList={settings.pornList}
        setPornList={(newList) => dispatch(SettingsActions.SetPornList(newList))}
      />

      <WalltakerSetting
        enabled={Boolean(settings.walltakerLink ?? false)}
        link={settings.walltakerLink}
        setLink={(newLink) => dispatch(SettingsActions.SetWalltakerLink(newLink))}
      />

      <CumSetting
        enabled={settings.eventList.some((event) => event === 'cum')}
        ejaculateLikelihood={settings.cum.ejaculateLikelihood}
        setEjaculateLikelihood={(newLikelihood) => dispatch(SettingsActions.SetEjaculateLikelihood(newLikelihood))}
        ruinLikelihood={settings.cum.ruinLikelihood}
        setRuinLikelihood={(newLikelihood) => dispatch(SettingsActions.SetRuinLikelihood(newLikelihood))}
      />

      <HypnoSetting mode={settings.hypnoMode} setMode={(newMode) => dispatch(SettingsActions.SetHypnoMode(newMode))} />

      <PlayerSetting
        gender={settings.player.gender}
        parts={settings.player.parts}
        setGender={(newGender) => dispatch(SettingsActions.SetPlayerGender(newGender))}
        setParts={(newParts) => dispatch(SettingsActions.SetPlayerParts(newParts))}
      />

      <VibratorSetting
        connection={settings.vibrator.connection}
        error={settings.vibrator.error}
        vibrators={settings.vibrator.devices}
        mode={settings.vibrator.mode}
        setMode={(newMode) => dispatch(VibratorActions.SetMode(newMode))}
        onConnect={() => {
          void dispatch(VibratorActions.Connect(null))
        }}
        onDisconnect={() => {
          void dispatch(VibratorActions.Disconnect())
        }}
      />

      <SaveSetting
        settings={settings}
        setSettings={(settings) => {
          applyAllSettings(dispatch, settings)
        }}
      />
    </div>
  )
}
