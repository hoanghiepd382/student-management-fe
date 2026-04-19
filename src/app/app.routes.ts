import { Routes } from '@angular/router';
import { StudentListComponent } from './components/student-list/student-list.component';
import { StudentFormComponent } from './components/student-form/student-form.component';
import { StudentGradebook } from './components/student-gradebook/student-gradebook.component';
import { SemesterListComponent } from './components/semester-list/semester-list.component';
import { SemesterFormComponent } from './components/semester-form/semester-form.component';
import { SubjectListComponent } from './components/subject-list/subject-list.component';
import { SubjectFormComponent } from './components/subject-form/subject-form.component';
import { CourseClassListComponent } from './components/course-class-list/course-class-list.component';
import { CourseClassFormComponent } from './components/course-class-form/course-class-form.component';

export const routes: Routes = [
  { path: '', redirectTo: 'students', pathMatch: 'full' },
  {
    path: 'students',
    children: [
      { path: '', component: StudentListComponent },
      { path: 'new', component: StudentFormComponent },
      { path: ':id/edit', component: StudentFormComponent },
      { path: ':id/gradebook', component: StudentGradebook }
    ]
  },
  {
    path: 'semesters',
    children: [
      { path: '', component: SemesterListComponent },
      { path: 'new', component: SemesterFormComponent },
      { path: ':id/edit', component: SemesterFormComponent }
    ]
  },
  {
    path: 'subjects',
    children: [
      { path: '', component: SubjectListComponent },
      { path: 'new', component: SubjectFormComponent },
      { path: ':id/edit', component: SubjectFormComponent }
    ]
  },
  {
    path: 'classes',
    children: [
      { path: '', component: CourseClassListComponent },
      { path: 'new', component: CourseClassFormComponent },
      { path: ':id/edit', component: CourseClassFormComponent }
    ]
  },
  { path: '**', redirectTo: 'students' }
];
