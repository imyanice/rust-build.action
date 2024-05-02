/**
 * The entrypoint for the action.
 */
import { execa } from 'execa'
import fs from 'node:fs'
import * as core from '@actions/core'
import { getInput } from '@actions/core'
import * as toml from 'toml'

interface BuildOptions {
  identifier: string
  category:
    | 'public.app-category.business'
    | 'public.app-category.developer-tools'
    | 'public.app-category.education'
    | 'public.app-category.entertainment'
    | 'public.app-category.finance'
    | 'public.app-category.games'
    | 'public.app-category.action-games'
    | 'public.app-category.adventure-games'
    | 'public.app-category.arcade-games'
    | 'public.app-category.board-games'
    | 'public.app-category.card-games'
    | 'public.app-category.casino-games'
    | 'public.app-category.dice-games'
    | 'public.app-category.educational-games'
    | 'public.app-category.family-games'
    | 'public.app-category.kids-games'
    | 'public.app-category.music-games'
    | 'public.app-category.puzzle-games'
    | 'public.app-category.racing-games'
    | 'public.app-category.role-playing-games'
    | 'public.app-category.simulation-games'
    | 'public.app-category.sports-games'
    | 'public.app-category.strategy-games'
    | 'public.app-category.trivia-games'
    | 'public.app-category.word-games'
    | 'public.app-category.graphics-design'
    | 'public.app-category.healthcare-fitness'
    | 'public.app-category.lifestyle'
    | 'public.app-category.medical'
    | 'public.app-category.music'
    | 'public.app-category.news'
    | 'public.app-category.photography'
    | 'public.app-category.productivity'
    | 'public.app-category.reference'
    | 'public.app-category.social-networking'
    | 'public.app-category.sports'
    | 'public.app-category.travel'
    | 'public.app-category.utilities'
    | 'public.app-category.video'
    | 'public.app-category.weather'
  copyright: string
  icon: string[]
  displayName: string
}

class BuildOptions {
  constructor(parseElement: any) {
    this.category = parseElement.category
    this.icon = parseElement.icon
    this.identifier = parseElement.identifier
    this.copyright = parseElement.copyright
    this.displayName = parseElement.displayName
  }
}

try {
  execa('echo', ['args'], { stdio: 'inherit' })
  let targets = getInput('targets').split(',')
  let tomlData: string
  let srcDir =
    (getInput('srcDir').startsWith('./')
      ? getInput('srcDir')
      : './' + getInput('srcDir')) +
    (getInput('srcDir').endsWith('/') ? '' : '/')
  fs.readFile(srcDir + 'Cargo.toml', 'utf-8', (err, data) => {
    if (err) core.setFailed(err.message)
    tomlData = data
    let packageName = JSON.parse(JSON.stringify(toml.parse(tomlData))).package
      .name
    if (packageName == undefined)
      core.setFailed('Could not find your package name in your Cargo.toml.')
    let buildOptions = new BuildOptions(
      JSON.parse(JSON.stringify(toml.parse(tomlData)))['rust-build-macos']
    )
    if (buildOptions == undefined) core.setFailed('Invalid toml data!')

    targets.forEach(target => {
      switch (target) {
        case 'aarch64-apple-darwin': {
          fs.copyFile(
            srcDir + 'target/aarch64-apple-darwin/debug/' + packageName,
            './bundles/aarch64-apple-darwin/' +
              buildOptions.displayName +
              '.app/Contents/MacOS/' +
              packageName,
            err1 => {
              if (err1) core.setFailed(err1.message)
            }
          )
        }
      }
    })
    console.log(fs.readdirSync('./'))
  })
} catch (error) {
  // Fail the workflow run if an error occurs
  if (error instanceof Error) core.setFailed(error.message)
}
