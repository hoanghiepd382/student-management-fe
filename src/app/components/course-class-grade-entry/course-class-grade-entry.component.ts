import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseClass, CourseClassService } from '../../services/course-class.service';
import { EnrollmentService, EnrollmentStudent } from '../../services/enrollment.service';
import { SubjectService } from '../../services/subject.service';
import { GradeService } from '../../services/grade.service';
import { GradeCompositionDTO, GradeBatchRequestDTO } from '../../models/rest.response';

@Component({
  selector: 'app-course-class-grade-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './course-class-grade-entry.component.html',
  styleUrls: ['./course-class-grade-entry.component.css']
})
export class CourseClassGradeEntryComponent implements OnInit {
  courseClassId!: number;
  courseClass: CourseClass | null = null;

  enrollments: EnrollmentStudent[] = [];
  gradeCompositions: GradeCompositionDTO[] = [];

  loadingCourseClass = false;
  loadingEnrollments = false;
  loadingCompositions = false;
  loadingExistingGrades = false;

  rowSavingStudentIds = new Set<number>();
  rowSavedStudentIds = new Set<number>();

  gradeInputs: Record<number, Record<number, string>> = {};
  errorMessage: string | null = null;

  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private courseClassService = inject(CourseClassService);
  private enrollmentService = inject(EnrollmentService);
  private subjectService = inject(SubjectService);
  private gradeService = inject(GradeService);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id || Number.isNaN(id)) {
        this.errorMessage = 'ID lớp học phần không hợp lệ.';
        this.cdr.detectChanges();
        return;
      }

      this.courseClassId = id;
      this.loadData();
    });
  }

  loadData(): void {
    this.errorMessage = null;
    this.loadCourseClassAndCompositions();
    this.loadEnrollments();
  }

  loadCourseClassAndCompositions(): void {
    this.loadingCourseClass = true;
    this.loadingCompositions = true;

    this.courseClassService.getCourseClassById(this.courseClassId).subscribe({
      next: (res) => {
        this.courseClass = res?.data ?? null;
        this.loadingCourseClass = false;

        const subjectId = this.courseClass?.subject?.id;
        if (!subjectId) {
          this.loadingCompositions = false;
          this.errorMessage = 'Không lấy được môn học của lớp học phần.';
          this.cdr.detectChanges();
          return;
        }

        this.subjectService.getGradeCompositionsBySubject(subjectId).subscribe({
          next: (gradeRes) => {
            this.gradeCompositions = gradeRes?.data ?? [];
            this.loadingCompositions = false;
            this.initializeInputMatrix();
            this.prefillExistingGrades();
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.loadingCompositions = false;
            this.errorMessage = this.getBackendErrorMessage(err);
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        this.loadingCourseClass = false;
        this.loadingCompositions = false;
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
        this.initializeInputMatrix();
        this.prefillExistingGrades();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingEnrollments = false;
        this.errorMessage = this.getBackendErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  saveStudentGrades(enrollment: EnrollmentStudent): void {
    const studentId = enrollment.student.id;
    if (this.rowSavingStudentIds.has(studentId)) {
      return;
    }

    const payload = this.buildPayload(studentId);
    if (!payload) {
      return;
    }

    this.errorMessage = null;
    this.rowSavingStudentIds.add(studentId);
    this.rowSavedStudentIds.delete(studentId);

    this.gradeService.saveBatch(payload).subscribe({
      next: () => {
        this.rowSavingStudentIds.delete(studentId);
        this.rowSavedStudentIds.add(studentId);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.rowSavingStudentIds.delete(studentId);
        this.errorMessage = this.getBackendErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  getInputValue(studentId: number, compositionId: number): string {
    return this.gradeInputs[studentId]?.[compositionId] ?? '';
  }

  setInputValue(studentId: number, compositionId: number, value: string): void {
    this.ensureStudentRow(studentId);
    this.gradeInputs[studentId][compositionId] = value;
    this.rowSavedStudentIds.delete(studentId);
  }

  getCourseClassTitle(): string {
    if (!this.courseClass) {
      return `Lớp học phần #${this.courseClassId}`;
    }
    return `${this.courseClass.subject.subjectName} - Nhóm ${this.courseClass.groupName}`;
  }

  isLoadingAny(): boolean {
    return this.loadingCourseClass || this.loadingEnrollments || this.loadingCompositions || this.loadingExistingGrades;
  }

  private initializeInputMatrix(): void {
    if (this.enrollments.length === 0 || this.gradeCompositions.length === 0) {
      return;
    }

    this.enrollments.forEach((item) => {
      const studentId = item.student.id;
      this.ensureStudentRow(studentId);
      this.gradeCompositions.forEach((composition) => {
        if (this.gradeInputs[studentId][composition.id] === undefined) {
          this.gradeInputs[studentId][composition.id] = '';
        }
      });
    });
  }

  private prefillExistingGrades(): void {
    if (this.enrollments.length === 0 || this.gradeCompositions.length === 0) {
      return;
    }

    this.loadingExistingGrades = true;
    let pending = this.enrollments.length;

    this.enrollments.forEach((item) => {
      const studentId = item.student.id;
      this.gradeService.getByStudentAndCourseClass(this.courseClassId, studentId).subscribe({
        next: (res) => {
          const grades = res?.data ?? [];
          grades.forEach((grade) => {
            this.ensureStudentRow(studentId);
            this.gradeInputs[studentId][grade.gradeCompositionId] = grade.score.toString();
          });
          pending--;
          if (pending === 0) {
            this.loadingExistingGrades = false;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          pending--;
          if (pending === 0) {
            this.loadingExistingGrades = false;
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  private buildPayload(studentId: number): GradeBatchRequestDTO | null {
    if (this.gradeCompositions.length === 0) {
      this.errorMessage = 'Môn học chưa có cấu hình đầu điểm.';
      this.cdr.detectChanges();
      return null;
    }

    const scores = [];
    for (const composition of this.gradeCompositions) {
      const rawValue = this.gradeInputs[studentId]?.[composition.id];
      if (rawValue === undefined || rawValue === null || rawValue.toString().trim() === '') {
        this.errorMessage = `Vui lòng nhập đầy đủ điểm cho sinh viên có ID = ${studentId}.`;
        this.cdr.detectChanges();
        return null;
      }

      const score = Number(rawValue);
      if (Number.isNaN(score) || score < 0 || score > 10) {
        this.errorMessage = `Điểm phải trong khoảng 0-10 (sinh viên ID = ${studentId}).`;
        this.cdr.detectChanges();
        return null;
      }

      scores.push({
        gradeCompositionId: composition.id,
        score
      });
    }

    return {
      courseClassId: this.courseClassId,
      studentId,
      scores
    };
  }

  private ensureStudentRow(studentId: number): void {
    if (!this.gradeInputs[studentId]) {
      this.gradeInputs[studentId] = {};
    }
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
