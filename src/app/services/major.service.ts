import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Major, RestResponse, ResultPaginationDTO } from '../models/rest.response';

@Injectable({
  providedIn: 'root'
})
export class MajorService {
  private apiUrl = 'http://localhost:8080/majors';
  private http = inject(HttpClient);

  getMajors(params?: { filter?: string; sort?: string; page?: number; size?: number }): Observable<RestResponse<ResultPaginationDTO<Major>>> {
    let httpParams = new HttpParams();
    if (params?.filter) httpParams = httpParams.set('filter', params.filter);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    return this.http.get<RestResponse<ResultPaginationDTO<Major>>>(this.apiUrl, { params: httpParams });
  }

  getMajorById(id: number): Observable<RestResponse<Major>> {
    return this.http.get<RestResponse<Major>>(`${this.apiUrl}/${id}`);
  }

  createMajor(major: Partial<Major>): Observable<RestResponse<Major>> {
    return this.http.post<RestResponse<Major>>(this.apiUrl, major);
  }

  updateMajor(major: Major): Observable<RestResponse<Major>> {
    return this.http.post<RestResponse<Major>>(this.apiUrl, major);
  }

  deleteMajor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

