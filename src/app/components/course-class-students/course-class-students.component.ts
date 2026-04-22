import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Student } from '../../models/student';
import { StudentService } from '../../services/student.service';
import { CourseClass, CourseClassService } from '../../services/course-class.service';
import { EnrollmentService, EnrollmentStudent } from '../../services/enrollment.service';

@Component({
  selector: 'app-course-class-students',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './course-class-students.component.html',
  styleUrls: ['./course-class-students.component.css']
})
export class CourseClassStudentsComponent implements OnInit {
  courseClassId!: number;
  courseClass: CourseClass | null = null;

  enrollments: EnrollmentStudent[] = [];
  loadingEnrollments = false;
  loadingCourseClass = false;

  searchBy: 'studentCode' | 'name' | 'email' = 'studentCode';
  searchKeyword = '';
  searchResults: Student[] = [];
  searchingStudents = false;

  addingStudentIds = new Set<number>();
  deletingEnrollmentIds = new Set<number>();

  errorMessage: string | null = null;

  private route = inject(ActivatedRoute);
  private courseClassService = inject(CourseClassService);
  private studentService = inject(StudentService);
  private enrollmentService = inject(EnrollmentService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id || Number.isNaN(id)) {
        this.errorMessage = 'ID lớp học phần không hợp lệ.';
        this.cdr.detectChanges();
        return;
      }

      this.courseClassId = id;
      this.loadCourseClass();
      this.loadEnrollments();
    });
  }

  loadCourseClass(): void {
    this.loadingCourseClass = true;
    this.courseClassService.getCourseClassById(this.courseClassId).subscribe({
      next: (res) => {
        this.courseClass = res?.data ?? null;
        this.loadingCourseClass = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingCourseClass = false;
        this.errorMessage = this.getBackendErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  loadEnrollments(): void {
    this.loadingEnrollments = true;
    this.enrollmentService.getStudentsByCourseClass(this.courseClassId).subscribe({
      next: (res) => {
        this.enrollments = res?.data ?? [];
        this.loadingEnrollments = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingEnrollments = false;
        this.errorMessage = this.getBackendErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  searchStudents(): void {
    const keyword = this.searchKeyword.trim();
    if (!keyword) {
      this.searchResults = [];
      this.cdr.detectChanges();
      return;
    }

    this.searchingStudents = true;
    const escapedKeyword = keyword.replace(/'/g, "''");
    const filter = `${this.searchBy} ~~ '${escapedKeyword}'`;

    this.studentService.getStudents({
      filter,
      sort: 'studentCode,asc',
      page: 1,
      size: 50
    }).subscribe({
      next: (res) => {
        this.searchingStudents = false;
        this.searchResults = res?.data?.result ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.searchingStudents = false;
        this.errorMessage = this.getBackendErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  addStudent(student: Student): void {
    if (!student.id || this.addingStudentIds.has(student.id)) {
      return;
    }

    this.errorMessage = null;
    this.addingStudentIds.add(student.id);

    this.enrollmentService.createEnrollment({
      student: { id: student.id },
      courseClass: { id: this.courseClassId }
    }).subscribe({
      next: () => {
        this.addingStudentIds.delete(student.id!);
        this.loadEnrollments();
        this.searchResults = this.searchResults.filter((s) => s.id !== student.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.addingStudentIds.delete(student.id!);
        this.errorMessage = this.getBackendErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  removeEnrollment(enrollment: EnrollmentStudent): void {
    if (this.deletingEnrollmentIds.has(enrollment.id)) {
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa sinh viên ${enrollment.student.studentCode} khỏi lớp học phần này?`)) {
      return;
    }

    this.errorMessage = null;
    this.deletingEnrollmentIds.add(enrollment.id);

    this.enrollmentService.deleteEnrollment(enrollment.id).subscribe({
      next: () => {
        this.deletingEnrollmentIds.delete(enrollment.id);
        this.enrollments = this.enrollments.filter((item) => item.id !== enrollment.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deletingEnrollmentIds.delete(enrollment.id);
        this.errorMessage = this.getBackendErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  isStudentEnrolled(studentId?: number): boolean {
    if (!studentId) {
      return false;
    }
    return this.enrollments.some((item) => item.student.id === studentId);
  }

  getCourseClassTitle(): string {
    if (!this.courseClass) {
      return `Lớp học phần #${this.courseClassId}`;
    }

    return `${this.courseClass.subject.subjectName} - Nhóm ${this.courseClass.groupName}`;
  }

  getSearchPlaceholder(): string {
    if (this.searchBy === 'email') return 'Nhập email sinh viên...';
    if (this.searchBy === 'name') return 'Nhập họ tên sinh viên...';
    return 'Nhập mã sinh viên...';
  }

  private getBackendErrorMessage(err: any): string {
    const message = err?.error?.message;
    if (Array.isArray(message) && message.length > 0) {
      return message.join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    const fallback = err?.error?.error ?? err?.message;
    if (typeof fallback === 'string' && fallback.trim()) {
      return fallback;
    }

    return 'Có lỗi xảy ra. Vui lòng thử lại.';
  }
}
