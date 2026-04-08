import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Student } from '../models/student';
import { RestResponse, ResultPaginationDTO, ResUploadFileDTO } from '../models/rest.response';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = 'http://localhost:8080/students';
  private http = inject(HttpClient);

  getStudents(params?: { filter?: string; sort?: string; page?: number; size?: number }): Observable<RestResponse<ResultPaginationDTO<Student>>> {
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
    return this.http.get<RestResponse<ResultPaginationDTO<Student>>>(this.apiUrl, { params: httpParams });
  }

  getStudent(id: number): Observable<RestResponse<Student>> {
    return this.http.get<RestResponse<Student>>(`${this.apiUrl}/${id}`);
  }

  createStudent(student: Student): Observable<RestResponse<Student>> {
    return this.http.post<RestResponse<Student>>(this.apiUrl, student);
  }

  updateStudent(id: number, student: Student): Observable<RestResponse<Student>> {
    return this.http.put<RestResponse<Student>>(`${this.apiUrl}/${id}`, student);
  }

  deleteStudent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadFile(file: File, folder: string): Observable<RestResponse<ResUploadFileDTO>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    return this.http.post<RestResponse<ResUploadFileDTO>>(`http://localhost:8080/files`, formData);
  }
}
