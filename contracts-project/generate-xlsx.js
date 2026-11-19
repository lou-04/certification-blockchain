const XLSX = require("xlsx");
const rows = [
  { studentName: "Amina Benali",  studentId: "2023-INF-042", diplomaTitle: "Licence Informatique", issueDate: "2026-06-15", recipientAddress: "", grade: "Mention Bien" },
  { studentName: "Youssef El Idrissi", studentId: "2023-INF-043", diplomaTitle: "Licence Informatique", issueDate: "2026-06-15", recipientAddress: "", grade: "Mention Assez Bien" },
  { studentName: "Salma Tazi",    studentId: "2023-MAT-017", diplomaTitle: "Licence Mathématiques", issueDate: "2026-06-16", recipientAddress: "", grade: "Mention Très Bien" },
  { studentName: "Omar Alaoui",   studentId: "2023-INF-051", diplomaTitle: "Licence Informatique", issueDate: "2026-06-15", recipientAddress: "", grade: "Passable" },
  { studentName: "Khadija Mansouri", studentId: "2023-PHY-009", diplomaTitle: "Licence Physique", issueDate: "2026-06-17", recipientAddress: "", grade: "Mention Bien" },
];
const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Etudiants");
XLSX.writeFile(wb, "etudiants.xlsx");