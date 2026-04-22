export interface RestResponse<T> {
  statusCode: number;
  message: string | string[];
  error: string | null;
  data: T;
}

export interface Meta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface ResultPaginationDTO<T> {
  meta: Meta;
  result: T[];
}

export interface ResUploadFileDTO {
  fileName: string;
  uploadedAt: string;
}

export interface Semester {
  id: number;
  semesterName: string;
  academicYear: string;
}

export interface Subject {
  id: number;
  subjectCode: string;
  subjectName: string;
  credit: number;
}

export interface GradeCompositionDTO {
  id: number;
  gradeItemName: string;
  weight: number;
}

export interface GradeEntryDetailDTO {
  gradeCompositionId: number;
  gradeItemName: string;
  weight: number;
  score: number;
}

export interface GradeSummaryDTO {
  studentId: number;
  semesterId: number;
  semesterGpa: number;
  cumulativeCpa: number;
}

export interface GradeBatchRequestDTO {
  courseClassId: number;
  studentId: number;
  scores: Array<{
    gradeCompositionId: number;
    score: number;
  }>;
}

export interface GradeBatchResDTO {
  studentId: number;
  courseClassId: number;
  savedCount: number;
}

export interface Major {
  id: number;
  majorCode: string;
  majorName: string;
}

export interface ClassSubjectDTO {
  courseClassId: number;
  groupName: string;
  subject: {
    subjectId: number;
    subjectCode: string;
    subjectName: string;
    credit: number;
  };
}

export interface FetchGradeDTO {
  id: number;
  attendanceScore: number;
  test1Score: number;
  test2Score: number;
  midtermScore: number;
  finalScore: number;
  student: {
    id: number;
    studentCode: string;
    name: string;
  };
  courseClass: {
    id: number;
    groupName: string;
    semester: {
      id: number;
      semesterName: string;
      academicYear: string;
    };
    subject: {
      id: number;
      subjectCode: string;
      subjectName: string;
      credit: number;
    };
  };
}
