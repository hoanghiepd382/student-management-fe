import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subject, RestResponse, ResultPaginationDTO, GradeCompositionDTO } from '../models/rest.response';

export interface GradeCompositionPayload {
  id?: number;
  gradeItemName: string;
  weight: number;
  subject: {
    id: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = 'http://localhost:8080/subjects';
  private gradeCompositionApiUrl = 'http://localhost:8080/grade-compositions';
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

  getGradeCompositionsBySubject(subjectId: number): Observable<RestResponse<GradeCompositionDTO[]>> {
    return this.http.get<RestResponse<GradeCompositionDTO[]>>(`${this.apiUrl}/${subjectId}/grade-compositions`);
  }

  saveGradeComposition(payload: GradeCompositionPayload): Observable<RestResponse<GradeCompositionDTO>> {
    return this.http.post<RestResponse<GradeCompositionDTO>>(this.gradeCompositionApiUrl, payload);
  }

  deleteGradeComposition(id: number): Observable<void> {
    return this.http.delete<void>(`${this.gradeCompositionApiUrl}/${id}`);
  }
}
