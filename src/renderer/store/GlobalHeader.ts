import { ipcRenderer } from 'electron'
import router from '@/router'
import LocalAccount from '~/src/types/localAccount'
import { Module, MutationTree, ActionTree } from 'vuex'
import { RootState } from '@/store'

export interface GlobalHeaderState {
  accounts: Array<LocalAccount>,
  changing: boolean,
  hide: boolean
}

const state = (): GlobalHeaderState => ({
  accounts: [],
  changing: false,
  hide: false
})

export const MUTATION_TYPES = {
  UPDATE_ACCOUNTS: 'updateAccounts',
  UPDATE_CHANGING: 'updateChanging',
  CHANGE_HIDE: 'changeHide'
}

const mutations: MutationTree<GlobalHeaderState> = {
  [MUTATION_TYPES.UPDATE_ACCOUNTS]: (state: GlobalHeaderState, accounts: Array<LocalAccount>) => {
    state.accounts = accounts
  },
  [MUTATION_TYPES.UPDATE_CHANGING]: (state: GlobalHeaderState, value: boolean) => {
    state.changing = value
  },
  [MUTATION_TYPES.CHANGE_HIDE]: (state: GlobalHeaderState, value: boolean) => {
    state.hide = value
  }
}

const actions: ActionTree<GlobalHeaderState, RootState> = {
  listAccounts: ({ dispatch, commit }): Promise<Array<LocalAccount>> => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('list-accounts', 'list')
      ipcRenderer.once('error-list-accounts', (_, err: Error) => {
        ipcRenderer.removeAllListeners('response-list-accounts')
        reject(err)
      })
      ipcRenderer.once('response-list-accounts', (_, accounts: Array<LocalAccount>) => {
        ipcRenderer.removeAllListeners('error-list-accounts')
        commit(MUTATION_TYPES.UPDATE_ACCOUNTS, accounts)
        dispatch('refreshAccounts')
        resolve(accounts)
      })
    })
  },
  // Fetch account informations and save current state when GlobalHeader is displayed
  refreshAccounts: ({ commit }): Promise<Array<LocalAccount>> => {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('refresh-accounts')
      ipcRenderer.once('error-refresh-accounts', (_, err: Error) => {
        ipcRenderer.removeAllListeners('response-refresh-accounts')
        reject(err)
      })
      ipcRenderer.once('response-refresh-accounts', (_, accounts: Array<LocalAccount>) => {
        ipcRenderer.removeAllListeners('error-refresh-accounts')
        commit(MUTATION_TYPES.UPDATE_ACCOUNTS, accounts)
        resolve(accounts)
      })
    })
  },
  watchShortcutEvents: ({ state, commit, rootState, rootGetters }) => {
    ipcRenderer.on('change-account', (_, account: LocalAccount) => {
      if (state.changing) {
        return null
      }
      if (rootState.route.params.id as string === account._id!) {
        return null
      }
      // When the modal window is active, don't change account
      if (rootGetters['TimelineSpace/Modals/modalOpened']) {
        return null
      }
      // changing finish after loading
      commit(MUTATION_TYPES.UPDATE_CHANGING, true)
      router.push(`/${account._id}/home`)
      return true
    })
  },
  removeShortcutEvents: async () => {
    ipcRenderer.removeAllListeners('change-account')
    return true
  },
  loadHide: ({ commit }): Promise<boolean> => {
    return new Promise(resolve => {
      ipcRenderer.send('get-global-header')
      ipcRenderer.once('response-get-global-header', (_, hide: boolean) => {
        commit(MUTATION_TYPES.CHANGE_HIDE, hide)
        resolve(hide)
      })
    })
  },
  switchHide: ({ dispatch }, hide: boolean): Promise<boolean> => {
    return new Promise(resolve => {
      ipcRenderer.send('change-global-header', hide)
      ipcRenderer.once('response-change-global-header', () => {
        dispatch('loadHide')
        resolve(true)
      })
    })
  }
}

const GlobalHeader: Module<GlobalHeaderState, RootState> = {
  namespaced: true,
  state: state,
  mutations: mutations,
  actions: actions
}

export default GlobalHeader
