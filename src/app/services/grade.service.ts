import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestResponse, GradeBatchRequestDTO, GradeBatchResDTO, GradeEntryDetailDTO } from '../models/rest.response';

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private apiUrl = 'http://localhost:8080/grades';
  private http = inject(HttpClient);

  saveBatch(payload: GradeBatchRequestDTO): Observable<RestResponse<GradeBatchResDTO>> {
    return this.http.post<RestResponse<GradeBatchResDTO>>(`${this.apiUrl}/batch`, payload);
  }

  getByStudentAndCourseClass(courseClassId: number, studentId: number): Observable<RestResponse<GradeEntryDetailDTO[]>> {
    return this.http.get<RestResponse<GradeEntryDetailDTO[]>>(`${this.apiUrl}/course-classes/${courseClassId}/students/${studentId}`);
  }
}
