import { Credentials, PornService, PornQuality } from '../../gameboard/types'
import { applyAllSettings, saveSettings } from '../../../helpers/saveFormat'
import { WalltakerSetting } from './WalltakerSetting/WalltakerSetting'
import type { ISettingsState, ISettingsVibratorState } from '../store'
import { type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit'
import { DurationSetting } from './DurationSetting/DurationSetting'
import { VibratorSetting } from './VibratorSetting/VibratorSetting'
import { EventsSetting } from './EventsSetting/EventsSetting'
import { PlayerSetting } from './PlayerSetting/PlayerSetting'
import { SettingsActions, VibratorActions } from '../store'
import { HypnoSetting } from './HypnoSetting/HypnoSetting'
import { useEffect, type FunctionComponent } from 'react'
import { PaceSetting } from './PaceSetting/PaceSetting'
import { PornSetting } from './PornSetting/PornSetting'
import { SaveSetting } from './SaveSetting/SaveSetting'
import { useDispatch, useSelector } from 'react-redux'
import { CumSetting } from './CumSetting/CumSetting'
import { type IState } from '../../../store'
import './SettingsControls.css'

export const SettingsControls: FunctionComponent = () => {
  const dispatch: ThunkDispatch<IState, unknown, AnyAction> = useDispatch()
  const settings: ISettingsState = useSelector<IState, ISettingsState>((state) => state.settings)
  const vibrators: ISettingsVibratorState = useSelector<IState, ISettingsVibratorState>((state) => state.vibrators)

  useEffect(() => saveSettings(settings), [settings])

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

      <DurationSetting
        warmupDuration={settings.warmupDuration}
        setWarmupDuration={(newDuration) => dispatch(SettingsActions.SetWarmupDuration(newDuration))}
        duration={settings.duration}
        setDuration={(newDuration) => dispatch(SettingsActions.SetDuration(newDuration))}
      />

      <EventsSetting eventList={settings.events} setEventList={(newList) => dispatch(SettingsActions.SetEventList(newList))} />

      <PornSetting
        credentials={settings.credentials}
        setCredentials={(service: PornService, credentials: Credentials[PornService]) =>
          dispatch(SettingsActions.SetCredentials({ service, credentials }))
        }
        pornQuality={settings.pornQuality}
        setPornQuality={(quality: PornQuality) => dispatch(SettingsActions.SetPornQuality(quality))}
        startVideosAtRandomTime={settings.startVideosAtRandomTime}
        setStartVideosAtRandomTime={(randomStart: boolean) => dispatch(SettingsActions.SetStartVideosAtRandomTime(randomStart))}
        porn={settings.porn}
        setPorn={(newList) => dispatch(SettingsActions.SetPornList(newList))}
      />

      <WalltakerSetting
        enabled={Boolean(settings.walltaker ?? false)}
        link={settings.walltaker}
        setLink={(newLink) => dispatch(SettingsActions.SetWalltakerLink(newLink))}
      />

      <CumSetting
        enabled={settings.events.some((event) => event === 'cum')}
        ejaculateLikelihood={settings.cum.ejaculateLikelihood}
        setEjaculateLikelihood={(newLikelihood) => dispatch(SettingsActions.SetEjaculateLikelihood(newLikelihood))}
        ruinLikelihood={settings.cum.ruinLikelihood}
        setRuinLikelihood={(newLikelihood) => dispatch(SettingsActions.SetRuinLikelihood(newLikelihood))}
      />

      <HypnoSetting mode={settings.hypno} setMode={(newMode) => dispatch(SettingsActions.SetHypnoMode(newMode))} />

      <PlayerSetting
        gender={settings.player.gender}
        parts={settings.player.parts}
        setGender={(newGender) => dispatch(SettingsActions.SetPlayerGender(newGender))}
        setParts={(newParts) => dispatch(SettingsActions.SetPlayerParts(newParts))}
      />

      <VibratorSetting
        connection={vibrators.connection}
        error={vibrators.error}
        vibrators={vibrators.devices}
        mode={vibrators.mode}
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
          applyAllSettings(settings, dispatch)
        }}
      />
    </div>
  )
}
