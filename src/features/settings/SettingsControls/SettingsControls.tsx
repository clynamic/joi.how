import { type AnyAction, type ThunkDispatch } from '@reduxjs/toolkit'
import { useEffect, type FunctionComponent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { applyAllSettings, saveSettings } from '../../../helpers/saveFormat'
import { type IState } from '../../../store'
import { type PornQuality } from '../../gameboard/types'
import type { ISettingsState, ISettingsVibratorState } from '../store'
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
        setCredentials={(newCredentials) => dispatch(SettingsActions.SetCredentials(newCredentials))}
        pornQuality={settings.pornQuality}
        setPornQuality={(quality: PornQuality) => dispatch(SettingsActions.SetPornQuality(quality))}
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
