import { GameBoard } from '../features/gameboard'
import { SettingsEntryPoint } from '../features/settings/SettingsEntryPoint/SettingsEntryPoint'
import { SettingsDialog } from '../features/settings/SettingsDialog/SettingsDialog'

export function PlayPage() {
  return (
    <>
      <SettingsDialog />
      <SettingsEntryPoint />
      <GameBoard />
    </>
  )
}
