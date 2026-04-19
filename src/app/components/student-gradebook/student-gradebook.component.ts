import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { Student } from '../../models/student';
import { Semester, ClassSubjectDTO, FetchGradeDTO } from '../../models/rest.response';
import { HttpErrorResponse } from '@angular/common/http';

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
  private cdr = inject(ChangeDetectorRef);

  studentId!: number;
  student: Student | null = null;

  semesters: Semester[] = [];
  selectedSemesterId: number | null = null;

  classes: ClassSubjectDTO[] = [];
  selectedClassId: number | null = null;

  gradeDetail: FetchGradeDTO | null = null;

  isLoading = false;
  isLoadingClasses = false;
  isLoadingGrade = false;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      const id = this.getStudentIdFromRoute(params);
      if (id === null) {
        this.errorMessage = 'Khong lay duoc studentId tu URL.';
        return;
      }

      this.studentId = id;
      this.loadStudentData();
    });
  }

  loadStudentData(): void {
    this.loadStudentDataSafe();
    return;

    this.isLoading = true;
    this.errorMessage = null;

    this.studentService.getStudent(this.studentId).subscribe({
      next: (res: any) => {
        console.log('GET_STUDENT API CATCH', res);
        if (res && res.data) {
          this.student = res.data;
          console.log('STUDENT ASSIGNED:', this.student);
          this.loadSemesters();
        } else if (res && res.id) {
          this.student = res;
          console.log('STUDENT ASSIGNED (FALLBACK):', this.student);
          this.loadSemesters();
        } else {
          this.isLoading = false;
          this.errorMessage = 'Dữ liệu trả về bị rỗng. Chi tiết: ' + JSON.stringify(res);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  loadSemesters(): void {
    this.loadSemestersSafe();
    return;

    this.studentService.getSemestersByStudent(this.studentId).subscribe({
      next: (res: any) => {
        console.log('SEMESTERS API CATCH', res);
        this.isLoading = false;
        if (res && res.data && res.data.length > 0) {
          this.semesters = res.data;
          console.log('SEMESTERS ASSIGNED', this.semesters);
          this.selectedSemesterId = this.semesters[0].id;
          this.onSemesterChange();
        } else if (Array.isArray(res) && res.length > 0) {
          this.semesters = res;
          this.selectedSemesterId = this.semesters[0].id;
          this.onSemesterChange();
        } else {
          console.log('NO SEMESTERS FOUND');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  onSemesterChange(): void {
    this.onSemesterChangeSafe();
    return;

    this.classes = [];
    this.selectedClassId = null;
    this.gradeDetail = null;

    if (!this.selectedSemesterId) return;

    this.isLoadingClasses = true;
    this.studentService.getClassesByStudentAndSemester(this.studentId, this.selectedSemesterId!).subscribe({
      next: (res: any) => {
        console.log('CLASSES API CATCH', res);
        this.isLoadingClasses = false;
        let classList = [];
        if (res && res.data && res.data.length > 0) {
          classList = res.data;
        } else if (Array.isArray(res) && res.length > 0) {
          classList = res;
        }

        this.classes = classList;
        console.log('CLASSES ASSIGNED', this.classes);
        if (this.classes.length > 0) {
          this.selectedClassId = this.classes[0].courseClassId;
          this.onClassChange();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingClasses = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  onClassChange(): void {
    this.onClassChangeSafe();
    return;

    this.gradeDetail = null;
    if (!this.selectedClassId) return;

    this.isLoadingGrade = true;
    this.studentService.getGradeDetail(this.studentId, this.selectedClassId!).subscribe({
      next: (res: any) => {
        this.isLoadingGrade = false;
        if (res && res.data) {
          this.gradeDetail = res.data;
        } else if (res && res.id) {
          this.gradeDetail = res;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingGrade = false;
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }

  getErrorMessage(err: HttpErrorResponse): string {
    if (err.error && err.error.message) {
      if (Array.isArray(err.error.message)) {
        return err.error.message.join(', ');
      }
      return err.error.message;
    }
    return 'Lỗi hệ thống, vui lòng thử lại sau.';
  }

  private loadStudentDataSafe(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.studentService.getStudent(this.studentId).subscribe({
      next: (res: unknown) => {
        const studentData = this.unwrapData<Student>(res);
        if (studentData && studentData.id) {
          this.student = studentData;
          this.loadSemestersSafe();
          this.cdr.detectChanges();
          return;
        }

        this.isLoading = false;
        this.errorMessage = 'Khong doc duoc thong tin sinh vien tu response.';
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private loadSemestersSafe(): void {
    this.studentService.getSemestersByStudent(this.studentId).subscribe({
      next: (res: unknown) => {
        this.isLoading = false;
        this.semesters = this.normalizeList<Semester>(this.unwrapData(res));

        if (this.semesters.length === 0) {
          this.cdr.detectChanges();
          return;
        }

        this.selectedSemesterId = this.semesters[0].id;
        this.onSemesterChangeSafe();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private onSemesterChangeSafe(): void {
    this.classes = [];
    this.selectedClassId = null;
    this.gradeDetail = null;

    if (!this.selectedSemesterId) {
      return;
    }

    this.isLoadingClasses = true;
    this.studentService.getClassesByStudentAndSemester(this.studentId, this.selectedSemesterId!).subscribe({
      next: (res: unknown) => {
        this.isLoadingClasses = false;
        this.classes = this.normalizeList<ClassSubjectDTO>(this.unwrapData(res));

        if (this.classes.length > 0) {
          this.selectedClassId = this.classes[0].courseClassId;
          this.onClassChangeSafe();
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingClasses = false;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private onClassChangeSafe(): void {
    this.gradeDetail = null;
    if (!this.selectedClassId) {
      return;
    }

    this.isLoadingGrade = true;
    this.studentService.getGradeDetail(this.studentId, this.selectedClassId!).subscribe({
      next: (res: unknown) => {
        this.isLoadingGrade = false;
        const gradeData = this.unwrapData<FetchGradeDTO>(res);
        if (gradeData && gradeData.id) {
          this.gradeDetail = gradeData;
        }
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.isLoadingGrade = false;
        this.errorMessage = this.getErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
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

  private unwrapData<T>(response: unknown): T | null {
    if (response == null) {
      return null;
    }

    if (Array.isArray(response)) {
      return response as T;
    }

    if (typeof response !== 'object') {
      return response as T;
    }

    const first = response as { data?: unknown };
    if (first.data === undefined) {
      return response as T;
    }

    if (first.data == null) {
      return null;
    }

    if (typeof first.data === 'object' && !Array.isArray(first.data)) {
      const second = first.data as { data?: unknown };
      if (second.data !== undefined) {
        return (second.data ?? first.data) as T;
      }
    }

    return first.data as T;
  }

  private normalizeList<T>(payload: unknown): T[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === 'object' && Array.isArray((payload as { result?: unknown[] }).result)) {
      return (payload as { result: T[] }).result;
    }

    return [];
  }

  calculateAverage(): string | null {
    if (!this.gradeDetail) return null;

    const { attendanceScore, midtermScore, test1Score, test2Score, finalScore } = this.gradeDetail;
    const avg = (attendanceScore * 0.1) +
      (midtermScore * 0.2) +
      (((test1Score + test2Score) / 2) * 0.2) +
      (finalScore * 0.5);
    return avg.toFixed(1);
  }
}
