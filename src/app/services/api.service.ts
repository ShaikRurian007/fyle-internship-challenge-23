import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class ApiService {

  constructor(private httpClient: HttpClient) { }

  async fetchData(url: string): Promise<any>{
    return await this.httpClient.get(url).toPromise();
  }
}
