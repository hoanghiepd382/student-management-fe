import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SemesterService } from '../../services/semester.service';
import { Semester } from '../../models/rest.response';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-semester-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './semester-form.component.html',
  styleUrls: ['./semester-form.component.css']
})
export class SemesterFormComponent implements OnInit {
  semesterForm: FormGroup;
  isEditMode = false;
  semesterId?: number;
  isSubmitting = false;
  submitError: string | null = null;

  semesterNameOptions: { label: string; value: string }[] = [
    { label: 'Học kỳ 1', value: 'SEMESTER_1' },
    { label: 'Học kỳ 2', value: 'SEMESTER_2' },
    { label: 'Học kỳ 3', value: 'SEMESTER_3' }
  ];
  academicYearOptions: string[] = [
    '2026-2027',
    '2025-2026',
    '2024-2025',
    '2023-2024',
    '2022-2023',
    '2021-2022'
  ];

  private fb = inject(FormBuilder);
  private semesterService = inject(SemesterService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.semesterForm = this.fb.group({
      semesterName: [null, Validators.required],
      academicYear: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.isEditMode = !!id;
      this.semesterId = id ? +id : undefined;

      if (this.semesterId) {
        this.loadSemesterData(this.semesterId);
      }
    });
  }

  loadSemesterData(id: number): void {
    this.semesterService.getSemesterById(id).subscribe({
      next: (res) => {
        const semester = res.data;
        this.semesterForm.patchValue({
          semesterName: this.normalizeSemesterName(semester.semesterName),
          academicYear: semester.academicYear
        });
      },
      error: (err) => console.error('Error loading semester', err)
    });
  }

  private saveSemester(semesterData: Semester): Observable<any> {
    if (this.isEditMode && this.semesterId) {
      semesterData.id = this.semesterId;
      return this.semesterService.updateSemester(semesterData);
    }
    return this.semesterService.createSemester(semesterData);
  }

  onSubmit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.semesterForm.invalid) {
      this.semesterForm.markAllAsTouched();
      return;
    }

    this.submitError = null;
    this.isSubmitting = true;

    this.saveSemester(this.semesterForm.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.router.navigate(['/semesters']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        this.submitError = this.getBackendErrorMessage(err);
        console.error('Error saving semester:', err);
        this.cdr.detectChanges();
      }
    });
  }

  private getBackendErrorMessage(err: any): string {
    const message = err?.error?.message;
    if (Array.isArray(message) && message.length) {
      return message.join(', ');
    }
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    const fallback = err?.error?.error ?? err?.message;
    if (typeof fallback === 'string' && fallback.trim()) {
      return fallback;
    }

    return 'Không thể lưu học kỳ. Vui lòng thử lại sau.';
  }

  private normalizeSemesterName(rawValue: string | undefined): string | null {
    if (!rawValue) {
      return null;
    }

    const value = rawValue.trim().toUpperCase();
    if (value === 'SEMESTER_1' || value.includes('1')) {
      return 'SEMESTER_1';
    }
    if (value === 'SEMESTER_2' || value.includes('2')) {
      return 'SEMESTER_2';
    }
    if (value === 'SEMESTER_3' || value.includes('3')) {
      return 'SEMESTER_3';
    }

    return null;
  }
}
