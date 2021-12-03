import React, { useEffect, useRef } from 'react'
import './SettingsControls.css'
import { connect } from 'react-redux'
import { IState } from '../../../store'
import { PornList } from '../../gameboard/types'
import { PropsForConnectedComponent } from '../types'
import { PaceSetting } from './PaceSetting/PaceSetting'
import { PornSetting } from './PornSetting/PornSetting'
import { SettingsActions } from '../store'
import { DurationSetting } from './DurationSetting/DurationSetting'
import { EventsSetting } from './EventsSetting/EventsSetting'
import { HypnoSetting } from './HypnoSetting/HypnoSetting'
import { SaveSetting } from './SaveSetting/SaveSetting'
import { applyAllSettings, makeSave } from '../../../helpers/saveFormat'
import { debounce } from 'lodash'
import { CumSetting } from './CumSetting/CumSetting'
import { VibratorSetting } from './VibratorSetting/VibratorSetting'
import { SettingsVibratorActions } from '../store/actions.vibrator'

interface ISettingsControlsProps extends PropsForConnectedComponent {
  pace: IState['settings']['pace']
  steepness: IState['settings']['steepness']
  pornList: PornList
  eventList: IState['settings']['eventList']
  duration: IState['settings']['duration']
  hypnoMode: IState['settings']['hypnoMode']
  cum: IState['settings']['cum']
  vibrator: IState['vibrator']
}

export const SettingsControls = connect(
  (state: IState) =>
    ({
      pace: state.settings.pace,
      steepness: state.settings.steepness,
      pornList: state.settings.pornList,
      eventList: state.settings.eventList,
      duration: state.settings.duration,
      hypnoMode: state.settings.hypnoMode,
      cum: state.settings.cum,
      vibrator: state.vibrator,
    } as ISettingsControlsProps),
)(function(props: ISettingsControlsProps) {
  const saveToLocalStorage = useRef(
    debounce((props: ISettingsControlsProps) => {
      localStorage.setItem('lastSession', makeSave(props))
    }, 1000),
  )
  useEffect(() => saveToLocalStorage.current(props))

  return (
    <div className="SettingsControls" tabIndex={0} role="application" aria-label="Settings">
      <PaceSetting
        max={props.pace.max}
        min={props.pace.min}
        steepness={props.steepness}
        setMax={pace => props.dispatch(SettingsActions.SetMaxPace(pace))}
        setMin={pace => props.dispatch(SettingsActions.SetMinPace(pace))}
        setSteepness={steepness => props.dispatch(SettingsActions.SetSteepness(steepness))}
      />

      <DurationSetting
        duration={props.duration}
        setDuration={newDuration => props.dispatch(SettingsActions.SetGameDuration(newDuration))}
      />

      <EventsSetting eventList={props.eventList} setEventList={newList => props.dispatch(SettingsActions.SetEventList(newList))} />

      <PornSetting pornList={props.pornList} setPornList={newList => props.dispatch(SettingsActions.SetPornList(newList))} />

      <CumSetting
        enabled={props.eventList.some(event => event === 'cum')}
        ejaculateLikelihood={props.cum.ejaculateLikelihood}
        setEjaculateLikelihood={newLikelihood => props.dispatch(SettingsActions.SetEjaculateLikelihood(newLikelihood))}
        ruinLikelihood={props.cum.ruinLikelihood}
        setRuinLikelihood={newLikelihood => props.dispatch(SettingsActions.SetRuinLikelihood(newLikelihood))}
      />

      <HypnoSetting mode={props.hypnoMode} setMode={newMode => props.dispatch(SettingsActions.SetHypnoMode(newMode))} />

      <VibratorSetting
        error={props.vibrator.error}
        vibrator={props.vibrator.vibrator}
        mode={props.vibrator.mode}
        setMode={newMode => props.dispatch(SettingsVibratorActions.SetMode(newMode))}
        onConnect={() => props.dispatch(SettingsVibratorActions.TryToPair())}
        onDisconnect={() => props.dispatch(SettingsVibratorActions.TryToUnpair())}
      />

      <SaveSetting settings={props} setSettings={settings => applyAllSettings(props.dispatch, settings)} />
    </div>
  )
})
