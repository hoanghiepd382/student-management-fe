import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentGradebook } from './student-gradebook.component';

describe('StudentGradebook', () => {
  let component: StudentGradebook;
  let fixture: ComponentFixture<StudentGradebook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentGradebook],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentGradebook);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
