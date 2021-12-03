import React from 'react'
import { GameBoard } from '../features/gameboard'
import { SettingsEntryPoint } from '../features/settings/SettingsEntryPoint/SettingsEntryPoint'
import { SettingsDialog } from '../features/settings/SettingsDialog/SettingsDialog'
import { RouteComponentProps } from '@reach/router'

export function PlayPage(props: RouteComponentProps) {
  return (
    <>
      <SettingsDialog />
      <SettingsEntryPoint />
      <GameBoard />
    </>
  )
}
