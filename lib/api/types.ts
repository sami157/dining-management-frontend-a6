export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  meta: unknown;
  data: T;
};

export type ApiErrorSource = {
  path: string;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errorSources?: ApiErrorSource[];
  stack?: string | null;
};
