import React, { useState, useEffect } from "react";
import { Student } from "../types";
import { 
  User, Mail, Phone, MapPin, GraduationCap, Calendar, 
  Briefcase, Award, ClipboardCheck, Sparkles, Building, Bookmark,
  FileText, ExternalLink, Clock
} from "lucide-react";
import { getBatchTimingSlot } from "../data/csvParser";

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
  const isRefunded = student.activeStatus.toLowerCase() === "refunded";
  const timingSlot = getBatchTimingSlot(student.batchDetails, student.batchTiming);

  const directPhotoUrl = student.profilePhoto?.trim();
  const proxyPhotoUrl = `/api/zoho/photo/${encodeURIComponent(student.studentId)}`;

  const [imgError, setImgError] = useState(false);
  const [currentImgSrc, setCurrentImgSrc] = useState<string>(directPhotoUrl || proxyPhotoUrl);

  useEffect(() => {
    setImgError(false);
    setCurrentImgSrc(directPhotoUrl || proxyPhotoUrl);
  }, [student.studentId, directPhotoUrl]);

  const handleImageError = () => {
    // Multi-tier resilient fallback: direct CDN -> proxy by ID -> proxy by raw URL -> vector SVG badge
    if (directPhotoUrl && currentImgSrc === directPhotoUrl) {
      setCurrentImgSrc(proxyPhotoUrl);
    } else if (directPhotoUrl && currentImgSrc !== `/api/zoho/image?url=${encodeURIComponent(directPhotoUrl)}`) {
      setCurrentImgSrc(`/api/zoho/image?url=${encodeURIComponent(directPhotoUrl)}`);
    } else {
      setImgError(true);
    }
  };

  const nameInitials = student.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join("") || student.fullName.charAt(0)?.toUpperCase() || "S";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-200">
      {/* Header Banner */}
      <div className="bg-slate-900 px-6 py-8 text-white relative">
        <div className="absolute right-4 top-4 flex items-center gap-2">
          {student.resume && (
            <a 
              href={student.resume} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-1.5 bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-400/40 px-3 py-1 rounded-full text-xs font-semibold transition-all"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Resume</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider border ${
            isRefunded ? "bg-rose-500/20 text-rose-300 border-rose-400/30" : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
          }`}>
            {isRefunded ? "Refunded" : "Active"}
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0">
            {!imgError ? (
              <img 
                key={`${student.studentId}_${currentImgSrc}`}
                src={currentImgSrc} 
                alt={student.fullName}
                referrerPolicy="no-referrer"
                className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover border-4 border-white/20 shadow-xl bg-slate-800 ring-2 ring-indigo-500/40"
                onError={handleImageError}
              />
            ) : (
              <div className="h-28 w-28 sm:h-32 sm:w-32 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 rounded-2xl flex flex-col items-center justify-center font-extrabold text-white shadow-xl border-4 border-white/20 ring-2 ring-indigo-500/40 select-none">
                <span className="text-3xl sm:text-4xl tracking-tight">
                  {nameInitials}
                </span>
                <span className="text-[10px] text-indigo-200 uppercase font-mono font-semibold tracking-wider mt-0.5">
                  {student.studentId}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">{student.fullName}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5 text-slate-200 bg-slate-800/90 px-2.5 py-1 rounded-md font-mono font-medium">
                <Bookmark className="h-3.5 w-3.5 text-indigo-400" />
                ID: {student.studentId}
              </span>
              <span>•</span>
              <span className="font-semibold text-indigo-200 font-mono">{student.batchDetails}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5 bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-md text-xs font-semibold">
                <Clock className="h-3.5 w-3.5 text-indigo-300" />
                {timingSlot}
              </span>
              <span>•</span>
              <span className="text-indigo-300 font-medium">{student.preferredJobTrack?.replace(/_/g, " ")}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Contact and Administrative info */}
        <div className="space-y-6">
          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4 text-indigo-600" />
              Primary Metadata
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Student ID</span>
                <span className="font-mono font-semibold text-slate-900">{student.studentId}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Active Status</span>
                <span className={`font-semibold px-2 py-0.5 rounded-full text-[11px] border ${
                  isRefunded 
                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {isRefunded ? "Refunded" : "Active"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Enrolled On</span>
                <span className="font-mono font-medium text-slate-700">{student.enrolledOn}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Batch details</span>
                <span className="font-mono font-semibold text-slate-800">{student.batchDetails}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Timing Slot</span>
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-xs border border-indigo-200 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  {timingSlot}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Gender</span>
                <span className="font-medium text-slate-700">{student.gender || "N/A"}</span>
              </div>
              {student.centreName && (
                <div className="flex justify-between items-center py-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Centre Name</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px]">{student.centreName}</span>
                </div>
              )}
              {student.instructorName && (
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500 font-medium">Instructor</span>
                  <span className="font-semibold text-slate-800">{student.instructorName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-indigo-600" />
              Contact details
            </h3>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-center gap-3">
                <div className="p-1 px-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-2xs">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Personal Mail ID</p>
                  <p className="font-medium text-slate-800 break-all">{student.personalMailId || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1 px-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-2xs">
                  <Phone className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Mobile Number</p>
                  <p className="font-mono font-medium text-slate-800">{student.mobileNumber || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-1 px-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 shadow-2xs">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Home Address</p>
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
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <GraduationCap className="h-4.5 w-4.5 text-indigo-600" />
              Academic Credentials
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Undergraduate Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">Graduation</span>
                  <span className="text-xs font-semibold text-slate-500">Degree Status</span>
                </div>
                <div className="space-y-2 text-xs">
                  <p className="font-bold text-slate-800">{student.graduationDegreeName} in {student.graduationStream || "General"}</p>
                  <p className="text-slate-600">{student.graduationCollegeName}</p>
                  <div className="flex justify-between text-slate-500 mt-2 font-medium">
                    <span>Passing Year: <strong className="font-mono text-slate-800">{student.graduationYearOfPassing}</strong></span>
                    <span>CGPA: <strong className="font-mono text-slate-800">{student.graduationCgpa || "N/A"}</strong></span>
                  </div>
                </div>
              </div>

              {/* Postgraduate Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Post-Graduation</span>
                  <span className="text-xs font-semibold text-slate-500">Master Degree</span>
                </div>
                {student.postGraduationDegreeName ? (
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-800">{student.postGraduationDegreeName} in {student.postGraduationStream}</p>
                    <p className="text-slate-600">{student.postGraduationCollegeName}</p>
                    <div className="flex justify-between text-slate-500 mt-2 font-medium">
                      <span>Passing Year: <strong className="font-mono text-slate-800">{student.postGraduationYearOfPassing}</strong></span>
                      <span>Avg Score: <strong className="font-mono text-slate-800">{student.postGraduationCgpa || "N/A"}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center py-6 text-center text-slate-400 text-xs">
                    <p>No Post-Graduation details submitted</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-900 flex items-center gap-2">
              <span className="font-bold uppercase text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Highest Qualification</span>
              <span className="font-medium text-slate-700">{student.highestQualification}</span>
            </div>
          </div>

          {/* Place Stats / Corporate Career */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="h-4.5 w-4.5 text-indigo-600" />
              Corporate Placements
            </h3>

            {isPlaced ? (
              <div className="border border-indigo-100 rounded-xl p-5 bg-indigo-50/30">
                <div className="flex items-center gap-2 text-sm text-indigo-900 font-bold mb-4">
                  <Award className="h-5 w-5 text-indigo-600" />
                  Placed Candidate Portfolio
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {student.placedOrganisation && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        Internal Placed Drive
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{student.placedOrganisation}</p>
                    </div>
                  )}

                  {student.externalPlacedOrganisation && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        External Placed Offcampus
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{student.externalPlacedOrganisation}</p>
                    </div>
                  )}

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase mb-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      Job Type / Placement Month
                    </div>
                    <p className="font-bold text-slate-800 text-sm">
                      {student.placementType || "Full Time"}{" "}
                      <span className="text-slate-400 font-semibold text-xs">
                        {student.placedMonth ? `(${student.placedMonth})` : ""}
                      </span>
                    </p>
                  </div>

                  <div className="col-span-1 md:col-span-3 bg-indigo-600 rounded-xl p-4 text-white flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-200">Cost To Company (CTC)</span>
                      <p className="text-2xl font-extrabold mt-0.5 font-mono">{student.ctcLpa || "N/A"}</p>
                    </div>
                    <div className="text-[10px] font-bold tracking-wider text-indigo-100 bg-indigo-700/60 border border-indigo-400/40 rounded-lg uppercase px-3 py-1">
                      Placement Complete
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                <Briefcase className="h-8 w-8 mx-auto mb-2 text-slate-400" />
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
