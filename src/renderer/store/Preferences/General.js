import { ipcRenderer } from 'electron'
import Visibility from '~/src/constants/visibility'

const General = {
  namespaced: true,
  state: {
    general: {
      sound: {
        fav_rb: true,
        toot: true
      },
      tootVisibility: Visibility.Public.value
    },
    loading: false
  },
  mutations: {
    updateGeneral (state, conf) {
      state.general = conf
    },
    changeLoading (state, value) {
      state.loading = value
    }
  },
  actions: {
    loadGeneral ({ commit }) {
      return new Promise((resolve, reject) => {
        commit('changeLoading', true)
        ipcRenderer.send('get-preferences')
        ipcRenderer.once('error-get-preferences', (event, err) => {
          ipcRenderer.removeAllListeners('response-get-preferences')
          commit('changeLoading', false)
          reject(err)
        })
        ipcRenderer.once('response-get-preferences', (event, conf) => {
          ipcRenderer.removeAllListeners('error-get-preferences')
          commit('updateGeneral', conf.general)
          commit('changeLoading', false)
          resolve(conf)
        })
      })
    },
    updateTootVisibility ({ dispatch, commit, state }, value) {
      const newGeneral = Object.assign({}, state.general, {
        tootVisibility: value
      })
      const config = {
        general: newGeneral
      }
      ipcRenderer.send('update-preferences', config)
      ipcRenderer.once('error-update-preferences', (event, err) => {
        ipcRenderer.removeAllListeners('response-update-preferences')
      })
      ipcRenderer.once('response-update-preferences', (event, conf) => {
        ipcRenderer.removeAllListeners('error-update-preferences')
        dispatch('App/loadPreferences', null, { root: true })
        commit('updateGeneral', conf.general)
      })
    },
    updateSound ({ commit, state }, sound) {
      commit('changeLoading', true)
      const newSound = Object.assign({}, state.general.sound, sound)
      const newGeneral = Object.assign({}, state.general, {
        sound: newSound
      })
      const config = {
        general: newGeneral
      }
      ipcRenderer.send('update-preferences', config)
      ipcRenderer.once('error-update-preferences', (event, err) => {
        ipcRenderer.removeAllListeners('response-update-preferences')
        commit('changeLoading', false)
      })
      ipcRenderer.once('response-update-preferences', (event, conf) => {
        ipcRenderer.removeAllListeners('error-update-preferences')
        commit('updateGeneral', conf.general)
        commit('changeLoading', false)
      })
    }
  }
}

export default General
