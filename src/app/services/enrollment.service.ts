import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RestResponse } from '../models/rest.response';

export interface EnrollmentStudent {
  id: number;
  enrollmentAt: string | null;
  student: {
    id: number;
    studentCode: string;
    name?: string;
    email?: string;
    className?: string;
  };
  courseClass: {
    id: number;
    groupName: string;
  };
}

export interface EnrollmentCreateRequest {
  student: { id: number };
  courseClass: { id: number };
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private apiUrl = 'http://localhost:8080/enrollments';
  private http = inject(HttpClient);

  getStudentsByCourseClass(courseClassId: number): Observable<RestResponse<EnrollmentStudent[]>> {
    return this.http.get<RestResponse<EnrollmentStudent[]>>(`${this.apiUrl}/course-classes/${courseClassId}/students`);
  }

  createEnrollment(payload: EnrollmentCreateRequest): Observable<RestResponse<EnrollmentStudent>> {
    return this.http.post<RestResponse<EnrollmentStudent>>(this.apiUrl, payload);
  }

  deleteEnrollment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
