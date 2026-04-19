import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestResponse, ResultPaginationDTO } from '../models/rest.response';

export interface CourseClass {
  id: number;
  groupName: string;
  semester: { id: number; semesterName: string; academicYear: string };
  subject: { id: number; subjectCode: string; subjectName: string; credit: number };
}

export interface CourseClassRequest {
  id?: number;
  groupName: string;
  semester: { id: number };
  subject: { id: number };
}

@Injectable({
  providedIn: 'root'
})
export class CourseClassService {
  private apiUrl = 'http://localhost:8080/course-classes';
  private http = inject(HttpClient);

  getCourseClasses(params?: { filter?: string; sort?: string; page?: number; size?: number }): Observable<RestResponse<ResultPaginationDTO<CourseClass>>> {
    let httpParams = new HttpParams();
    if (params?.filter) httpParams = httpParams.set('filter', params.filter);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    return this.http.get<RestResponse<ResultPaginationDTO<CourseClass>>>(this.apiUrl, { params: httpParams });
  }

  getCourseClassById(id: number): Observable<RestResponse<CourseClass>> {
    return this.http.get<RestResponse<CourseClass>>(`${this.apiUrl}/${id}`);
  }

  createCourseClass(data: CourseClassRequest): Observable<RestResponse<CourseClass>> {
    return this.http.post<RestResponse<CourseClass>>(this.apiUrl, data);
  }

  updateCourseClass(data: CourseClassRequest): Observable<RestResponse<CourseClass>> {
    return this.http.post<RestResponse<CourseClass>>(this.apiUrl, data);
  }

  deleteCourseClass(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
