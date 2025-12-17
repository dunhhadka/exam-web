import {
  CursorResponse,
  ExamSessionStudentResponse,
  ExamStudentFilterRequest,
} from "../../types/examSessionStudent";
import { parseParamToString } from "../../utils/parseParam";
import { authenticatedApi } from "./baseApi";

export const examSessionStudentApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getExamSessionsStudents: builder.query<
      CursorResponse<ExamSessionStudentResponse>,
      ExamStudentFilterRequest
    >({
      query: (request) => ({
        url: `/session-students/filter?${parseParamToString(request)}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((item) => ({
                type: "ExamSessionStudent" as const,
                id: item.id,
              })),
              { type: "ExamSessionStudent" as const, id: "LIST" },
            ]
          : [{ type: "ExamSessionStudent" as const, id: "LIST" }],
    }),
  }),
});

export const { useGetExamSessionsStudentsQuery } = examSessionStudentApi;
