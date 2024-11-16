export interface IServerResponse<T=any> {
  status: number;
  msg: string;
  data: T;
}
