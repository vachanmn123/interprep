"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Globe,
  User,
  Mail,
  Phone,
  MapPin,
  LinkIcon,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Resume = {
  firstname?: string;
  lastname?: string;
  country?: string;
  email?: string[];
  phone?: string[];
  address?: string[];
  links?: string[];
  experiences?: Experience[];
  education?: Degree[];
  skills?: Skill[];
  certifications?: Certification[];
  languages?: Language[];
};

type Experience = {
  title?: string;
  company?: string;
  startdate?: string;
  enddate?: string;
  location?: string;
  description?: string;
};

type Degree = {
  title?: string;
  institution?: string;
  graduation?: string;
  specialization?: string;
};

type Skill = {
  name: string;
  type: "technical" | "soft";
};

type Certification = {
  title?: string;
  date?: string;
  issuer?: string;
};

type Language = {
  name: string;
  level: "native" | "fluent" | "intermediate" | "basic";
};

interface ResumeDataViewerProps {
  resumeData: string | object;
}

export default function ResumeDataViewer({
  resumeData,
}: ResumeDataViewerProps) {
  const [activeSection, setActiveSection] = useState<string>("personal");

  // Parse the resume data if it's a string
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const resume: Resume =
    typeof resumeData === "string"
      ? JSON.parse(resumeData)
      : (resumeData as Resume);

  const sections = [
    { id: "personal", label: "Personal", icon: <User className="h-4 w-4" /> },
    {
      id: "experience",
      label: "Experience",
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      id: "education",
      label: "Education",
      icon: <GraduationCap className="h-4 w-4" />,
    },
    { id: "skills", label: "Skills", icon: <Code className="h-4 w-4" /> },
    {
      id: "certifications",
      label: "Certifications",
      icon: <Award className="h-4 w-4" />,
    },
    {
      id: "languages",
      label: "Languages",
      icon: <Globe className="h-4 w-4" />,
    },
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Present";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
    } catch {
      return dateString;
    }
  };

  const getLanguageLevelColor = (level: string) => {
    switch (level) {
      case "native":
        return "bg-green-500";
      case "fluent":
        return "bg-blue-500";
      case "intermediate":
        return "bg-yellow-500";
      case "basic":
        return "bg-gray-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="mb-4 flex space-x-2 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeSection === section.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80",
            )}
          >
            {section.icon}
            <span className="ml-2">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {activeSection === "personal" && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-4 text-xl font-semibold">
                {resume.firstname} {resume.lastname}
              </h3>
              {resume.country && (
                <div className="mb-2 flex items-center">
                  <MapPin className="text-muted-foreground mr-2 h-4 w-4" />
                  <span>{resume.country}</span>
                </div>
              )}
              {resume.email && resume.email.length > 0 && (
                <div className="mb-2 flex items-center">
                  <Mail className="text-muted-foreground mr-2 h-4 w-4" />
                  <span>{resume.email[0]}</span>
                </div>
              )}
              {resume.phone && resume.phone.length > 0 && (
                <div className="mb-2 flex items-center">
                  <Phone className="text-muted-foreground mr-2 h-4 w-4" />
                  <span>{resume.phone[0]}</span>
                </div>
              )}
              {resume.address && resume.address.length > 0 && (
                <div className="mb-2 flex items-center">
                  <MapPin className="text-muted-foreground mr-2 h-4 w-4" />
                  <span>{resume.address[0]}</span>
                </div>
              )}
              {resume.links && resume.links.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-medium">Links</h4>
                  <div className="space-y-2">
                    {resume.links.map((link, index) => (
                      <div key={index} className="flex items-center">
                        <LinkIcon className="text-muted-foreground mr-2 h-4 w-4" />
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm text-blue-600 hover:underline"
                        >
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === "experience" && (
          <div className="space-y-4">
            {resume.experiences && resume.experiences.length > 0 ? (
              resume.experiences.map((exp, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{exp.title}</h3>
                        <p className="text-muted-foreground">{exp.company}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-muted-foreground flex items-center text-sm">
                          <Calendar className="mr-1 h-3 w-3" />
                          <span>
                            {formatDate(exp.startdate)} -{" "}
                            {formatDate(exp.enddate)}
                          </span>
                        </div>
                        {exp.location && (
                          <div className="text-muted-foreground mt-1 text-sm">
                            <MapPin className="mr-1 inline h-3 w-3" />
                            {exp.location}
                          </div>
                        )}
                      </div>
                    </div>
                    {exp.description && (
                      <div className="mt-3">
                        <p className="text-sm whitespace-pre-line">
                          {exp.description}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No experience information available
              </div>
            )}
          </div>
        )}

        {activeSection === "education" && (
          <div className="space-y-4">
            {resume.education && resume.education.length > 0 ? (
              resume.education.map((edu, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{edu.title}</h3>
                        <p className="text-muted-foreground">
                          {edu.institution}
                        </p>
                        {edu.specialization && (
                          <p className="mt-1 text-sm">{edu.specialization}</p>
                        )}
                      </div>
                      {edu.graduation && (
                        <div className="text-muted-foreground text-sm">
                          <Calendar className="mr-1 inline h-3 w-3" />
                          {formatDate(edu.graduation)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No education information available
              </div>
            )}
          </div>
        )}

        {activeSection === "skills" && (
          <Card>
            <CardContent className="pt-6">
              {resume.skills && resume.skills.length > 0 ? (
                <div>
                  <div className="mb-4">
                    <h3 className="mb-2 font-semibold">Technical Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills
                        .filter((skill) => skill.type === "technical")
                        .map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="mb-2 font-semibold">Soft Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {resume.skills
                        .filter((skill) => skill.type === "soft")
                        .map((skill, index) => (
                          <Badge key={index} variant="outline">
                            {skill.name}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  No skills information available
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeSection === "certifications" && (
          <div className="space-y-4">
            {resume.certifications && resume.certifications.length > 0 ? (
              resume.certifications.map((cert, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{cert.title}</h3>
                        {cert.issuer && (
                          <p className="text-muted-foreground">{cert.issuer}</p>
                        )}
                      </div>
                      {cert.date && (
                        <div className="text-muted-foreground text-sm">
                          <Calendar className="mr-1 inline h-3 w-3" />
                          {formatDate(cert.date)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                No certification information available
              </div>
            )}
          </div>
        )}

        {activeSection === "languages" && (
          <Card>
            <CardContent className="pt-6">
              {resume.languages && resume.languages.length > 0 ? (
                <div className="space-y-4">
                  {resume.languages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <span className="font-medium">{lang.name}</span>
                      <Badge
                        className={cn(
                          getLanguageLevelColor(lang.level),
                          "text-white",
                        )}
                      >
                        {lang.level.charAt(0).toUpperCase() +
                          lang.level.slice(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  No language information available
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
