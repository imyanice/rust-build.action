import fs from 'fs'

import { context, getOctokit } from '@actions/github'
import * as path from 'node:path'

export const extensions = ['.app.tar.gz']

export function getAssetName(assetPath: string) {
  const basename = path.basename(assetPath)
  const exts = extensions.filter(s => basename.includes(s))
  const ext = exts[0] || path.extname(assetPath)
  const filename = basename.replace(ext, '')

  let arch = ''
  if (ext === '.app.tar.gz') {
    if (assetPath.includes('aarch64-apple-darwin')) {
      arch = '_aarch64'
    } else if (assetPath.includes('x86_64-apple-darwin')) {
      arch = '_x64'
    } else {
      arch = process.arch === 'arm64' ? '_aarch64' : '_x64'
    }
  }

  return `${filename}${arch}${ext}`
}

export async function uploadAssets(releaseId: number, path: string) {
  if (process.env.GITHUB_TOKEN === undefined) {
    throw new Error('GITHUB_TOKEN is required')
  }
  let owner = context.repo.owner
  let repo = context.repo.repo

  const github = getOctokit(process.env.GITHUB_TOKEN)

  const existingAssets = (
    await github.rest.repos.listReleaseAssets({
      owner: owner,
      repo: repo,
      release_id: releaseId,
      per_page: 50
    })
  ).data

  // Determine content-length for header to upload asset
  const contentLength = (filePath: string) => fs.statSync(filePath).size

  const headers = {
    'content-type': 'application/zip',
    'content-length': contentLength(path)
  }

  const assetName = getAssetName(path)

  const existingAsset = existingAssets.find(
    a => a.name === assetName.trim().replace(/ /g, '.')
  )
  if (existingAsset) {
    console.log(`Deleting existing ${assetName}...`)
    await github.rest.repos.deleteReleaseAsset({
      owner: owner,
      repo: repo,
      asset_id: existingAsset.id
    })
  }

  console.log(`Uploading ${assetName}...`)

  await github.rest.repos.uploadReleaseAsset({
    headers,
    name: assetName,
    // https://github.com/tauri-apps/tauri-action/pull/45
    //@ts-ignore error TS2322: Type 'Buffer' is not assignable to type 'string'.
    data: fs.readFileSync(path),
    owner: owner,
    repo: repo,
    release_id: releaseId
  })
}

interface Artifact {
  path: string
  arch: string
}
