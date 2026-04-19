import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from '../../models/rest.response';
import { SubjectService } from '../../services/subject.service';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './subject-list.component.html',
  styleUrls: ['./subject-list.component.css']
})
export class SubjectListComponent implements OnInit {
  subjects: Subject[] = [];
  searchKeyword = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;

  private subjectService = inject(SubjectService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadSubjects();
  }

  loadSubjects(): void {
    let filter = '';
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.trim();
      filter = `subjectName ~~ '${keyword}' or subjectCode ~~ '${keyword}'`;
    }

    let sort = '';
    if (this.sortField) {
      sort = `${this.sortField},${this.sortDirection}`;
    }

    this.subjectService.getSubjects({
      filter,
      sort,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: (res) => {
        const list = res?.data?.result ?? [];
        this.subjects = [...list];
        if (res?.data?.meta) {
          const meta = res.data.meta;
          this.totalItems = meta.total;
          this.totalPages = meta.pages;
          this.currentPage = meta.page;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading subjects', err)
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadSubjects();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
    this.loadSubjects();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadSubjects();
      window.scrollTo(0, 0);
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.loadSubjects();
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

  deleteSubject(id: number | undefined): void {
    if (!id) return;
    if (confirm('Bạn có chắc chắn muốn xóa môn học này?')) {
      this.subjectService.deleteSubject(id).subscribe({
        next: () => this.loadSubjects(),
        error: (err) => alert('Lỗi khi xóa môn học: ' + err.message)
      });
    }
  }
}
