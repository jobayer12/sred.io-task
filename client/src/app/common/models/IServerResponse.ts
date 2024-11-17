export interface IServerResponse<T=any> {
  status: number;
  error: string;
  data: T;
}
