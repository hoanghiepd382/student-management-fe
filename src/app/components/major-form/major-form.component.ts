import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { MajorService } from '../../services/major.service';
import { Major } from '../../models/rest.response';

@Component({
  selector: 'app-major-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './major-form.component.html',
  styleUrls: ['./major-form.component.css']
})
export class MajorFormComponent implements OnInit {
  majorForm: FormGroup;
  isEditMode = false;
  majorId?: number;
  isSubmitting = false;
  submitError: string | null = null;

  private fb = inject(FormBuilder);
  private majorService = inject(MajorService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.majorForm = this.fb.group({
      majorCode: ['', Validators.required],
      majorName: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.isEditMode = !!id;
      this.majorId = id ? +id : undefined;
      if (this.majorId) {
        this.loadMajorData(this.majorId);
      }
    });
  }

  loadMajorData(id: number): void {
    this.majorService.getMajorById(id).subscribe({
      next: (res) => {
        const major = res.data;
        this.majorForm.patchValue({
          majorCode: major.majorCode,
          majorName: major.majorName
        });
      },
      error: (err) => console.error('Error loading major', err)
    });
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    if (this.majorForm.invalid) {
      this.majorForm.markAllAsTouched();
      return;
    }

    this.submitError = null;
    this.isSubmitting = true;

    const data: Major = { ...this.majorForm.getRawValue() };
    if (this.isEditMode && this.majorId) {
      data.id = this.majorId;
    }

    const request$ = this.isEditMode
      ? this.majorService.updateMajor(data)
      : this.majorService.createMajor(data);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.router.navigate(['/majors']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const message = err?.error?.message;
        this.submitError = Array.isArray(message) ? message.join(', ')
          : (typeof message === 'string' ? message : 'Khong the luu nganh hoc. Vui long thu lai.');
        this.cdr.detectChanges();
      }
    });
  }
}

