import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Semester } from '../../models/rest.response';
import { SemesterService } from '../../services/semester.service';

@Component({
  selector: 'app-semester-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './semester-list.component.html',
  styleUrls: ['./semester-list.component.css']
})
export class SemesterListComponent implements OnInit {
  semesters: Semester[] = [];
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  academicYearOptions: string[] = [
    '2026-2027',
    '2025-2026',
    '2024-2025',
    '2023-2024',
    '2022-2023',
    '2021-2022'
  ];
  selectedAcademicYear = 'ALL';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  private semesterService = inject(SemesterService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadSemesters();
  }

  loadSemesters(): void {
    const filter = this.buildAcademicYearFilter();

    let sort = '';
    if (this.sortField) {
      sort = `${this.sortField},${this.sortDirection}`;
    }

    this.semesterService
      .getSemesters({
        filter,
        sort,
        page: this.currentPage,
        size: this.pageSize
      })
      .subscribe({
        next: (res) => {
          const list = res?.data?.result ?? [];
          this.semesters = [...list];

          if (res?.data?.meta) {
            const meta = res.data.meta;
            this.totalItems = meta.total;
            this.totalPages = meta.pages;
            this.currentPage = meta.page;
          }

          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading semesters', err)
      });
  }

  onAcademicYearFilterChange(): void {
    this.currentPage = 1;
    this.loadSemesters();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadSemesters();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSemesters();
      window.scrollTo(0, 0);
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadSemesters();
  }

  getPagesArray(): number[] {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  deleteSemester(id: number | undefined): void {
    if (!id) return;
    if (confirm('Bạn có chắc chắn muốn xóa học kỳ này?')) {
      this.semesterService.deleteSemester(id).subscribe({
        next: () => this.loadSemesters(),
        error: (err) => alert('Lỗi khi xóa học kỳ: ' + err.message)
      });
    }
  }

  private buildAcademicYearFilter(): string {
    if (this.selectedAcademicYear === 'ALL') {
      return '';
    }

    const escapedYear = this.selectedAcademicYear.replace(/'/g, "''");
    return `academicYear ~~ '${escapedYear}'`;
  }
}
