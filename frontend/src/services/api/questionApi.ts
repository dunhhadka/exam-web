import {
  Question,
  QuestionFilterRequest,
  QuestionRequestSubmit,
  Tag,
  TagRequest,
  TagSearchRequest,
} from "../../types/question";
import { parseParamToString } from "../../utils/parseParam";
import { authenticatedApi } from "./baseApi";

export const questionApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    submitPublish: builder.mutation<Question, QuestionRequestSubmit>({
      query: (request) => ({
        url: "/question/publish",
        method: "POST",
        body: request,
      }),
    }),
    searchQuestion: builder.query<any, QuestionFilterRequest>({
      query: (request) => {
        return {
          url: `/question/filter?${parseParamToString(request)}`,
          method: "GET",
        };
      },
    }),
    searchTags: builder.query<any, TagSearchRequest>({
      query: (request) => ({
        url: `/tag/search?${parseParamToString(request)}`,
        method: "GET",
      }),
      providesTags(result, error, arg, meta) {
        return !result?.data
          ? [{ type: "Tag", id: "LIST" }]
          : [
              ...result?.data.map((item: Tag) => ({ type: "Tag", id: item.id })),
              { type: "Tag", id: "LIST" },
            ];
      },
    }),
    createTag: builder.mutation<Tag, TagRequest>({
      query: (request) => ({
        url: "/tag/create",
        method: "POST",
        body: request,
      }),
      invalidatesTags: [{ type: "Tag", id: "LIST" }],
    }),
  }),
});

export const {
  useSubmitPublishMutation,
  useSearchQuestionQuery,
  useSearchTagsQuery,
  useCreateTagMutation
} = questionApi;
