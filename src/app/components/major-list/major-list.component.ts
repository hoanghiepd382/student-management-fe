import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Major } from '../../models/rest.response';
import { MajorService } from '../../services/major.service';

@Component({
  selector: 'app-major-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './major-list.component.html',
  styleUrls: ['./major-list.component.css']
})
export class MajorListComponent implements OnInit {
  majors: Major[] = [];
  searchBy: 'majorCode' | 'majorName' = 'majorCode';
  searchKeyword = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  private majorService = inject(MajorService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadMajors();
  }

  loadMajors(): void {
    let filter = '';
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.trim().replace(/'/g, "''");
      filter = `${this.searchBy} ~~ '${keyword}'`;
    }

    let sort = '';
    if (this.sortField) {
      sort = `${this.sortField},${this.sortDirection}`;
    }

    this.majorService.getMajors({
      filter,
      sort,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        const list = res?.data?.result ?? [];
        this.majors = [...list];
        if (res?.data?.meta) {
          const meta = res.data.meta;
          this.totalItems = meta.total;
          this.totalPages = meta.pages;
          this.currentPage = meta.page;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading majors', err)
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadMajors();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadMajors();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadMajors();
      window.scrollTo(0, 0);
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadMajors();
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
    if (this.sortField !== field) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getSearchPlaceholder(): string {
    return this.searchBy === 'majorName'
      ? 'Nhập tên ngành...'
      : 'Nhập mã ngành...';
  }

  deleteMajor(id: number | undefined): void {
    if (!id) return;
    if (confirm('Bạn có chắc chắn muốn xóa ngành học này?')) {
      this.majorService.deleteMajor(id).subscribe({
        next: () => this.loadMajors(),
        error: (err) => alert('Lỗi khi xóa ngành học: ' + err.message)
      });
    }
  }
}
