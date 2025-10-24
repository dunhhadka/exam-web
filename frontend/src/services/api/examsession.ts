import { authenticatedApi } from "./baseApi";

export const examSessionApi = authenticatedApi.injectEndpoints({
    endpoints: builder => ({})
})