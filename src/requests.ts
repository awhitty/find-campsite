import axios from "axios";
import * as fakeUa from "fake-useragent";

export async function makeGetRequest(url: string) {
  return await axios.get(url, {
    headers: {
      "User-Agent": fakeUa(),
    },
  });
}

export async function makePostRequest<T>(url: string, data: any) {
  return await axios.post<T>(url, data, {
    headers: {
      "User-Agent": fakeUa(),
    },
  });
}
