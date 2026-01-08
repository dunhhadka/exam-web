export type ProctoringSignalingClient = {
  send: (msg: any) => void
  close?: () => void
} | null

let client: ProctoringSignalingClient = null

export const setProctoringSignalingClient = (next: ProctoringSignalingClient) => {
  client = next
}

export const getProctoringSignalingClient = () => client
