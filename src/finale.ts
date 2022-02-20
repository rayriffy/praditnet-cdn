import dotenv from 'dotenv'

import { uniq } from 'lodash'

import { createKnexInstance } from './functions/createKnexInstance'

import { readTextout } from './modules/finale/readTextout'
import { readMusic } from './modules/finale/readMusic'
import { readScore } from './modules/finale/readScore'
import { readIcon } from './modules/finale/readIcon'
import { readItem } from './modules/finale/readItem'
import { readNameplate } from './modules/finale/readNameplate'

import { processIconAssets } from './modules/finale/processIconAssets'
import { processNameplateAssets } from './modules/finale/processNameplateAssets'
import { processFrameAssets } from './modules/finale/processFrameAssets'
import { processJacketAssets } from './modules/finale/processJacketAssets'
import { processFrameMiniAssets } from './modules/finale/processFrameMiniAssets'

import { FinaleMusic } from './modules/finale/@types/database/FinaleMusic'
import { FinaleScore } from './modules/finale/@types/database/FinaleScore'
import { FinaleNameplate } from './modules/finale/@types/database/FinaleNameplate'
import { FinaleIcon } from './modules/finale/@types/database/FinaleIcon'
import { readFrame } from './modules/finale/readFrame'
import { FinaleFrame } from './modules/finale/@types/database/FinaleFrame'

dotenv.config()
;(async () => {
  /**
   * Section 1: process database
   */

  // read data
  const [textout, scores] = await Promise.all([readTextout(), readScore()])
  const [musics, items] = await Promise.all([
    readMusic(textout),
    readItem(textout),
  ])
  const [icons, nameplates, frames] = await Promise.all([
    readIcon(textout, items),
    readNameplate(textout, items),
    readFrame(textout, items),
  ])

  // read database
  const knex = createKnexInstance()
  const [
    databaseFinaleMusic,
    databaseFinaleScore,
    databaseFinaleNameplate,
    databaseFinaleIcon,
    databaseFinaleFrame,
  ] = await Promise.all([
    knex<FinaleMusic>('praditnet_finale_music').select('*'),
    knex<FinaleScore>('praditnet_finale_score').select('*'),
    knex<FinaleNameplate>('praditnet_finale_nameplate').select('*'),
    knex<FinaleIcon>('praditnet_finale_icon').select('*'),
    knex<FinaleFrame>('praditnet_finale_frame').select('*'),
  ])
  // const maimai_user_item = await knex('maimai_user_item').select('*')
  // console.log(uniq(maimai_user_item.map(o => o.item_kind)))

  // update database for finale music
  for await (const music of musics) {
    const targetMusic = databaseFinaleMusic.find(o => o.id === music.id)

    if (!targetMusic) {
      await knex<FinaleMusic>('praditnet_finale_music').insert(music)
    }
  }

  // update database for finale score
  for await (const score of scores) {
    const targetScore = databaseFinaleScore.find(o => o.id === score.id)

    if (!targetScore) {
      await knex<FinaleScore>('praditnet_finale_score').insert({
        id: score.id,
        music: score.music,
        difficulty: score.difficulty,
        level: score.level,
        isUtage: score.isUtage,
      })
    }
  }

  // update database for finale nameplate
  for await (const nameplate of nameplates) {
    const targetNameplate = databaseFinaleNameplate.find(
      o => o.id === nameplate.id
    )

    if (!targetNameplate) {
      await knex<FinaleNameplate>('praditnet_finale_nameplate').insert(
        nameplate
      )
    }
  }

  // update database for finale icons
  for await (const icon of icons) {
    const targetIcon = databaseFinaleIcon.find(o => o.id === icon.id)

    if (!targetIcon) {
      await knex<FinaleIcon>('praditnet_finale_icon').insert(icon)
    }
  }

  // update database for finale frames
  for await (const frame of frames) {
    const targetFrame = databaseFinaleFrame.find(o => o.id === frame.id)

    if (!targetFrame) {
      await knex<FinaleFrame>('praditnet_finale_frame').insert(frame)
    }
  }

  await knex.destroy()

  /**
   * Section 2: Process assets
   */
  // icons
  await Promise.all([
    processIconAssets(),
    processNameplateAssets(),
    processFrameAssets(),
    processJacketAssets(),
    processFrameMiniAssets(),
  ])
})()
