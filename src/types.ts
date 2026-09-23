export interface Student {
  fullName: string;
  userId: string;
  studentId: string;
  mobileNumber: string;
  activeStatus: string;
  enrolledOn: string;
  batchDetails: string;
  gender: string;
  batchTiming: string;
  preferredJobTrack: string;
  personalMailId: string;
  district: string;
  state: string;
  pincode: string;
  highestQualification: string;
  graduationDegreeName: string;
  graduationStream: string;
  graduationCollegeName: string;
  graduationYearOfPassing: string;
  graduationCgpa: string;
  postGraduationDegreeName: string;
  postGraduationStream: string;
  postGraduationCollegeName: string;
  postGraduationYearOfPassing: string;
  postGraduationCgpa: string;
  placedOrganisation: string;
  externalPlacedOrganisation: string;
  placementType: string;
  placedMonth: string;
  ctcLpa: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}
