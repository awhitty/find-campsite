import axios, { AxiosResponse } from 'axios';
import * as fakeUa from 'fake-useragent';

export async function makeGetRequest<T>(url: string): Promise<AxiosResponse<T>> {
  return await axios.get<T>(url, {
    headers: {
      'User-Agent': fakeUa(),
    },
  });
}

export async function makePostRequest<T>(url: string, data: unknown): Promise<AxiosResponse<T>> {
  return await axios.post<T>(url, data, {
    headers: {
      'User-Agent': fakeUa(),
    },
  });
}
