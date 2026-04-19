import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SubjectService } from '../../services/subject.service';
import { Subject } from '../../models/rest.response';

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './subject-form.component.html',
  styleUrls: ['./subject-form.component.css']
})
export class SubjectFormComponent implements OnInit {
  subjectForm: FormGroup;
  isEditMode = false;
  subjectId?: number;
  isSubmitting = false;
  submitError: string | null = null;

  private fb = inject(FormBuilder);
  private subjectService = inject(SubjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.subjectForm = this.fb.group({
      subjectCode: ['', Validators.required],
      subjectName: ['', Validators.required],
      credit: [2, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.isEditMode = !!id;
      this.subjectId = id ? +id : undefined;
      if (this.subjectId) {
        this.loadSubjectData(this.subjectId);
      }
    });
  }

  loadSubjectData(id: number): void {
    this.subjectService.getSubjectById(id).subscribe({
      next: (res) => {
        const subject = res.data;
        this.subjectForm.patchValue({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          credit: subject.credit
        });
      },
      error: (err) => console.error('Error loading subject', err)
    });
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.submitError = null;
    this.isSubmitting = true;

    const data: Subject = { ...this.subjectForm.getRawValue() };
    if (this.isEditMode && this.subjectId) {
      data.id = this.subjectId;
    }

    const request$ = this.isEditMode
      ? this.subjectService.updateSubject(data)
      : this.subjectService.createSubject(data);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.router.navigate(['/subjects']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const message = err?.error?.message;
        this.submitError = Array.isArray(message) ? message.join(', ')
          : (typeof message === 'string' ? message : 'Không thể lưu môn học. Vui lòng thử lại.');
        this.cdr.detectChanges();
      }
    });
  }
}
