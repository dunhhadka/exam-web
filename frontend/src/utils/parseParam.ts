export const parseParamToString = (obj: any): string => {
  return new URLSearchParams(
    Object.entries(obj as Record<string, any>)
      .filter(([__, v]) => !!v)
      .map(([k, v]) => [k, String(v)])
  ).toString()
}
