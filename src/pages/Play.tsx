import { type FunctionComponent } from 'react'
import { GameBoard } from '../features/gameboard'
import { SettingsDialog } from '../features/settings/SettingsDialog/SettingsDialog'
import { SettingsEntryPoint } from '../features/settings/SettingsEntryPoint/SettingsEntryPoint'

export const PlayPage: FunctionComponent = () => {
  return (
    <>
      <SettingsDialog />
      <SettingsEntryPoint />
      <GameBoard />
    </>
  )
}
