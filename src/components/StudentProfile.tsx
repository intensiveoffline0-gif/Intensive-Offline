import React from "react";
import { Student } from "../types";
import { 
  User, Mail, Phone, MapPin, GraduationCap, Calendar, 
  Briefcase, Award, ClipboardCheck, Sparkles, Building, Bookmark,
  FileText, ExternalLink
} from "lucide-react";

interface StudentProfileProps {
  student: Student | null;
  onClose?: () => void;
}

export function StudentProfile({ student, onClose }: StudentProfileProps) {
  if (!student) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center text-slate-400">
        <User className="h-12 w-12 mx-auto mb-3 text-slate-350" />
        <p className="font-semibold text-sm">No Student Selected</p>
        <p className="text-xs mt-1">Select a student from the Master Registry or dropdown list to view their deep profile.</p>
      </div>
    );
  }

  const isPlaced = !!(student.placedOrganisation || student.externalPlacedOrganisation);
  const isRefunded = student.activeStatus?.toLowerCase() === "refunded";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div className="bg-slate-900 px-6 py-8 text-white relative">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {student.resume && (
            <a 
              href={student.resume} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 border border-blue-400/40 px-3 py-1 rounded-full text-xs font-semibold transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Resume</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider ${
            isRefunded ? "bg-red-400/20 text-red-300 border border-red-400/30" : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
          }`}>
            {student.activeStatus || "Active"}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {student.profilePhoto ? (
            <img 
              src={student.profilePhoto} 
              alt={student.fullName}
              className="h-16 w-16 rounded-full object-cover border-2 border-white/20 shadow-inner bg-slate-800"
              onError={(e) => {
                // fallback to letter avatar if image URL fails to load
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center font-extrabold text-2xl text-white shadow-inner">
              {student.fullName.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold flex items-center gap-1.5">{student.fullName}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-300">
              <span className="flex items-center gap-1 text-slate-200 bg-slate-800 px-2 py-0.5 rounded">
                <Bookmark className="h-3 w-3 text-blue-400" />
                ID: {student.studentId}
              </span>
              <span>•</span>
              <span>{student.batchDetails}</span>
              <span>•</span>
              <span className="text-blue-300 font-medium">{student.preferredJobTrack?.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Contact and Administrative info */}
        <div className="space-y-6">
          <div className="bg-slate-50/55 rounded-xl p-5 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4 text-blue-600" />
              Primary Metadata
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Student ID</span>
                <span className="font-semibold text-slate-800">{student.studentId}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Active Status</span>
                <span className={`font-semibold ${isRefunded ? "text-rose-600" : "text-emerald-600"}`}>
                  {student.activeStatus}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Enrolled On</span>
                <span className="font-semibold text-slate-700">{student.enrolledOn}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Batch details</span>
                <span className="font-semibold text-slate-700">{student.batchDetails}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Timing Slot</span>
                <span className="font-semibold text-slate-700">{student.batchTiming}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Gender</span>
                <span className="font-semibold text-slate-700">{student.gender || "N/A"}</span>
              </div>
              {student.centreName && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Centre Name</span>
                  <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[11px]">{student.centreName}</span>
                </div>
              )}
              {student.instructorName && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">Instructor</span>
                  <span className="font-semibold text-blue-600">{student.instructorName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50/55 rounded-xl p-5 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-blue-600" />
              Contact details
            </h3>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div className="p-1 px-1.5 bg-white border border-slate-200 rounded text-slate-55">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Personal Mail ID</p>
                  <p className="font-medium text-slate-800 break-all">{student.personalMailId || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1 px-1.5 bg-white border border-slate-200 rounded text-slate-55">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Mobile Number</p>
                  <p className="font-medium text-slate-800">{student.mobileNumber || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1 px-1.5 bg-white border border-slate-200 rounded text-slate-55">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Home Address</p>
                  <p className="font-medium text-slate-800">
                    {student.district ? `${student.district}, ` : ""}{student.state} - {student.pincode}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: Academics & Placements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Qualifications & Academics */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <GraduationCap className="h-4.5 w-4.5 text-blue-600" />
              Academic Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Undergraduate Section */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/20">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Graduation</span>
                  <span className="text-xs font-semibold text-slate-500">Degree Status</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-slate-800">{student.graduationDegreeName} in {student.graduationStream || "General"}</p>
                  <p className="text-slate-55 text-slate-600">{student.graduationCollegeName}</p>
                  <div className="flex justify-between text-slate-500 mt-2 font-medium">
                    <span>Passing Year: <strong className="text-slate-800">{student.graduationYearOfPassing}</strong></span>
                    <span>CGPA: <strong className="text-slate-800">{student.graduationCgpa || "N/A"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Postgraduate Section */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/20">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Post-Graduation</span>
                  <span className="text-xs font-semibold text-slate-500">Master Degree</span>
                </div>
                {student.postGraduationDegreeName ? (
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-800">{student.postGraduationDegreeName} in {student.postGraduationStream}</p>
                    <p className="text-slate-55 text-slate-600">{student.postGraduationCollegeName}</p>
                    <div className="flex justify-between text-slate-500 mt-2 font-medium">
                      <span>Passing Year: <strong className="text-slate-800">{student.postGraduationYearOfPassing}</strong></span>
                      <span>Avg Score: <strong className="text-slate-800">{student.postGraduationCgpa || "N/A"}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center py-6 text-center text-slate-450 text-xs">
                    <p>No Post-Graduation details submitted</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 bg-blue-50/50 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2">
              <span className="font-bold uppercase text-[9px] bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">Highest Qualification</span>
              <span className="font-medium text-slate-700">{student.highestQualification}</span>
            </div>
          </div>

          {/* Place Stats / Corporate Career */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-blue-600" />
              Corporate Placements
            </h3>

            {isPlaced ? (
              <div className="border border-blue-100 rounded-lg p-5 bg-gradient-to-tr from-blue-50/10 to-blue-50/30">
                <div className="flex items-center gap-2 text-sm text-blue-900 font-bold mb-4">
                  <Award className="h-5 w-5 text-blue-600" />
                  Placed Candidate Portfolio
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {student.placedOrganisation && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        Internal Placed Drive
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{student.placedOrganisation}</p>
                    </div>
                  )}

                  {student.externalPlacedOrganisation && (
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        External Placed Offcampus
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{student.externalPlacedOrganisation}</p>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      Job Type / Placement Month
                    </div>
                    <p className="font-bold text-slate-800 text-sm">
                      {student.placementType || "Full Time"}{" "}
                      <span className="text-slate-400 font-semibold text-xs">
                        {student.placedMonth ? `(${student.placedMonth})` : ""}
                      </span>
                    </p>
                  </div>

                  <div className="col-span-1 md:col-span-3 bg-blue-600 rounded-lg p-4 text-white flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Cost To Company (LPA)</span>
                      <p className="text-xl font-bold mt-0.5">{student.ctcLpa || "N/A"}</p>
                    </div>
                    <div className="text-[9px] font-bold tracking-widest text-blue-100 border border-blue-400/50 rounded uppercase px-2.5 py-1">
                      Placement Complete
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-500 text-xs">
                <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-350" />
                <p className="font-bold text-slate-700">Not Placed Yet</p>
                <p className="text-slate-400 mt-1 max-w-sm mx-auto">This student is currently in training/applied status. Placement details will load upon next successful drive recruitment logging.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
