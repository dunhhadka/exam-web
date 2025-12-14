import { parse } from "path";
import { CursorResponse } from "../../types/examSessionStudent";
import {
  Notification,
  NotificationRequest,
  NotificationStatistic,
} from "../../types/notification";
import { authenticatedApi } from "./baseApi";
import { parseParamToString } from "../../utils/parseParam";
import { statistic } from "antd/es/theme/internal";

export const notificationApi = authenticatedApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      { data: CursorResponse<Notification>; statistic: NotificationStatistic },
      NotificationRequest
    >({
      queryFn: async (request, api, extraOptions, baseQuery) => {
        const [cursorResponse, statisticResponse] = await Promise.all([
          baseQuery({
            url: `/notifications?${parseParamToString(request)}`,
            method: "GET",
          }),
          baseQuery({
            url: `/notifications/statistic`,
            method: "GET",
          }),
        ]);

        return {
          data: {
            data: cursorResponse.data as CursorResponse<Notification>,
            statistic: statisticResponse.data as NotificationStatistic,
          },
        };
      },
      providesTags: (result) =>
        result
          ? [
              ...result.data?.data.map((item) => ({
                type: "Notification" as const,
                id: item.id,
              })),
              { type: "Notification" as const, id: "LIST" },
            ]
          : [{ type: "Notification" as const, id: "LIST" }],
    }),

    markRead: builder.mutation<void, { id: number }>({
      query: (data) => ({
        url: `/notifications/${data.id}/read`,
        method: "PUT",
      }),
      invalidatesTags(result, error, arg, meta) {
        return [
          { id: arg.id, type: "Notification" },
          { type: "Notification", id: "STATISTIC" },
        ];
      },
    }),

    deleteNotification: builder.mutation<void, { id: number }>({
      query: (data) => ({
        url: `/notifications/${data.id}`,
        method: "DELETE",
      }),
      invalidatesTags(result, error, arg, meta) {
        return [
          { id: arg.id, type: "Notification" },
          { type: "Notification", id: "STATISTIC" },
        ];
      },
    }),

    markAllRead: builder.mutation<void, void>({
      query: () => ({
        url: `/notifications/read-all`,
        method: "PUT",
      }),
      invalidatesTags: [
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "STATISTIC" },
      ],
    }),

    statistic: builder.query<NotificationStatistic, void>({
      query: () => ({
        url: `/notifications/statistic`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [{ type: "Notification" as const, id: "STATISTIC" }]
          : [{ type: "Notification" as const, id: "STATISTIC" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useDeleteNotificationMutation,
  useMarkAllReadMutation,
  useStatisticQuery,
} = notificationApi;
