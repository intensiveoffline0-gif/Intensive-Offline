import { part1 } from "./csvPart1";
import { part2 } from "./csvPart2";
import { part3 } from "./csvPart3";
import { part4 } from "./csvPart4";
import { part5 } from "./csvPart5";

const HEADERS = "Full Name,User ID,Student ID,Mobile Number,Active Status,Enrolled on,Batch Details,Batch Timing,Gender,Preferred Job Track,Your Personal Mail ID,Permanent Address District,Permanent State,Permanent Address Pincode,Highest Qualification,Graduation Degree Name,Graduation Stream,Graduation College / University Name,Graduation Year of Passing,Graduation CGPA ,Post-Graduation Degree Name,Post-Graduation Stream,Post-Graduation College / University Name,Post Graduation Year of Passing,Post Graduation CGPA / Percentage Obtained,Placed Organisation,External Placed Organisation,Placement Type,Placed Month,CTC(LPA)";

export const DEFAULT_STUDENT_CSV = HEADERS + "\n" + part1 + "\n" + part2 + "\n" + part3 + "\n" + part4 + "\n" + part5;
