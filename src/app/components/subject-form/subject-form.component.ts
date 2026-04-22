import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SubjectService } from '../../services/subject.service';
import { Subject, GradeCompositionDTO } from '../../models/rest.response';

interface GradeCompositionFormItem {
  id?: number;
  gradeItemName: string;
  weightPercent: number;
}

@Component({
  selector: 'app-subject-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './subject-form.component.html',
  styleUrls: ['./subject-form.component.css']
})
export class SubjectFormComponent implements OnInit {
  subjectForm: FormGroup;
  isEditMode = false;
  subjectId?: number;
  isSubmitting = false;
  submitError: string | null = null;
  compositionError: string | null = null;
  hasCompositionChanges = false;

  gradeCompositions: GradeCompositionFormItem[] = [];
  removedCompositionIds: number[] = [];

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
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.isEditMode = !!id;
      this.subjectId = id ? +id : undefined;

      if (this.subjectId) {
        this.loadSubjectData(this.subjectId);
      } else {
        this.gradeCompositions = [
          { gradeItemName: 'Chuyên cần', weightPercent: 10 },
          { gradeItemName: 'Giữa kỳ', weightPercent: 20 },
          { gradeItemName: 'Cuối kỳ', weightPercent: 70 },
        ];
        this.hasCompositionChanges = false;
      }
    });
  }

  addGradeComposition(): void {
    this.gradeCompositions.push({
      gradeItemName: '',
      weightPercent: 0
    });
    this.markCompositionChanged();
  }

  removeGradeComposition(index: number): void {
    const item = this.gradeCompositions[index];
    if (item?.id) {
      this.removedCompositionIds.push(item.id);
    }
    this.gradeCompositions.splice(index, 1);
    this.markCompositionChanged();
  }

  canEditGradeItemName(item: GradeCompositionFormItem): boolean {
    return !this.isEditMode || !item.id;
  }

  getTotalWeightPercent(): number {
    return this.gradeCompositions.reduce((sum, item) => sum + Number(item.weightPercent || 0), 0);
  }

  markCompositionChanged(): void {
    this.hasCompositionChanges = true;
    this.compositionError = null;
  }

  onSubmit(): void {
    if (this.isSubmitting) return;

    if (this.subjectForm.invalid) {
      this.subjectForm.markAllAsTouched();
      return;
    }

    this.compositionError = this.validateGradeCompositions();
    if (this.compositionError) {
      this.cdr.detectChanges();
      return;
    }

    this.submitError = null;
    this.isSubmitting = true;

    const data: Subject = { ...this.subjectForm.getRawValue() };
    if (this.isEditMode && this.subjectId) {
      data.id = this.subjectId;
    }

    const saveSubject$ = this.isEditMode
      ? this.subjectService.updateSubject(data)
      : this.subjectService.createSubject(data);

    saveSubject$.pipe(
      switchMap((res) => {
        const savedSubjectId = Number(res?.data?.id);
        if (!savedSubjectId) {
          throw new Error('Không lấy được ID môn học sau khi lưu.');
        }
        return this.syncGradeCompositions(savedSubjectId);
      })
    ).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.hasCompositionChanges = false;
        this.cdr.detectChanges();
        this.router.navigate(['/subjects']);
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const message = err?.error?.message ?? err?.message;
        this.submitError = Array.isArray(message)
          ? message.join(', ')
          : (typeof message === 'string' ? message : 'Không thể lưu môn học. Vui lòng thử lại.');
        this.cdr.detectChanges();
      }
    });
  }

  private loadSubjectData(id: number): void {
    forkJoin({
      subjectRes: this.subjectService.getSubjectById(id),
      compositionsRes: this.subjectService.getGradeCompositionsBySubject(id),
    }).subscribe({
      next: ({ subjectRes, compositionsRes }) => {
        const subject = subjectRes.data;
        this.subjectForm.patchValue({
          subjectCode: subject.subjectCode,
          subjectName: subject.subjectName,
          credit: subject.credit
        });

        const compositions = compositionsRes?.data ?? [];
        this.removedCompositionIds = [];
        this.gradeCompositions = compositions.map((item: GradeCompositionDTO) => ({
          id: item.id,
          gradeItemName: item.gradeItemName,
          weightPercent: Number((item.weight * 100).toFixed(2))
        }));

        if (this.gradeCompositions.length === 0) {
          this.gradeCompositions = [{ gradeItemName: '', weightPercent: 0 }];
        }

        this.hasCompositionChanges = false;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading subject', err)
    });
  }

  private syncGradeCompositions(subjectId: number): Observable<void> {
    const deleteRequests = this.removedCompositionIds.map((id) => this.subjectService.deleteGradeComposition(id));

    const saveRequests = this.gradeCompositions.map((item) => this.subjectService.saveGradeComposition({
      id: item.id,
      gradeItemName: item.gradeItemName.trim(),
      weight: item.weightPercent / 100,
      subject: { id: subjectId }
    }));

    return this.runRequests(deleteRequests).pipe(
      switchMap(() => this.runRequests(saveRequests)),
      map(() => void 0)
    );
  }

  private runRequests<T>(requests: Observable<T>[]): Observable<T[]> {
    if (requests.length === 0) {
      return of([] as T[]);
    }
    return forkJoin(requests);
  }

  private validateGradeCompositions(): string | null {
    if (this.gradeCompositions.length === 0) {
      return 'Môn học cần có ít nhất 1 đầu điểm.';
    }

    const normalizedNames = new Set<string>();
    for (const item of this.gradeCompositions) {
      const name = item.gradeItemName?.trim();
      if (!name) {
        return 'Tên đầu điểm không được để trống.';
      }

      const key = name.toLowerCase();
      if (normalizedNames.has(key)) {
        return `Đầu điểm "${name}" đang bị trùng.`;
      }
      normalizedNames.add(key);

      const weight = Number(item.weightPercent);
      if (Number.isNaN(weight) || weight <= 0 || weight > 100) {
        return `Trọng số của đầu điểm "${name}" phải trong khoảng (0, 100].`;
      }
    }

    const totalWeight = this.getTotalWeightPercent();
    if (Math.abs(totalWeight - 100) > 0.0001) {
      return `Tổng trọng số phải bằng 100%`;
    }

    return null;
  }
}
