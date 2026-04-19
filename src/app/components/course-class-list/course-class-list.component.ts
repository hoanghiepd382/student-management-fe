import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CourseClassService, CourseClass } from '../../services/course-class.service';

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

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  private courseClassService = inject(CourseClassService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadClasses();
  }

  loadClasses(): void {
    let filter = '';
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.trim();
      filter = `groupName ~~ '${keyword}'`;
    }

    let sort = '';
    if (this.sortField) {
      sort = `${this.sortField},${this.sortDirection}`;
    }

    this.courseClassService.getCourseClasses({
      filter, sort,
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

  onSearch(): void { this.currentPage = 1; this.loadClasses(); }

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

  onPageSizeChange(): void { this.currentPage = 1; this.loadClasses(); }

  getPagesArray(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  deleteClass(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa lớp học phần này?')) {
      this.courseClassService.deleteCourseClass(id).subscribe({
        next: () => this.loadClasses(),
        error: (err) => alert('Lỗi khi xóa: ' + err.message)
      });
    }
  }
}
