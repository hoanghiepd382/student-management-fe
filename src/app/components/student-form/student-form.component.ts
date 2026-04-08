import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.css']
})
export class StudentFormComponent implements OnInit {
  studentForm: FormGroup;
  isEditMode = false;
  studentId?: number;
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor() {
    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      studentCode: ['', Validators.required],
      address: [''],
      dob: [''],
      gender: ['MALE'],
      avatar: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.studentId = +id;
        this.loadStudentData(this.studentId);
      }
    });
  }

  loadStudentData(id: number): void {
    this.studentService.getStudent(id).subscribe({
      next: (res) => {
        const student = res.data;
        this.studentForm.patchValue({
          name: student.name,
          email: student.email,
          studentCode: student.studentCode,
          address: student.address,
          dob: student.dob,
          gender: student.gender,
          avatar: student.avatar
        });

        if (student.avatar) {
          this.imagePreview = `http://localhost:8080/storage/avatar/${student.avatar}`;
        }

        this.studentForm.get('studentCode')?.disable();
        this.studentForm.get('name')?.disable();
      },
      error: (err) => console.error('Error loading student', err)
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  private saveStudent(studentData: any): Observable<any> {
    if (this.isEditMode && this.studentId) {
      return this.studentService.updateStudent(this.studentId, studentData);
    } else {
      return this.studentService.createStudent(studentData);
    }
  }

  onSubmit(): void {
    if (this.studentForm.invalid) {
      this.studentForm.markAllAsTouched();
      return;
    }

    let finalProcess$: Observable<any>;

    if (this.selectedFile) {
      finalProcess$ = this.studentService.uploadFile(this.selectedFile, 'avatar').pipe(
        switchMap((res: any) => {
          const studentData = this.studentForm.getRawValue();
          if (res && res.data) {
            studentData.avatar = res.data.fileName;
          }
          return this.saveStudent(studentData);
        })
      );
    } else {
      finalProcess$ = this.saveStudent(this.studentForm.getRawValue());
    }

    finalProcess$.subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err: any) => console.error('Error saving student', err)
    });
  }
}
