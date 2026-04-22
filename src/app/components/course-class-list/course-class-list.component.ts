import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CourseClassService, CourseClass } from '../../services/course-class.service';
import { SemesterService } from '../../services/semester.service';
import { SubjectService } from '../../services/subject.service';
import { Semester, Subject } from '../../models/rest.response';

@Component({
  selector: 'app-course-class-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './course-class-list.component.html',
  styleUrls: ['./course-class-list.component.css']
})
export class CourseClassListComponent implements OnInit {
  classes: CourseClass[] = [];
  searchKeyword = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  semesters: Semester[] = [];
  subjects: Subject[] = [];
  academicYearOptions: string[] = [];
  selectedAcademicYear: string = 'ALL';
  selectedSemesterId: number | 'ALL' = 'ALL';
  selectedSubjectId: number | 'ALL' = 'ALL';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  private courseClassService = inject(CourseClassService);
  private semesterService = inject(SemesterService);
  private subjectService = inject(SubjectService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadClasses();
  }

  loadClasses(): void {
    const filter = this.buildFilterQuery();

    let sort = '';
    if (this.sortField) {
      sort = `${this.sortField},${this.sortDirection}`;
    }

    this.courseClassService.getCourseClasses({
      filter,
      sort,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        const list = res?.data?.result ?? [];
        this.classes = [...list];
        if (res?.data?.meta) {
          const meta = res.data.meta;
          this.totalItems = meta.total;
          this.totalPages = meta.pages;
          this.currentPage = meta.page;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading course classes', err)
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadClasses();
  }

  onAcademicYearFilterChange(): void {
    if (this.selectedSemesterId !== 'ALL') {
      const semesterExists = this.getFilteredSemesters().some((s) => s.id === Number(this.selectedSemesterId));
      if (!semesterExists) {
        this.selectedSemesterId = 'ALL';
      }
    }

    this.currentPage = 1;
    this.loadClasses();
  }

  onSemesterFilterChange(): void {
    this.currentPage = 1;
    this.loadClasses();
  }

  onSubjectFilterChange(): void {
    this.currentPage = 1;
    this.loadClasses();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadClasses();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadClasses();
      window.scrollTo(0, 0);
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadClasses();
  }

  getPagesArray(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getFilteredSemesters(): Semester[] {
    if (this.selectedAcademicYear === 'ALL') {
      return this.semesters;
    }
    return this.semesters.filter((semester) => semester.academicYear === this.selectedAcademicYear);
  }

  deleteClass(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa lớp học phần này?')) {
      this.courseClassService.deleteCourseClass(id).subscribe({
        next: () => this.loadClasses(),
        error: (err) => alert('Lỗi khi xóa: ' + (err?.error?.message ?? err.message))
      });
    }
  }

  private loadFilterOptions(): void {
    forkJoin({
      semestersRes: this.semesterService.getSemesters({ page: 1, size: 200, sort: 'academicYear,desc' }),
      subjectsRes: this.subjectService.getSubjects({ page: 1, size: 200, sort: 'subjectCode,asc' })
    }).subscribe({
      next: ({ semestersRes, subjectsRes }) => {
        this.semesters = semestersRes?.data?.result ?? [];
        this.subjects = subjectsRes?.data?.result ?? [];
        this.academicYearOptions = Array.from(new Set(this.semesters.map((s) => s.academicYear)))
          .sort((a, b) => b.localeCompare(a));
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading filter options', err)
    });
  }

  private buildFilterQuery(): string {
    const filters: string[] = [];

    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.trim().replace(/'/g, "''");
      filters.push(`groupName ~~ '${keyword}'`);
    }

    if (this.selectedAcademicYear !== 'ALL') {
      const escapedYear = this.selectedAcademicYear.replace(/'/g, "''");
      filters.push(`semester.academicYear ~~ '${escapedYear}'`);
    }

    if (this.selectedSemesterId !== 'ALL') {
      filters.push(`semester.id:${Number(this.selectedSemesterId)}`);
    }

    if (this.selectedSubjectId !== 'ALL') {
      filters.push(`subject.id:${Number(this.selectedSubjectId)}`);
    }

    return filters.join(' and ');
  }
}
