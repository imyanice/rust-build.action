/**
 * The entrypoint for the action.
 */
import { execa } from 'execa'
import fs from 'node:fs'
import * as core from '@actions/core'
import { getInput } from '@actions/core'
import * as toml from 'toml'
import { tgz } from 'compressing'
import { createRelease } from './createRelease.js'
import { uploadAssets } from './uploadAssets.js'
import * as path from 'node:path'
import compressDir = tgz.compressDir

class BuildOptions {
  public category:
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
  public icon: string
  public identifier: string
  public copyright: string
  public displayName: string

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
  let tomlData: any
  let srcDir =
    (getInput('srcDir').startsWith('./')
      ? getInput('srcDir')
      : './' + getInput('srcDir')) +
    (getInput('srcDir').endsWith('/') ? '' : '/')

  fs.readFile(srcDir + 'Cargo.toml', 'utf-8', (err, data) => {
    if (err) core.setFailed(err.message)
    tomlData = JSON.parse(JSON.stringify(toml.parse(data)))
    let packageName = tomlData.package.name
    if (packageName == undefined)
      core.setFailed('Could not find your package name in your Cargo.toml.')
    let buildOptions = new BuildOptions(tomlData['rust-build-macos'])
    if (buildOptions == undefined) core.setFailed('Invalid toml data!')
    console.log(buildOptions)
    console.log(tomlData)
    if (targets === null || getInput('targets') !== 'aarch64-apple-darwin')
      core.setFailed('Please specify correct targets!')
    if (targets)
      createRelease(tomlData.package.version).then(release => {
        targets.forEach(target => {
          switch (target) {
            case 'aarch64-apple-darwin': {
              fs.mkdir(
                './bundles/aarch64-apple-darwin/' +
                  buildOptions.displayName +
                  '.app/Contents/MacOS/',
                { recursive: true },
                err => {
                  if (err) core.setFailed(err.message)
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
                  let iconPath =
                    srcDir +
                    (buildOptions.icon.startsWith('./')
                      ? buildOptions.icon.replace('./', '')
                      : buildOptions.icon)
                  console.log(iconPath)
                  console.log(path.extname(iconPath))
                  if (
                    path.extname(iconPath) == '' ||
                    (path.extname(iconPath) !== '.png' &&
                      path.extname(iconPath) !== '.icns')
                  )
                    core.setFailed('Invalid icon!')
                  fs.copyFile(
                    iconPath,
                    './bundles/aarch64-apple-darwin/' +
                      buildOptions.displayName +
                      '.app/Contents/Resources/' +
                      buildOptions.icon.includes('/')
                      ? // @ts-ignore the array will never be undefined because it contains a "/"
                        iconPath.split('/').pop().toString()
                      : buildOptions.icon,
                    err1 => {
                      if (err1) core.setFailed(err1.message)
                    }
                  )
                  fs.writeFile(
                    './bundles/aarch64-apple-darwin/' +
                      buildOptions.displayName +
                      '.app/Contents/Info.plist',
                    getInfoPlist(
                      buildOptions,
                      packageName,
                      tomlData.package.version
                    ),
                    err2 => {
                      if (err2) core.setFailed(err2.message)
                    }
                  )
                  setTimeout(() => {
                    compressDir(
                      './bundles/aarch64-apple-darwin/' +
                        buildOptions.displayName +
                        '.app',
                      './bundles/aarch64-apple-darwin/' +
                        buildOptions.displayName +
                        '.app.tar.gz'
                    ).then(() => {
                      uploadAssets(
                        release.id,
                        './bundles/aarch64-apple-darwin/' +
                          buildOptions.displayName +
                          '.app.tar.gz'
                      )
                    })
                  }, 1000)
                }
              )
            }
          }
        })
      })

    console.log(fs.readdirSync('./'))
  })
} catch (error) {
  // Fail the workflow run if an error occurs
  if (error instanceof Error) core.setFailed(error.message)
}

function getInfoPlist(
  buildOptions: BuildOptions,
  packageName: string,
  version: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>CFBundleDevelopmentRegion</key>
        <string>English</string>
        <key>CFBundleDisplayName</key>
        <string>${buildOptions.displayName}</string>
        <key>CFBundleIconFile</key>
        <string>icon.png</string>
        <key>CFBundleExecutable</key>
        <string>${packageName}</string>
        <key>CFBundleIdentifier</key>
        <string>${buildOptions.identifier}</string>
        <key>CFBundleInfoDictionaryVersion</key>
        <string>6.0</string>
        <key>CFBundleName</key>
        <string>${buildOptions.identifier}</string>
        <key>CFBundlePackageType</key>
        <string>APPL</string>
        <key>CFBundleShortVersionString</key>
        <string>${version}</string>
        <key>CFBundleVersion</key>
        <string>20240330.144746</string>
        <key>CSResourcesFileMapped</key>
        <true/>
        <key>LSApplicationCategoryType</key>
        <string>${buildOptions.category}</string>
        <key>LSMinimumSystemVersion</key>
        <string>10.13</string>
        <key>LSRequiresCarbon</key>
        <true/>
        <key>NSHighResolutionCapable</key>
        <true/>
        <key>NSHumanReadableCopyright</key>
        <string>${buildOptions.copyright}</string>
    </dict>
</plist>`
}
