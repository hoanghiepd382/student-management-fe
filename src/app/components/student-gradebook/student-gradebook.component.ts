import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StudentService } from '../../services/student.service';
import { SubjectService } from '../../services/subject.service';
import { GradeService } from '../../services/grade.service';
import { Student } from '../../models/student';
import { Semester, ClassSubjectDTO, GradeCompositionDTO, GradeEntryDetailDTO, GradeSummaryDTO } from '../../models/rest.response';

@Component({
  selector: 'app-student-gradebook',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './student-gradebook.component.html',
  styleUrl: './student-gradebook.component.css',
})
export class StudentGradebook implements OnInit {
  private route = inject(ActivatedRoute);
  private studentService = inject(StudentService);
  private subjectService = inject(SubjectService);
  private gradeService = inject(GradeService);
  private cdr = inject(ChangeDetectorRef);

  studentId!: number;
  student: Student | null = null;

  semesters: Semester[] = [];
  selectedSemesterId: number | null = null;

  classes: ClassSubjectDTO[] = [];
  selectedClassId: number | null = null;

  gradeCompositions: GradeCompositionDTO[] = [];
  gradeDetails: GradeEntryDetailDTO[] = [];
  gradeSummary: GradeSummaryDTO | null = null;

  isLoading = false;
  isLoadingClasses = false;
  isLoadingGrade = false;
  isLoadingSummary = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = this.getStudentIdFromRoute(params);
      if (id === null) {
        this.errorMessage = 'Không lấy được studentId từ URL.';
        this.cdr.detectChanges();
        return;
      }

      this.studentId = id;
      this.loadStudentAndSemesters();
    });
  }

  onSemesterChange(): void {
    this.classes = [];
    this.selectedClassId = null;
    this.gradeCompositions = [];
    this.gradeDetails = [];
    this.gradeSummary = null;

    if (this.selectedSemesterId === null || this.selectedSemesterId === undefined) {
      this.cdr.detectChanges();
      return;
    }

    this.loadGradeSummary();

    this.isLoadingClasses = true;
    this.errorMessage = null;

    this.studentService.getClassesByStudentAndSemester(this.studentId, this.selectedSemesterId).subscribe({
      next: (res) => {
        this.isLoadingClasses = false;
        this.classes = res?.data ?? [];

        if (this.classes.length > 0) {
          const firstClass = this.classes[0];
          const classId = Number(firstClass.courseClassId);
          this.selectedClassId = classId;
          this.loadGradeDataByClass(firstClass, classId);
          return;
        }

        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingClasses = false;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  onClassChange(): void {
    this.gradeCompositions = [];
    this.gradeDetails = [];

    if (this.selectedClassId === null || this.selectedClassId === undefined) {
      this.cdr.detectChanges();
      return;
    }

    const classId = Number(this.selectedClassId);
    const selectedClass = this.getSelectedClass();
    if (!selectedClass) {
      this.errorMessage = 'Không xác định được lớp học phần đang chọn.';
      this.cdr.detectChanges();
      return;
    }

    this.loadGradeDataByClass(selectedClass, classId);
  }

  getSelectedClass(): ClassSubjectDTO | null {
    if (this.selectedClassId === null || this.selectedClassId === undefined) {
      return null;
    }
    const selectedId = Number(this.selectedClassId);
    return this.classes.find((c) => Number(c.courseClassId) === selectedId) ?? null;
  }

  getSemesterLabel(semester: Semester): string {
    const semesterName = semester?.semesterName ?? '';
    const academicYear = semester?.academicYear ?? '';
    return `${semesterName} - ${academicYear}`.trim();
  }

  getClassLabel(cls: ClassSubjectDTO): string {
    const subjectName = cls?.subject?.subjectName ?? 'Chưa có môn';
    const groupName = cls?.groupName ?? '--';
    return `${subjectName} (${groupName})`;
  }

  getScoreByComposition(compositionId: number): number | null {
    const grade = this.gradeDetails.find((g) => Number(g.gradeCompositionId) === Number(compositionId));
    return grade ? grade.score : null;
  }

  calculateAverage(): string | null {
    if (this.gradeCompositions.length === 0 || this.gradeDetails.length === 0) {
      return null;
    }

    const scoreByComposition = new Map<number, number>();
    this.gradeDetails.forEach((g) => scoreByComposition.set(Number(g.gradeCompositionId), g.score));

    for (const composition of this.gradeCompositions) {
      if (!scoreByComposition.has(Number(composition.id))) {
        return null;
      }
    }

    const total = this.gradeCompositions.reduce((sum, composition) => {
      const score = scoreByComposition.get(Number(composition.id))!;
      return sum + score * composition.weight;
    }, 0);

    return total.toFixed(1);
  }

  private loadStudentAndSemesters(): void {
    this.isLoading = true;
    this.errorMessage = null;

    forkJoin({
      studentRes: this.studentService.getStudent(this.studentId),
      semestersRes: this.studentService.getSemestersByStudent(this.studentId),
    }).subscribe({
      next: ({ studentRes, semestersRes }) => {
        this.isLoading = false;
        this.student = studentRes?.data ?? null;
        this.semesters = semestersRes?.data ?? [];

        if (this.semesters.length > 0) {
          this.selectedSemesterId = Number(this.semesters[0].id);
          this.onSemesterChange();
          return;
        }

        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private loadGradeDataByClass(selectedClass: ClassSubjectDTO, classId: number): void {
    const subjectId = this.extractSubjectId(selectedClass);
    if (!subjectId) {
      this.errorMessage = 'Không tìm thấy thông tin môn học của lớp học phần.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoadingGrade = true;
    this.errorMessage = null;

    forkJoin({
      compositionsRes: this.subjectService.getGradeCompositionsBySubject(subjectId),
      gradesRes: this.gradeService.getByStudentAndCourseClass(classId, this.studentId),
    }).subscribe({
      next: ({ compositionsRes, gradesRes }) => {
        this.isLoadingGrade = false;
        this.gradeCompositions = compositionsRes?.data ?? [];
        this.gradeDetails = gradesRes?.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingGrade = false;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  private loadGradeSummary(): void {
    if (this.selectedSemesterId === null || this.selectedSemesterId === undefined) {
      this.gradeSummary = null;
      this.cdr.detectChanges();
      return;
    }

    this.isLoadingSummary = true;
    this.studentService.getGradeSummary(this.studentId, this.selectedSemesterId).subscribe({
      next: (res) => {
        this.isLoadingSummary = false;
        this.gradeSummary = res?.data ?? null;
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingSummary = false;
        this.gradeSummary = null;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      }
    });
  }

  private extractSubjectId(selectedClass: ClassSubjectDTO | null): number | null {
    if (!selectedClass || !selectedClass.subject) {
      return null;
    }

    const subject = selectedClass.subject as any;
    const rawId = subject.subjectId ?? subject.id;
    if (rawId === null || rawId === undefined) {
      return null;
    }

    const numericId = Number(rawId);
    return Number.isNaN(numericId) ? null : numericId;
  }

  private getStudentIdFromRoute(params: ParamMap): number | null {
    const idValue = params.get('id')
      ?? this.route.snapshot.paramMap.get('id')
      ?? this.route.parent?.snapshot.paramMap.get('id')
      ?? this.route.snapshot.queryParamMap.get('studentId');

    if (!idValue) {
      return null;
    }

    const numericId = Number(idValue);
    return Number.isNaN(numericId) ? null : numericId;
  }

  private getErrorMessage(err: HttpErrorResponse): string {
    if (err.error && err.error.message) {
      if (Array.isArray(err.error.message)) {
        return err.error.message.join(', ');
      }
      if (typeof err.error.message === 'string') {
        return err.error.message;
      }
    }
    return 'Lỗi hệ thống, vui lòng thử lại sau.';
  }
}
