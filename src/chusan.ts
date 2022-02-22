import fs from 'fs'
import path from 'path'
import { chunithmDirectory } from './constants/chunithmDirectory'

import { createKnexInstance } from './functions/createKnexInstance'

import { processAvatarAccessory } from './modules/chusan/processAvatarAccessory'
import { processCharacter } from './modules/chusan/processCharacter'
import { processMusic } from './modules/chusan/processMusic'
import { processNameplate } from './modules/chusan/processNameplate'
import { processSystemVoice } from './modules/chusan/processSystemVoice'
import { processTrophy } from './modules/chusan/processTrophy'

import { readDDS } from './modules/chusan/readDDS'
;(async () => {
  for await (const option of chunithmDirectory.options) {
    console.log(`--- ${path.basename(option)}`)

    const [ddsItems] = await Promise.all([readDDS(option)])

    const [characters, musics, systemVoices, namePlates, trophies, avatarAccessories] =
      await Promise.all([
        processCharacter(option, ddsItems),
        processMusic(option),
        processSystemVoice(option),
        processNameplate(option),
        processTrophy(option),
        processAvatarAccessory(option),
      ])

    const knex = createKnexInstance()
    const [
      databaseChunithmMusic,
      databaseChunithmSystemVoice,
      databaseChunithmNamePlate,
      databaseChunithmTrophy,
      databaseChunithmCharcter,
      databaseChunithmAvatarAccessory,
    ] = await Promise.all([
      knex('praditnet_chunithm_music').select('*'),
      knex('praditnet_chunithm_systemVoice').select('*'),
      knex('praditnet_chunithm_namePlate').select('*'),
      knex('praditnet_chunithm_trophy').select('*'),
      knex('praditnet_chunithm_character').select('*'),
      knex('praditnet_chunithm_avatarAccessory').select('*'),
    ])

    // update database for chunithm musics
    for await (const music of musics) {
      const targetMusic = databaseChunithmMusic.find(o => o.id === music.id)

      if (!targetMusic) {
        console.log(`music:write ${music.id}`)
        await knex('praditnet_chunithm_music').insert(music)
      }
    }

    // update database for chunithm systemVoices
    for await (const systemVoice of systemVoices) {
      const targetSystemVoice = databaseChunithmSystemVoice.find(
        o => o.id === systemVoice.id
      )

      if (!targetSystemVoice) {
        console.log(`systemVoice:write ${systemVoice.id}`)
        await knex('praditnet_chunithm_systemVoice').insert(systemVoice)
      }
    }

    // update database for chunithm namePlates
    for await (const namePlate of namePlates) {
      const targetNamePlate = databaseChunithmNamePlate.find(
        o => o.id === namePlate.id
      )

      if (!targetNamePlate) {
        console.log(`namePlate:write ${namePlate.id}`)
        await knex('praditnet_chunithm_namePlate').insert(namePlate)
      }
    }

    // update database for chunithm trophies
    for await (const trophy of trophies) {
      const targetTrophy = databaseChunithmTrophy.find(o => o.id === trophy.id)

      if (!targetTrophy) {
        console.log(`trophy:write ${trophy.id}`)
        await knex('praditnet_chunithm_trophy').insert(trophy)
      }
    }

    // update database for chunithm trophies
    for await (const character of characters) {
      const targetCharacter = databaseChunithmCharcter.find(
        o => o.id === character.id
      )

      if (!targetCharacter) {
        console.log(`character:write ${character.id}`)
        await knex('praditnet_chunithm_character').insert(character)
      }
    }

    // update database for chunithm avatarAccessories
    for await (const avatarAccessory of avatarAccessories) {
      const targetAvatarAccessory = databaseChunithmAvatarAccessory.find(
        o => o.id === avatarAccessory.id
      )

      if (!targetAvatarAccessory) {
        console.log(`avatarAccessory:write ${avatarAccessory.id}`)
        await knex('praditnet_chunithm_avatarAccessory').insert(avatarAccessory)
      }
    }

    await knex.destroy()
  }
})()
