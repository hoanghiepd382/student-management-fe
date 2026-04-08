export interface RestResponse<T> {
  statusCode: number;
  message: string | string[];
  error: string | null;
  data: T;
}

export interface Meta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface ResultPaginationDTO<T> {
  meta: Meta;
  result: T[];
}

export interface ResUploadFileDTO {
  fileName: string;
  uploadedAt: string;
}
