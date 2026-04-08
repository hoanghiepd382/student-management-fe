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
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  private studentService = inject(StudentService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    let filter = '';
    if (this.searchKeyword.trim()) {
      const keyword = this.searchKeyword.trim();
      filter = `name ~~ '${keyword}' or studentCode ~~ '${keyword}'`;
    }

    let sort = '';
    if (this.sortField) {
      sort = `${this.sortField},${this.sortDirection}`;
    }

    this.studentService.getStudents({ filter, sort }).subscribe({
      next: (res) => {
        const list = res?.data?.result ?? [];
        this.students = [...list];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading students', err)
    });
  }

  onSearch(): void {
    this.loadStudents();
  }

  onSort(field: string): void {
    if (this.sortField === field) {
      // Toggle direction nếu click cùng cột
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadStudents();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
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
