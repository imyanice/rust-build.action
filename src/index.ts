/**
 * The entrypoint for the action.
 */
import { execa } from 'execa'
import fs from 'node:fs'
import * as core from '@actions/core'
import { getInput } from '@actions/core'

try {
  execa('echo', ['args'], { stdio: 'inherit' })
  let targets = getInput("targets").split(",")
  targets.forEach((target) => {
    console.log(target)
  })
  console.log(fs.readdirSync('./'))
} catch (error) {
  // Fail the workflow run if an error occurs
  if (error instanceof Error) core.setFailed(error.message)
}
