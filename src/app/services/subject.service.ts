import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subject, RestResponse, ResultPaginationDTO } from '../models/rest.response';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = 'http://localhost:8080/subjects';
  private http = inject(HttpClient);

  getSubjects(params?: { filter?: string; sort?: string; page?: number; size?: number }): Observable<RestResponse<ResultPaginationDTO<Subject>>> {
    let httpParams = new HttpParams();
    if (params?.filter) httpParams = httpParams.set('filter', params.filter);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    return this.http.get<RestResponse<ResultPaginationDTO<Subject>>>(this.apiUrl, { params: httpParams });
  }

  getSubjectById(id: number): Observable<RestResponse<Subject>> {
    return this.http.get<RestResponse<Subject>>(`${this.apiUrl}/${id}`);
  }

  createSubject(subject: Partial<Subject>): Observable<RestResponse<Subject>> {
    return this.http.post<RestResponse<Subject>>(this.apiUrl, subject);
  }

  updateSubject(subject: Subject): Observable<RestResponse<Subject>> {
    return this.http.post<RestResponse<Subject>>(this.apiUrl, subject);
  }

  deleteSubject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
