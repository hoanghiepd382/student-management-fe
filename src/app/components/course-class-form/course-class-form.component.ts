import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CourseClassService, CourseClassRequest } from '../../services/course-class.service';
import { SemesterService } from '../../services/semester.service';
import { SubjectService } from '../../services/subject.service';
import { Semester, Subject } from '../../models/rest.response';

@Component({
  selector: 'app-course-class-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './course-class-form.component.html',
  styleUrls: ['./course-class-form.component.css']
})
export class CourseClassFormComponent implements OnInit {
  classForm: FormGroup;
  isEditMode = false;
  classId?: number;
  isSubmitting = false;
  submitError: string | null = null;

  semesters: Semester[] = [];
  subjects: Subject[] = [];

  private fb = inject(FormBuilder);
  private courseClassService = inject(CourseClassService);
  private semesterService = inject(SemesterService);
  private subjectService = inject(SubjectService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.classForm = this.fb.group({
      groupName: ['', Validators.required],
      semesterId: [null, Validators.required],
      subjectId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Load dropdowns in parallel
    this.semesterService.getSemesters({ page: 1, size: 100 }).subscribe({
      next: (res) => { this.semesters = res?.data?.result ?? []; this.cdr.detectChanges(); }
    });
    this.subjectService.getSubjects({ page: 1, size: 200 }).subscribe({
      next: (res) => { this.subjects = res?.data?.result ?? []; this.cdr.detectChanges(); }
    });

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.isEditMode = !!id;
      this.classId = id ? +id : undefined;
      if (this.classId) {
        this.loadClassData(this.classId);
      }
    });
  }

  loadClassData(id: number): void {
    this.courseClassService.getCourseClassById(id).subscribe({
      next: (res) => {
        const cls = res.data;
        this.classForm.patchValue({
          groupName: cls.groupName,
          semesterId: cls.semester?.id,
          subjectId: cls.subject?.id
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading course class', err)
    });
  }

  onSubmit(): void {
    if (this.isSubmitting) return;
    if (this.classForm.invalid) {
      this.classForm.markAllAsTouched();
      return;
    }

    this.submitError = null;
    this.isSubmitting = true;

    const val = this.classForm.getRawValue();
    const payload: CourseClassRequest = {
      groupName: val.groupName,
      semester: { id: val.semesterId },
      subject: { id: val.subjectId }
    };
    if (this.isEditMode && this.classId) {
      payload.id = this.classId;
    }

    const request$ = this.isEditMode
      ? this.courseClassService.updateCourseClass(payload)
      : this.courseClassService.createCourseClass(payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
        this.router.navigate(['/classes']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const message = err?.error?.message;
        this.submitError = Array.isArray(message) ? message.join(', ')
          : (typeof message === 'string' ? message : 'Không thể lưu. Vui lòng thử lại.');
        this.cdr.detectChanges();
      }
    });
  }
}
