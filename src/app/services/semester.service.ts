import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Semester, RestResponse, ResultPaginationDTO } from '../models/rest.response';

@Injectable({
  providedIn: 'root'
})
export class SemesterService {
  private apiUrl = 'http://localhost:8080/semesters';
  private http = inject(HttpClient);

  getSemesters(params?: { filter?: string; sort?: string; page?: number; size?: number }): Observable<RestResponse<ResultPaginationDTO<Semester>>> {
    let httpParams = new HttpParams();
    if (params?.filter) {
      httpParams = httpParams.set('filter', params.filter);
    }
    if (params?.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params?.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.size !== undefined) {
      httpParams = httpParams.set('size', params.size.toString());
    }
    return this.http.get<RestResponse<ResultPaginationDTO<Semester>>>(this.apiUrl, { params: httpParams });
  }

  getSemesterById(id: number): Observable<RestResponse<Semester>> {
    return this.http.get<RestResponse<Semester>>(`${this.apiUrl}/${id}`);
  }

  createSemester(semester: Partial<Semester>): Observable<RestResponse<Semester>> {
    return this.http.post<RestResponse<Semester>>(this.apiUrl, semester);
  }

  updateSemester(semester: Semester): Observable<RestResponse<Semester>> {
    return this.http.post<RestResponse<Semester>>(this.apiUrl, semester);
  }

  deleteSemester(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
