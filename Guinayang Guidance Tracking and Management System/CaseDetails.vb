Imports System.Text
Imports Microsoft.Data.Sqlite
Imports System.IO
Imports System.Text.Json
Imports Xceed.Words.NET
Imports Guinayang_Guidance_Tracking_and_Management_System.Templates

Public Class CaseDetails
#Region "Private Fields"
    Private currentCase As CaseRecord
    Private currentStudent As StudentRecord
    Private conn As SqliteConnection
    Private dbFilePath As String = "student_records.db"
    Private isNewCase As Boolean = False
    Private drag As Boolean
    Private mouseX As Integer
    Private mouseY As Integer
    Private originalStatus As String

    ' Injury-related controls for easy management
    Private injuryControls As List(Of Control)
    Private injuryCheckboxes As List(Of CheckBox)
#End Region

#Region "Constructors"
    Public Sub New(student As StudentRecord, caseRecord As CaseRecord, Optional isNew As Boolean = False)
        InitializeComponent()
        currentStudent = student
        currentCase = caseRecord
        isNewCase = isNew
        InitializeDatabase()
        InitializeInjuryControlLists()
        InitializeForm()
    End Sub

    Public Sub New(student As StudentRecord)
        InitializeComponent()
        currentStudent = student
        currentCase = New CaseRecord() With {
            .LRN = student.LRN,
            .FirstName = student.FirstName,
            .MiddleName = student.MiddleInitial,
            .LastName = student.Surname,
            .Date = DateTime.Now.ToString("yyyy-MM-dd"),
            .Time = DateTime.Now.ToString("HH:mm"),
            .Finalized = 0
        }
        isNewCase = True
        InitializeDatabase()
        InitializeInjuryControlLists()
        InitializeForm()
    End Sub
#End Region

#Region "Initialization Methods"
    Private Sub InitializeDatabase()
        conn = New SqliteConnection("Data Source=" & dbFilePath)
        conn.Open()
        DemoSeeder.EnsureSchema(conn)
    End Sub

    Private Sub InitializeInjuryControlLists()
        ' Initialize lists for injury-related controls
        injuryControls = New List(Of Control) From {
            TextBox9, CheckBox7, CheckBox8, CheckBox9, CheckBox10, CheckBox11, CheckBox12
        }

        injuryCheckboxes = New List(Of CheckBox) From {
            CheckBox7, CheckBox8, CheckBox9, CheckBox10, CheckBox11, CheckBox12
        }
    End Sub

    Private Sub InitializeForm()
        InitializeComboBox()
        SetupFormTextAndButtons()
        LoadCaseData()
        UpdateButtonStates()
    End Sub

    Private Sub InitializeComboBox()
        ComboBox1.Items.Clear()
        ComboBox1.Items.AddRange({"Ongoing", "Resolved"})

        If isNewCase Then
            ComboBox1.SelectedItem = "Ongoing"
        End If
    End Sub

    Private Sub SetupFormTextAndButtons()
        If isNewCase Then
            Me.Text = "Add New Case"
            Label2.Text = "Add Case"
            Label3.Text = "Update"
            Panel6.Visible = False
        Else
            Me.Text = "Case Details - " & currentCase.CaseID
            Label2.Text = "Delete"
            Label3.Text = "Update"
            Panel6.Visible = True
            originalStatus = If(currentCase.Finalized = 1, "Resolved", "Ongoing")
        End If
    End Sub
#End Region

#Region "Data Loading Methods"
    Private Sub LoadCaseData()
        LoadStudentInfo()
        LoadIncidentDetails()
        LoadInjuryInfo()
        LoadResolutionInfo()
        LoadCaseStatus()
        UpdateInjuryDetailsState()
    End Sub

    Private Sub LoadStudentInfo()
        ' Student info is always read-only
        TextBox1.Text = currentStudent.LRN
        TextBox2.Text = currentStudent.FirstName
        TextBox3.Text = currentStudent.MiddleInitial
        TextBox4.Text = currentStudent.Surname

        SetControlsReadOnly({TextBox1, TextBox2, TextBox3, TextBox4})
    End Sub

    Private Sub LoadIncidentDetails()
        TextBox5.Text = currentCase.Date
        TextBox6.Text = currentCase.Time
        TextBox7.Text = currentCase.Location
        TextBox8.Text = currentCase.IncidentDescription

        SetCheckboxState(CheckBox3, CheckBox4, currentCase.Witnesses, "No", "Yes")
    End Sub

    Private Sub LoadInjuryInfo()
        SetCheckboxState(CheckBox5, CheckBox6, currentCase.Injured, "No", "Yes")
        TextBox9.Text = currentCase.InjuryDescription

        ' Medical Treatment (three options)
        SetThreeStateCheckbox(CheckBox7, CheckBox8, CheckBox9, currentCase.MedicalTreatment, "No", "Yes", "Refused Treatment")

        ' Injury Location (three options)
        SetThreeStateCheckbox(CheckBox10, CheckBox11, CheckBox12, currentCase.InjuryLocation, "Other", "Emergency Room", "Body")
    End Sub

    Private Sub LoadResolutionInfo()
        SetCheckboxState(CheckBox1, CheckBox2, currentCase.PoliceNotified, "No", "Yes")
        TextBox11.Text = currentCase.GuidanceCouncilor
        TextBox10.Text = currentCase.Resolution
    End Sub

    Private Sub LoadCaseStatus()
        If currentCase.Finalized = 1 Then
            ComboBox1.SelectedItem = "Resolved"
            Label17.Text = "(RESOLVED)"
            TextBox12.Text = If(String.IsNullOrEmpty(currentCase.ResolutionDate), DateTime.Now.ToString("yyyy-MM-dd"), currentCase.ResolutionDate)
        Else
            ComboBox1.SelectedItem = "Ongoing"
            Label17.Text = "(ONGOING)"
            TextBox12.Text = ""
        End If
    End Sub
#End Region

#Region "Helper Methods"
    Private Sub SetControlsReadOnly(controls As IEnumerable(Of Control))
        For Each ctrl In controls
            If TypeOf ctrl Is TextBox Then
                Dim txt As TextBox = CType(ctrl, TextBox)
                txt.ReadOnly = True
                txt.BackColor = Color.WhiteSmoke
            End If
        Next
    End Sub

    Private Sub SetCheckboxState(checkboxNo As CheckBox, checkboxYes As CheckBox, value As String, noValue As String, yesValue As String)
        checkboxNo.Checked = (value = noValue)
        checkboxYes.Checked = (value = yesValue)
    End Sub

    Private Sub SetThreeStateCheckbox(checkbox1 As CheckBox, checkbox2 As CheckBox, checkbox3 As CheckBox, value As String, value1 As String, value2 As String, value3 As String)
        checkbox1.Checked = (value = value1)
        checkbox2.Checked = (value = value2)
        checkbox3.Checked = (value = value3)
    End Sub
#End Region

#Region "Checkbox Logic - Fixed Version"
    Private Sub UpdateInjuryDetailsState()
        Dim isInjured = CheckBox6.Checked
        Dim canEdit = CanEditInjuryDetails()

        ' Enable/disable all injury controls based on injured status
        For Each ctrl In injuryControls
            ctrl.Enabled = (isInjured AndAlso canEdit)
        Next

        ' Clear injury data if not injured OR if cannot edit
        If Not isInjured OrElse Not canEdit Then
            ClearInjuryData()
        End If

        ' Visual feedback
        TextBox9.BackColor = If(isInjured AndAlso canEdit, Color.White, Color.WhiteSmoke)
    End Sub

    Private Sub ClearInjuryData()
        TextBox9.Text = ""
        For Each cb In injuryCheckboxes
            cb.Checked = False
        Next
    End Sub

    Private Function CanEditInjuryDetails() As Boolean
        If isNewCase Then Return True

        Dim currentStatus = ComboBox1.SelectedItem?.ToString()
        Return (currentStatus = "Ongoing" AndAlso originalStatus = "Ongoing")
    End Function
#End Region

#Region "Checkbox Event Handlers"
    Private Sub HandleMutuallyExclusiveCheckboxes(sender As Object, e As EventArgs) Handles _
        CheckBox3.CheckedChanged, CheckBox4.CheckedChanged,
        CheckBox5.CheckedChanged, CheckBox6.CheckedChanged,
        CheckBox1.CheckedChanged, CheckBox2.CheckedChanged

        Dim checkbox = CType(sender, CheckBox)
        If checkbox.Checked Then
            UncheckOppositeCheckbox(checkbox)
        End If
    End Sub

    Private Sub HandleThreeStateCheckboxes(sender As Object, e As EventArgs) Handles _
        CheckBox7.CheckedChanged, CheckBox8.CheckedChanged, CheckBox9.CheckedChanged,
        CheckBox10.CheckedChanged, CheckBox11.CheckedChanged, CheckBox12.CheckedChanged

        Dim checkbox = CType(sender, CheckBox)
        If checkbox.Checked Then
            UncheckOtherCheckboxes(checkbox)
        End If
    End Sub

    ' Special handler for injury checkbox to update injury details state
    Private Sub CheckBox5_CheckedChanged(sender As Object, e As EventArgs) Handles CheckBox5.CheckedChanged
        If CheckBox5.Checked Then
            CheckBox6.Checked = False
            UpdateInjuryDetailsState()
        End If
    End Sub

    Private Sub CheckBox6_CheckedChanged(sender As Object, e As EventArgs) Handles CheckBox6.CheckedChanged
        If CheckBox6.Checked Then
            CheckBox5.Checked = False
            UpdateInjuryDetailsState()
        End If
    End Sub
#End Region

#Region "Checkbox Helper Methods"
    Private Sub UncheckOppositeCheckbox(checkedCheckbox As CheckBox)
        Dim oppositePairs As New Dictionary(Of CheckBox, CheckBox) From {
            {CheckBox3, CheckBox4}, {CheckBox4, CheckBox3},
            {CheckBox5, CheckBox6}, {CheckBox6, CheckBox5},
            {CheckBox1, CheckBox2}, {CheckBox2, CheckBox1}
        }

        If oppositePairs.ContainsKey(checkedCheckbox) Then
            oppositePairs(checkedCheckbox).Checked = False
        End If
    End Sub

    Private Sub UncheckOtherCheckboxes(checkedCheckbox As CheckBox)
        Dim checkboxGroups As New Dictionary(Of CheckBox, List(Of CheckBox)) From {
            {CheckBox7, New List(Of CheckBox) From {CheckBox8, CheckBox9}},
            {CheckBox8, New List(Of CheckBox) From {CheckBox7, CheckBox9}},
            {CheckBox9, New List(Of CheckBox) From {CheckBox7, CheckBox8}},
            {CheckBox10, New List(Of CheckBox) From {CheckBox11, CheckBox12}},
            {CheckBox11, New List(Of CheckBox) From {CheckBox10, CheckBox12}},
            {CheckBox12, New List(Of CheckBox) From {CheckBox10, CheckBox11}}
        }

        If checkboxGroups.ContainsKey(checkedCheckbox) Then
            For Each cb In checkboxGroups(checkedCheckbox)
                cb.Checked = False
            Next
        End If
    End Sub
#End Region

#Region "Form State Management"
    Private Sub UpdateButtonStates()
        Dim isResolved = (ComboBox1.SelectedItem?.ToString() = "Resolved")
        Dim isNewlyResolved = (isResolved AndAlso originalStatus = "Ongoing")
        Dim canEdit = (isNewCase OrElse (Not isResolved AndAlso Not isNewlyResolved))

        UpdateEditableControls(canEdit)
        UpdateButtonTextAndVisibility(isResolved, isNewlyResolved)
        UpdateResolutionDateField(isResolved, isNewlyResolved)

        ' Update injury details state when status changes
        UpdateInjuryDetailsState()
    End Sub

    Private Sub UpdateEditableControls(canEdit As Boolean)
        Dim editableControls As List(Of Control) = New List(Of Control) From {
            TextBox5, TextBox6, TextBox7, TextBox8, TextBox11, TextBox10, TextBox12
        }

        For Each ctrl In editableControls
            ctrl.Enabled = canEdit
        Next

        Dim editableCheckboxes As List(Of CheckBox) = New List(Of CheckBox) From {
            CheckBox3, CheckBox4, CheckBox5, CheckBox6, CheckBox1, CheckBox2
        }

        For Each cb In editableCheckboxes
            cb.Enabled = canEdit
        Next

        ' ComboBox is always enabled for status changes
        ComboBox1.Enabled = True
    End Sub

    Private Sub UpdateButtonTextAndVisibility(isResolved As Boolean, isNewlyResolved As Boolean)
        If isNewCase Then
            Label2.Text = "Add Case"
            Panel6.Visible = False
        Else
            Label2.Text = "Delete"
            Panel6.Visible = True
            Label3.Text = If(isResolved AndAlso Not isNewlyResolved, "Export", "Update")
        End If
    End Sub

    Private Sub UpdateResolutionDateField(isResolved As Boolean, isNewlyResolved As Boolean)
        TextBox12.Visible = (isResolved AndAlso Not isNewCase)

        If isNewlyResolved AndAlso String.IsNullOrEmpty(TextBox12.Text) Then
            TextBox12.Text = DateTime.Now.ToString("yyyy-MM-dd")
        End If
    End Sub

    Private Sub ComboBox1_SelectedIndexChanged(sender As Object, e As EventArgs) Handles ComboBox1.SelectedIndexChanged
        UpdateButtonStates()
    End Sub
#End Region

#Region "Button Handlers"
    Private Sub HandleDeleteAddButton()
        If isNewCase Then
            AddCase()
        Else
            DeleteCase()
        End If
    End Sub

    Private Sub HandleUpdateExportButton()
        If Label3.Text = "Update" Then
            UpdateCase()
        Else
            ExportCaseToWord()
        End If
    End Sub

    Private Sub AddCase()
        If ValidateInput() AndAlso SaveCase() Then
            Me.DialogResult = DialogResult.OK
            Me.Close()
        End If
    End Sub

    Private Sub UpdateCase()
        If ValidateInput() AndAlso SaveCase() Then
            originalStatus = ComboBox1.SelectedItem?.ToString()
            Me.DialogResult = DialogResult.OK
            Me.Close()
        End If
    End Sub

    Private Sub DeleteCase()
        If MessageBox.Show("Are you sure you want to delete this case? This action cannot be undone!",
                         "Confirm Delete", MessageBoxButtons.YesNo, MessageBoxIcon.Warning) = DialogResult.Yes Then
            If DeleteCaseFromDatabase() Then
                Me.DialogResult = DialogResult.OK
                Me.Close()
            End If
        End If
    End Sub
#End Region

#Region "Data Validation"
    Private Function ValidateInput() As Boolean
        Dim validations As New List(Of Func(Of Boolean)) From {
            Function() ValidateRequiredField(TextBox5, "date of incident"),
            Function() ValidateRequiredField(TextBox7, "location of incident"),
            Function() ValidateRequiredField(TextBox8, "incident description"),
            Function() ValidateCheckboxSelection(CheckBox3, CheckBox4, "whether there were witnesses"),
            Function() ValidateCheckboxSelection(CheckBox5, CheckBox6, "whether anyone was injured"),
            Function() ValidateInjuryDescription(),
            Function() ValidateCheckboxSelection(CheckBox1, CheckBox2, "whether police were notified")
        }

        For Each validation In validations
            If Not validation() Then Return False
        Next

        Return True
    End Function

    Private Function ValidateRequiredField(textBox As TextBox, fieldName As String) As Boolean
        If String.IsNullOrWhiteSpace(textBox.Text) Then
            MessageBox.Show($"Please enter the {fieldName}.", "Missing Information", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If
        Return True
    End Function

    Private Function ValidateCheckboxSelection(checkbox1 As CheckBox, checkbox2 As CheckBox, fieldName As String) As Boolean
        If Not checkbox1.Checked AndAlso Not checkbox2.Checked Then
            MessageBox.Show($"Please select {fieldName}.", "Missing Information", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If
        Return True
    End Function

    Private Function ValidateInjuryDescription() As Boolean
        If CheckBox6.Checked AndAlso String.IsNullOrWhiteSpace(TextBox9.Text) Then
            MessageBox.Show("Please enter injury description when 'Yes' is selected for injured.", "Missing Information", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If
        Return True
    End Function
#End Region

#Region "Database Operations"
    Private Function SaveCase() As Boolean
        Try
            UpdateCaseFromForm()
            Return If(isNewCase, InsertCase(), UpdateExistingCase())
        Catch ex As Exception
            MessageBox.Show($"Error saving case: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return False
        End Try
    End Function

    Private Sub UpdateCaseFromForm()
        With currentCase
            .Date = TextBox5.Text
            .Time = TextBox6.Text
            .Location = TextBox7.Text
            .IncidentDescription = TextBox8.Text
            .Witnesses = GetCheckboxValue(CheckBox3, CheckBox4, "No", "Yes")
            .Injured = GetCheckboxValue(CheckBox5, CheckBox6, "No", "Yes")
            .InjuryDescription = TextBox9.Text
            .MedicalTreatment = GetThreeStateCheckboxValue(CheckBox7, CheckBox8, CheckBox9, "No", "Yes", "Refused Treatment")
            .InjuryLocation = GetThreeStateCheckboxValue(CheckBox10, CheckBox11, CheckBox12, "Other", "Emergency Room", "Body")
            .PoliceNotified = GetCheckboxValue(CheckBox1, CheckBox2, "No", "Yes")
            .GuidanceCouncilor = TextBox11.Text
            .Resolution = TextBox10.Text
            .Finalized = If(ComboBox1.SelectedItem?.ToString() = "Resolved", 1, 0)
            .ResolutionDate = If(.Finalized = 1, TextBox12.Text, "")
        End With
    End Sub

    Private Function GetCheckboxValue(checkboxNo As CheckBox, checkboxYes As CheckBox, noValue As String, yesValue As String) As String
        Return If(checkboxYes.Checked, yesValue, If(checkboxNo.Checked, noValue, ""))
    End Function

    Private Function GetThreeStateCheckboxValue(checkbox1 As CheckBox, checkbox2 As CheckBox, checkbox3 As CheckBox, value1 As String, value2 As String, value3 As String) As String
        Return If(checkbox1.Checked, value1, If(checkbox2.Checked, value2, If(checkbox3.Checked, value3, "")))
    End Function

    Private Function InsertCase() As Boolean
        Dim query As String = "INSERT INTO CaseRecords (LRN, FirstName, MiddleName, LastName, Date, Time, Location, IncidentDescription, Witnesses, Injured, InjuryDescription, MedicalTreatment, InjuryLocation, PoliceNotified, GuidanceCouncilor, Resolution, Finalized, ResolutionDate) VALUES (@LRN, @FirstName, @MiddleName, @LastName, @Date, @Time, @Location, @IncidentDescription, @Witnesses, @Injured, @InjuryDescription, @MedicalTreatment, @InjuryLocation, @PoliceNotified, @GuidanceCouncilor, @Resolution, @Finalized, @ResolutionDate)"

        Using cmd As New SqliteCommand(query, conn)
            AddCaseParameters(cmd)
            cmd.ExecuteNonQuery()
        End Using

        MessageBox.Show("Case added successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
        Return True
    End Function

    Private Function UpdateExistingCase() As Boolean
        Dim query As String = "UPDATE CaseRecords SET Date = @Date, Time = @Time, Location = @Location, IncidentDescription = @IncidentDescription, Witnesses = @Witnesses, Injured = @Injured, InjuryDescription = @InjuryDescription, MedicalTreatment = @MedicalTreatment, InjuryLocation = @InjuryLocation, PoliceNotified = @PoliceNotified, GuidanceCouncilor = @GuidanceCouncilor, Resolution = @Resolution, Finalized = @Finalized, ResolutionDate = @ResolutionDate WHERE CaseID = @CaseID"

        Using cmd As New SqliteCommand(query, conn)
            AddCaseParameters(cmd)
            cmd.Parameters.AddWithValue("@CaseID", currentCase.CaseID)
            cmd.ExecuteNonQuery()
        End Using

        MessageBox.Show("Case updated successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
        Return True
    End Function

    Private Sub AddCaseParameters(cmd As SqliteCommand)
        With currentCase
            cmd.Parameters.AddWithValue("@LRN", .LRN)
            cmd.Parameters.AddWithValue("@FirstName", .FirstName)
            cmd.Parameters.AddWithValue("@MiddleName", .MiddleName)
            cmd.Parameters.AddWithValue("@LastName", .LastName)
            cmd.Parameters.AddWithValue("@Date", .Date)
            cmd.Parameters.AddWithValue("@Time", .Time)
            cmd.Parameters.AddWithValue("@Location", .Location)
            cmd.Parameters.AddWithValue("@IncidentDescription", .IncidentDescription)
            cmd.Parameters.AddWithValue("@Witnesses", .Witnesses)
            cmd.Parameters.AddWithValue("@Injured", .Injured)
            cmd.Parameters.AddWithValue("@InjuryDescription", .InjuryDescription)
            cmd.Parameters.AddWithValue("@MedicalTreatment", .MedicalTreatment)
            cmd.Parameters.AddWithValue("@InjuryLocation", .InjuryLocation)
            cmd.Parameters.AddWithValue("@PoliceNotified", .PoliceNotified)
            cmd.Parameters.AddWithValue("@GuidanceCouncilor", .GuidanceCouncilor)
            cmd.Parameters.AddWithValue("@Resolution", .Resolution)
            cmd.Parameters.AddWithValue("@Finalized", .Finalized)
            cmd.Parameters.AddWithValue("@ResolutionDate", If(String.IsNullOrEmpty(.ResolutionDate), DBNull.Value, .ResolutionDate))
        End With
    End Sub

    Private Function DeleteCaseFromDatabase() As Boolean
        Try
            Dim query As String = "DELETE FROM CaseRecords WHERE CaseID = @CaseID"
            Using cmd As New SqliteCommand(query, conn)
                cmd.Parameters.AddWithValue("@CaseID", currentCase.CaseID)
                cmd.ExecuteNonQuery()
            End Using

            MessageBox.Show("Case deleted successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Return True
        Catch ex As Exception
            MessageBox.Show($"Error deleting case: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return False
        End Try
    End Function
#End Region

#Region "Export Functionality"
    Private Sub ExportCaseToWord()
        Try
            Dim templates = LoadTemplates()
            If templates.Count = 0 Then
                MessageBox.Show("No templates available. Please create templates first.", "No Templates", MessageBoxButtons.OK, MessageBoxIcon.Warning)
                Return
            End If

            Using templateForm As New SelectTemplateDialog(templates)
                If templateForm.ShowDialog() = DialogResult.OK Then
                    Dim selectedTemplate = templateForm.SelectedTemplate
                    If selectedTemplate IsNot Nothing Then
                        GenerateWordDocument(selectedTemplate)
                    End If
                End If
            End Using
        Catch ex As Exception
            MessageBox.Show($"Error exporting case: {ex.Message}", "Export Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub

    Private Function LoadTemplates() As List(Of TemplateModel)
        Dim templates As New List(Of TemplateModel)()
        Dim templatesFile = IO.Path.Combine(System.Windows.Forms.Application.StartupPath, "templates.json")

        Try
            If File.Exists(templatesFile) Then
                Dim json = File.ReadAllText(templatesFile)
                templates = JsonSerializer.Deserialize(Of List(Of TemplateModel))(json)
            End If
        Catch ex As Exception
            AppLogger.WriteLog($"Error loading templates: {ex.Message}")
        End Try

        Return templates
    End Function

    Private Sub GenerateWordDocument(template As TemplateModel)
        Try
            Dim exportDir As String = AppPaths.CaseExports

            ' Generate output filename
            Dim fileName As String = $"Case_{currentCase.CaseID}_{DateTime.Now:yyyyMMdd_HHmmss}.docx"
            Dim filePath As String = Path.Combine(exportDir, fileName)

            ' Get student's academic info
            Dim gradeLevel As String = GetStudentGradeLevel()
            Dim section As String = GetStudentSection()

            ' Copy template to destination
            File.Copy(AppPaths.ResolveTemplatePath(template.Content), filePath, True)

            ' Open and process the document
            Using doc = Xceed.Words.NET.DocX.Load(filePath)
                ' Replace placeholders with actual data
                ReplacePlaceholders(doc, gradeLevel, section)

                ' Save the document
                doc.Save()
            End Using

            MessageBox.Show($"Case exported successfully to:{vbCrLf}{filePath}", "Export Success", MessageBoxButtons.OK, MessageBoxIcon.Information)

        Catch ex As Exception
            MessageBox.Show($"Error generating Word document: {ex.Message}", "Export Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub

    ' DocX 5.0.0's 2-arg ReplaceText resolves to a [Obsolete] overload; behaviour is fine for the demo.
#Disable Warning BC40000
    Private Sub ReplacePlaceholders(doc As Xceed.Words.NET.DocX, gradeLevel As String, section As String)
        ' Student Information
        doc.ReplaceText("{LRN}", currentStudent.LRN)
        doc.ReplaceText("{Surname}", currentStudent.Surname)
        doc.ReplaceText("{FirstName}", currentStudent.FirstName)
        doc.ReplaceText("{MiddleInitial}", currentStudent.MiddleInitial + ".")
        doc.ReplaceText("{GradeLevel}", gradeLevel)
        doc.ReplaceText("{Section}", section)

        ' Incident Details
        doc.ReplaceText("{CaseID}", currentCase.CaseID.ToString())
        doc.ReplaceText("{IncidentDate}", currentCase.Date)
        doc.ReplaceText("{IncidentTime}", currentCase.Time)
        doc.ReplaceText("{Location}", currentCase.Location)
        doc.ReplaceText("{IncidentDescription}", currentCase.IncidentDescription)
        doc.ReplaceText("{Witnesses}", currentCase.Witnesses)

        ' Injury Information
        doc.ReplaceText("{Injured}", currentCase.Injured)
        doc.ReplaceText("{InjuryDescription}", currentCase.InjuryDescription)
        doc.ReplaceText("{MedicalTreatment}", currentCase.MedicalTreatment)
        doc.ReplaceText("{InjuryLocation}", currentCase.InjuryLocation)

        ' Resolution
        doc.ReplaceText("{PoliceNotified}", currentCase.PoliceNotified)
        doc.ReplaceText("{GuidanceCounselor}", currentCase.GuidanceCouncilor)
        doc.ReplaceText("{Resolution}", currentCase.Resolution)
        doc.ReplaceText("{CaseStatus}", If(currentCase.Finalized = 1, "Resolved", "Ongoing"))
        doc.ReplaceText("{ResolutionDate}", If(String.IsNullOrEmpty(currentCase.ResolutionDate), "N/A", currentCase.ResolutionDate))

        ' School and Export Info
        doc.ReplaceText("{SchoolName}", "Guinayang National High School")
        doc.ReplaceText("{SchoolPrincipal}", "School Principal")
        doc.ReplaceText("{ExportDate}", DateTime.Now.ToString("yyyy-MM-dd"))
        doc.ReplaceText("{ExportDateTime}", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"))

        ' Final cleanup - replace any remaining {placeholder} patterns with empty strings
        FinalCleanupPlaceholders(doc)
    End Sub

    ' NEW METHOD: Final cleanup of any remaining placeholders
    Private Sub FinalCleanupPlaceholders(doc As Xceed.Words.NET.DocX)
        Try
            ' Process each paragraph to find and remove any remaining placeholders
            For Each paragraph In doc.Paragraphs
                Dim text As String = paragraph.Text
                Dim modifiedText As String = text

                ' Use regex to find all {placeholder} patterns and replace with empty string
                Dim regex As New Text.RegularExpressions.Regex("\{.*?\}")
                modifiedText = regex.Replace(modifiedText, "")

                ' If text was modified, update the paragraph
                If modifiedText <> text Then
                    paragraph.ReplaceText(text, modifiedText)
                End If
            Next

        Catch ex As Exception
            AppLogger.WriteLog($"Error in final placeholder cleanup: {ex.Message}")
        End Try
    End Sub
#Enable Warning BC40000

    Private Function GetStudentGradeLevel() As String
        Try
            Dim query = "SELECT Grade FROM AcademicHistory WHERE LRN = @LRN ORDER BY SchoolYear DESC LIMIT 1"
            Using cmd As New SqliteCommand(query, conn)
                cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
                Dim result = cmd.ExecuteScalar()
                Return If(result IsNot Nothing, result.ToString(), "N/A")
            End Using
        Catch ex As Exception
            AppLogger.WriteLog($"GetStudentGradeLevel failed: {ex.Message}")
            Return "N/A"
        End Try
    End Function

    Private Function GetStudentSection() As String
        Try
            Dim query = "SELECT Section FROM AcademicHistory WHERE LRN = @LRN ORDER BY SchoolYear DESC LIMIT 1"
            Using cmd As New SqliteCommand(query, conn)
                cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
                Dim result = cmd.ExecuteScalar()
                Return If(result IsNot Nothing, result.ToString(), "N/A")
            End Using
        Catch ex As Exception
            AppLogger.WriteLog($"GetStudentSection failed: {ex.Message}")
            Return "N/A"
        End Try
    End Function
#End Region

#Region "Form Events"
    Private Sub Panel4_Click(sender As Object, e As EventArgs) Handles Panel4.Click, Label1.Click
        Me.DialogResult = DialogResult.Cancel
        Me.Close()
    End Sub

    Private Sub Panel5_Click(sender As Object, e As EventArgs) Handles Panel5.Click, Label2.Click
        HandleDeleteAddButton()
    End Sub

    Private Sub Panel6_Click(sender As Object, e As EventArgs) Handles Panel6.Click, Label3.Click
        HandleUpdateExportButton()
    End Sub
#End Region

#Region "Mouse Events for Dragging"
    Private Sub Panel1_MouseDown(sender As Object, e As MouseEventArgs) Handles Panel1.MouseDown
        drag = True
        mouseX = Cursor.Position.X - Me.Left
        mouseY = Cursor.Position.Y - Me.Top
    End Sub

    Private Sub Panel1_MouseMove(sender As Object, e As MouseEventArgs) Handles Panel1.MouseMove
        If drag Then
            Me.Left = Cursor.Position.X - mouseX
            Me.Top = Cursor.Position.Y - mouseY
        End If
    End Sub

    Private Sub Panel1_MouseUp(sender As Object, e As MouseEventArgs) Handles Panel1.MouseUp
        drag = False
    End Sub

    Private Sub Panel2_MouseDown(sender As Object, e As MouseEventArgs) Handles Panel2.MouseDown
        drag = True
        mouseX = Cursor.Position.X - Me.Left
        mouseY = Cursor.Position.Y - Me.Top
    End Sub

    Private Sub Panel2_MouseMove(sender As Object, e As MouseEventArgs) Handles Panel2.MouseMove
        If drag Then
            Me.Left = Cursor.Position.X - mouseX
            Me.Top = Cursor.Position.Y - mouseY
        End If
    End Sub

    Private Sub Panel2_MouseUp(sender As Object, e As MouseEventArgs) Handles Panel2.MouseUp
        drag = False
    End Sub
#End Region

#Region "Panel Hover Effects"
    Private Sub Panel4_MouseEnter(sender As Object, e As EventArgs) Handles Panel4.MouseEnter
        Panel4.BackColor = UiTheme.AccentDark
    End Sub

    Private Sub Panel4_MouseLeave(sender As Object, e As EventArgs) Handles Panel4.MouseLeave
        Panel4.BackColor = UiTheme.Accent
    End Sub

    Private Sub Panel5_MouseEnter(sender As Object, e As EventArgs) Handles Panel5.MouseEnter
        Panel5.BackColor = UiTheme.PrimaryPressed
    End Sub

    Private Sub Panel5_MouseLeave(sender As Object, e As EventArgs) Handles Panel5.MouseLeave
        Panel5.BackColor = UiTheme.Primary
    End Sub

    Private Sub Panel6_MouseEnter(sender As Object, e As EventArgs) Handles Panel6.MouseEnter
        Panel6.BackColor = UiTheme.AccentDark
    End Sub

    Private Sub Panel6_MouseLeave(sender As Object, e As EventArgs) Handles Panel6.MouseLeave
        Panel6.BackColor = UiTheme.Accent
    End Sub
#End Region

#Region "Form Lifecycle Events"
    Private Sub CaseDetails_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        Me.FormBorderStyle = FormBorderStyle.None
        Me.StartPosition = FormStartPosition.CenterScreen
    End Sub

    Private Sub CaseDetails_FormClosing(sender As Object, e As FormClosingEventArgs) Handles MyBase.FormClosing
        conn?.Close()
        conn?.Dispose()
    End Sub

#End Region
End Class

