import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Student } from '../../models/student';
import { StudentService } from '../../services/student.service';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent implements OnInit {
  students: Student[] = [];
  searchKeyword = '';
  searchBy: 'studentCode' | 'name' | 'email' = 'studentCode';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  private studentService = inject(StudentService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    const filter = this.buildSearchFilter();

    let sort = '';
    if (this.sortField) {
      sort = `${this.sortField},${this.sortDirection}`;
    }

    this.studentService
      .getStudents({
        filter,
        sort,
        page: this.currentPage,
        size: this.pageSize
      })
      .subscribe({
        next: (res) => {
          const list = res?.data?.result ?? [];
          this.students = [...list];

          if (res?.data?.meta) {
            const meta = res.data.meta;
            this.totalItems = meta.total;
            this.totalPages = meta.pages;
            this.currentPage = meta.page;
          }

          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading students', err)
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  onSearchByChange(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadStudents();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadStudents();
      window.scrollTo(0, 0);
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  getSearchPlaceholder(): string {
    if (this.searchBy === 'email') return 'Nhập email cần tìm...';
    if (this.searchBy === 'name') return 'Nhập họ tên cần tìm...';
    return 'Nhập mã sinh viên cần tìm...';
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

  private buildSearchFilter(): string {
    const keyword = this.searchKeyword.trim();
    if (!keyword) return '';

    const escapedKeyword = keyword.replace(/'/g, "''");
    return `${this.searchBy} ~~ '${escapedKeyword}'`;
  }

  deleteStudent(id: number | undefined): void {
    if (!id) return;
    if (confirm('Bạn có chắc chắn muốn xóa sinh viên này?')) {
      this.studentService.deleteStudent(id).subscribe({
        next: () => this.loadStudents(),
        error: (err) => console.error('Error deleting student', err)
      });
    }
  }
}
