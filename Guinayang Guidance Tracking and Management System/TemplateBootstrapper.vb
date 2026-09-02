Imports System.IO
Imports System.Text.Json

''' <summary>
''' Ships the demo with two working Word templates. If the Templates folder or
''' templates.json is missing, they are generated at startup (relative paths) so
''' the export features work out of the box on any machine.
''' </summary>
Public Module TemplateBootstrapper

    Private ReadOnly CaseTemplateId As String = "11111111-1111-1111-1111-111111111111"
    Private ReadOnly ReportTemplateId As String = "22222222-2222-2222-2222-222222222222"

    Public Sub EnsureDemoTemplates()
        Try
            Dim templatesDir = Path.Combine(Application.StartupPath, "Templates")
            Directory.CreateDirectory(templatesDir)

            Dim casePath = Path.Combine(templatesDir, "Case Report.docx")
            Dim reportPath = Path.Combine(templatesDir, "Incident Report.docx")

            If Not File.Exists(casePath) Then BuildCaseTemplate(casePath)
            If Not File.Exists(reportPath) Then BuildReportTemplate(reportPath)

            Dim jsonPath = Path.Combine(Application.StartupPath, "templates.json")
            If Not File.Exists(jsonPath) Then
                Dim entries = New List(Of Object) From {
                    New Dictionary(Of String, Object) From {{"Id", CaseTemplateId}, {"Name", "Case Report"}, {"Content", "Templates\Case Report.docx"}},
                    New Dictionary(Of String, Object) From {{"Id", ReportTemplateId}, {"Name", "Incident Report"}, {"Content", "Templates\Incident Report.docx"}}
                }
                File.WriteAllText(jsonPath, JsonSerializer.Serialize(entries, New JsonSerializerOptions With {.WriteIndented = True}))
            End If
        Catch ex As Exception
            AppLogger.WriteLog($"Template bootstrap failed: {ex.Message}")
        End Try
    End Sub

    Private Sub BuildCaseTemplate(path As String)
        Using doc = Xceed.Words.NET.DocX.Create(path)
            doc.InsertParagraph("{SchoolName}").FontSize(16).Bold().Alignment = Xceed.Document.NET.Alignment.center
            doc.InsertParagraph("Guidance Case Report").FontSize(13).Bold().Alignment = Xceed.Document.NET.Alignment.center
            doc.InsertParagraph("")
            For Each line In New String() {
                "Case ID: {CaseID}          Status: {CaseStatus}",
                "Student: {FirstName} {MiddleInitial} {Surname}   (LRN: {LRN})",
                "Grade & Section: {GradeLevel} - {Section}",
                "",
                "Date of Incident: {IncidentDate}     Time: {IncidentTime}",
                "Location: {Location}",
                "Police Notified: {PoliceNotified}",
                "",
                "Incident Description:",
                "{IncidentDescription}",
                "",
                "Witnesses: {Witnesses}",
                "Injured: {Injured}",
                "Injury Description: {InjuryDescription}",
                "Medical Treatment: {MedicalTreatment}",
                "Injury Location: {InjuryLocation}",
                "",
                "Resolution:",
                "{Resolution}",
                "Resolution Date: {ResolutionDate}",
                "Guidance Counselor: {GuidanceCounselor}",
                "",
                "Prepared: {ExportDateTime}",
                "{SchoolPrincipal}"
            }
                doc.InsertParagraph(line).FontSize(11)
            Next
            doc.Save()
        End Using
    End Sub

    Private Sub BuildReportTemplate(path As String)
        Using doc = Xceed.Words.NET.DocX.Create(path)
            doc.InsertParagraph("Guinayang National High School").FontSize(16).Bold().Alignment = Xceed.Document.NET.Alignment.center
            doc.InsertParagraph("Incident Report").FontSize(13).Bold().Alignment = Xceed.Document.NET.Alignment.center
            doc.InsertParagraph("")
            For Each line In New String() {
                "Reporter: {StudentName}",
                "Contact Info: {ContactInfo}",
                "",
                "Incident Type: {IncidentType}",
                "Urgency Level: {UrgencyLevel}",
                "Status: {Status}",
                "Date of Incident: {IncidentDate}",
                "Reported: {Timestamp}",
                "Location: {Location}",
                "",
                "Description:",
                "{Description}",
                "",
                "Attachments: {Attachments}"
            }
                doc.InsertParagraph(line).FontSize(11)
            Next
            doc.Save()
        End Using
    End Sub

End Module
