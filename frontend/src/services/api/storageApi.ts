import { authenticatedApi } from './baseApi'

export interface StorageFolderInfo {
  name: string
  sizeBytes: number
  sizeFormatted: string
  fileCount: number
}

export interface StorageStatsResponse {
  totalSizeBytes: number
  totalSizeFormatted: string
  usedSizeBytes: number
  usedSizeFormatted: string
  remainingSizeBytes: number
  remainingSizeFormatted: string
  fileCount: number
  folderCount: number
  folders: StorageFolderInfo[]
}

export interface StorageFileResponse {
  name: string
  path: string
  type: 'file' | 'folder'
  sizeBytes: number
  sizeFormatted: string
  lastModified?: string
  url?: string
  children: StorageFileResponse[]
}

export interface DeleteStorageRequest {
  path: string
  recursive: boolean
}

export const storageApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getStorageStats: builder.query<StorageStatsResponse, void>({
      query: () => '/storage/stats',
      providesTags: ['Storage'],
    }),
    
    listStorageFiles: builder.query<StorageFileResponse[], string | undefined>({
      query: (path) => ({
        url: '/storage/files',
        params: path ? { path } : undefined,
      }),
      providesTags: ['Storage'],
    }),
    
    deleteStorage: builder.mutation<void, DeleteStorageRequest>({
      query: (body) => ({
        url: '/storage',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['Storage'],
    }),
  }),
  overrideExisting: false,
})

export const {
  useGetStorageStatsQuery,
  useListStorageFilesQuery,
  useDeleteStorageMutation,
} = storageApi
