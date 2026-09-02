Imports System.Drawing.Drawing2D
Imports System.Text
Imports Microsoft.Data.Sqlite

Public Class ViewRec
    Private currentStudent As StudentRecord
    Private conn As SqliteConnection
    Private dbFilePath As String = "student_records.db"
    Private drag As Boolean
    Private mouseX As Integer
    Private mouseY As Integer
    Private isEditMode As Boolean = False

    ' --- Form Initialization ---

    Private Sub InitializeDatabase()
        conn = New SqliteConnection("Data Source=" & dbFilePath)
        conn.Open()
        DemoSeeder.EnsureSchema(conn)
    End Sub

    Private Sub InitializeComboBox()
        ' Add items to combobox
        ComboBox1.Items.Add("Academic History")
        ComboBox1.Items.Add("Case Records")

        ' Style the combobox
        ComboBox1.DropDownStyle = ComboBoxStyle.DropDownList
        ComboBox1.Font = New Font("Segoe UI", 10)
        ComboBox1.FlatStyle = FlatStyle.Flat

        ' Now set the default selection
        ComboBox1.SelectedIndex = 0
    End Sub

    ' --- Update Button States Based on ComboBox Selection ---
    Private Sub UpdateButtonStates()
        If ComboBox1.SelectedItem Is Nothing Then Return

        Select Case ComboBox1.SelectedItem.ToString()
            Case "Academic History"
                Button1.Text = "Add"
                Button2.Text = "Delete"
                Button3.Text = "View Cases"
            Case "Case Records"
                Button1.Text = "Add"
                Button2.Text = "Delete"
                Button3.Text = "View"
        End Select
    End Sub

    ' --- Student Info Display ---
    Private Sub LoadStudentInfo()
        TextBox2.Text = currentStudent.LRN
        TextBox1.Text = currentStudent.Surname & ", " & currentStudent.FirstName & " " & currentStudent.MiddleInitial
        TextBox5.Text = currentStudent.Age.ToString()
        TextBox3.Text = currentStudent.Email
        TextBox4.Text = currentStudent.Birthday
        TextBox6.Text = currentStudent.ContactNumber
        TextBox7.Text = currentStudent.Address
        TextBox8.Text = currentStudent.GuardianName
        TextBox9.Text = currentStudent.GuardianContactNo
        TextBox10.Text = currentStudent.GuardianRelationship
    End Sub

    ' --- Column Creation Methods ---
    Private Sub CreateAcademicHistoryColumns()
        DataGridView1.Columns.Clear() ' Ensure columns are cleared

        ' Add columns for academic history - ALL 5 COLUMNS
        DataGridView1.Columns.Add("Grade", "Grade Level")
        DataGridView1.Columns.Add("SchoolYear", "School Year")
        DataGridView1.Columns.Add("Adviser", "Adviser")
        DataGridView1.Columns.Add("Section", "Section")
        DataGridView1.Columns.Add("CaseCount", "Cases")

        ' Style the columns
        For Each column As DataGridViewColumn In DataGridView1.Columns
            column.HeaderCell.Style.Font = New Font("Segoe UI", 9, FontStyle.Bold)
            column.DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter
        Next

        ' Set specific widths
        DataGridView1.Columns("Grade").Width = 80
        DataGridView1.Columns("SchoolYear").Width = 120
        DataGridView1.Columns("Adviser").Width = 150
        DataGridView1.Columns("Section").Width = 100
        DataGridView1.Columns("CaseCount").Width = 80
    End Sub

    Private Sub CreateCaseColumns()
        DataGridView1.Columns.Clear() ' Ensure columns are cleared

        ' Add columns for cases
        DataGridView1.Columns.Add("CaseID", "Case ID")
        DataGridView1.Columns.Add("Date", "Date")
        DataGridView1.Columns.Add("Severity", "Severity")
        DataGridView1.Columns.Add("Status", "Status")
        DataGridView1.Columns.Add("Location", "Location")
        DataGridView1.Columns.Add("Description", "Description")
        DataGridView1.Columns.Add("Resolution", "Resolution")

        ' Style the columns
        For Each column As DataGridViewColumn In DataGridView1.Columns
            column.HeaderCell.Style.Font = New Font("Segoe UI", 9, FontStyle.Bold)
            column.DefaultCellStyle.Alignment = DataGridViewContentAlignment.MiddleCenter
        Next

        ' Set specific widths
        DataGridView1.Columns("CaseID").Width = 70
        DataGridView1.Columns("Date").Width = 100
        DataGridView1.Columns("Severity").Width = 80
        DataGridView1.Columns("Status").Width = 90
        DataGridView1.Columns("Location").Width = 120
    End Sub

    ' --- ComboBox Event Handler ---
    Private Sub ComboBox1_SelectedIndexChanged(sender As Object, e As EventArgs) Handles ComboBox1.SelectedIndexChanged
        If ComboBox1.SelectedItem IsNot Nothing Then
            ' Clear existing data and columns first
            DataGridView1.Rows.Clear()
            DataGridView1.Columns.Clear()

            Select Case ComboBox1.SelectedItem.ToString()
                Case "Academic History"
                    CreateAcademicHistoryColumns()
                    LoadAcademicHistory()
                Case "Case Records"
                    CreateCaseColumns()
                    LoadCases()
            End Select

            UpdateButtonStates() ' Update buttons when view changes
        End If
    End Sub

    ' --- Data Loading Methods ---
    Private Sub LoadAcademicHistory()
        DataGridView1.Rows.Clear()

        ' Query to get academic history with case counts
        Dim query As String = "SELECT 
                        ah.Grade,
                        ah.SchoolYear,
                        ah.Adviser,
                        ah.Section,
                        COUNT(cr.CaseID) AS CaseCount
                      FROM AcademicHistory ah
                      LEFT JOIN CaseRecords cr ON ah.LRN = cr.LRN AND SUBSTR(cr.Date, 1, 4) = SUBSTR(ah.SchoolYear, 1, 4)
                      WHERE ah.LRN = @LRN
                      GROUP BY ah.Grade, ah.SchoolYear, ah.Adviser, ah.Section
                      ORDER BY 
                        CAST(SUBSTR(ah.SchoolYear, 1, 4) AS INTEGER) DESC,
                        ah.Grade DESC"

        Using cmd As New SqliteCommand(query, conn)
            cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
            Using reader As SqliteDataReader = cmd.ExecuteReader()
                While reader.Read()
                    DataGridView1.Rows.Add(
                    reader("Grade").ToString(),
                    reader("SchoolYear").ToString(),
                    reader("Adviser").ToString(),
                    reader("Section").ToString(),
                    reader("CaseCount").ToString()
                )
                End While
            End Using
        End Using
    End Sub

    Private Sub LoadCases()
        DataGridView1.Rows.Clear()
        Dim query As String = "SELECT 
                            CaseID,
                            Date,
                            CASE 
                                WHEN Injured = 'Yes' THEN 'High'
                                WHEN PoliceNotified = 'Yes' THEN 'Medium' 
                                ELSE 'Low' 
                            END AS Severity,
                            CASE 
                                WHEN Finalized = 1 THEN 'Resolved'
                                ELSE 'Ongoing'
                            END AS Status,
                            Location,
                            IncidentDescription,
                            Resolution
                          FROM CaseRecords 
                          WHERE LRN = @LRN
                          ORDER BY Date DESC"

        Using cmd As New SqliteCommand(query, conn)
            cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
            Using reader As SqliteDataReader = cmd.ExecuteReader()
                While reader.Read()
                    Dim incidentDesc As String = reader("IncidentDescription").ToString()
                    If incidentDesc.Length > 50 Then
                        incidentDesc = incidentDesc.Substring(0, 47) & "..."
                    End If

                    DataGridView1.Rows.Add(
                    reader("CaseID").ToString(),
                    reader("Date").ToString(),
                    reader("Severity").ToString(),
                    reader("Status").ToString(),
                    reader("Location").ToString(),
                    incidentDesc,
                    reader("Resolution").ToString()
                )
                End While
            End Using
        End Using

        ' Apply color coding for severity
        ApplySeverityColors()
    End Sub

    Private Sub ApplySeverityColors()
        For Each row As DataGridViewRow In DataGridView1.Rows
            If row.Cells("Severity").Value IsNot Nothing Then
                Dim severity As String = row.Cells("Severity").Value.ToString()
                Select Case severity
                    Case "High"
                        row.Cells("Severity").Style.BackColor = Color.LightCoral
                    Case "Medium"
                        row.Cells("Severity").Style.BackColor = Color.LightYellow
                    Case "Low"
                        row.Cells("Severity").Style.BackColor = Color.LightGreen
                End Select
            End If
        Next
    End Sub

    ' --- Button 1: Add Functionality ---
    Private Sub Button1_Click(sender As Object, e As EventArgs) Handles Button1.Click
        Select Case ComboBox1.SelectedItem.ToString()
            Case "Academic History"
                AddAcademicRecord()
            Case "Case Records"
                AddCaseRecord()
        End Select
    End Sub

    ' --- Button 2: Delete Functionality ---
    Private Sub Button2_Click(sender As Object, e As EventArgs) Handles Button2.Click
        If DataGridView1.SelectedRows.Count = 0 Then
            MessageBox.Show("Please select a record to delete.", "No Selection", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return
        End If

        Select Case ComboBox1.SelectedItem.ToString()
            Case "Academic History"
                DeleteAcademicRecord()
            Case "Case Records"
                DeleteCaseRecord()
        End Select
    End Sub

    ' --- Button 3: View Functionality ---
    Private Sub Button3_Click(sender As Object, e As EventArgs) Handles Button3.Click
        Select Case ComboBox1.SelectedItem.ToString()
            Case "Academic History"
                ViewSchoolYearCases()
            Case "Case Records"
                ViewCaseDetails()
        End Select
    End Sub

    ' --- Add Case Record Functionality ---
    Private Sub AddCaseRecord()
        Using caseForm As New CaseDetails(currentStudent)
            If caseForm.ShowDialog() = DialogResult.OK Then
                ' Refresh the cases view
                LoadCases()
            End If
        End Using
    End Sub

    ' --- View Case Details (for Case Records view) ---
    Private Sub ViewCaseDetails()
        If DataGridView1.SelectedRows.Count = 0 Then
            MessageBox.Show("Please select a case to view.", "No Selection", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Return
        End If

        Dim selectedRow = DataGridView1.SelectedRows(0)
        Dim caseId = selectedRow.Cells("CaseID").Value?.ToString()

        If caseId IsNot Nothing Then
            Dim caseDetails = GetCaseDetails(caseId)
            If caseDetails IsNot Nothing Then
                Using caseForm As New CaseDetails(currentStudent, caseDetails)
                    If caseForm.ShowDialog() = DialogResult.OK Then
                        ' Refresh the cases view if any changes were made
                        LoadCases()
                    End If
                End Using
            End If
        End If
    End Sub

    ' --- View School Year Cases (for Academic History view) ---
    Private Sub ViewSchoolYearCases()
        If DataGridView1.SelectedRows.Count = 0 Then
            MessageBox.Show("Please select a school year to view cases.", "Select School Year", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Return
        End If

        Dim selectedRow = DataGridView1.SelectedRows(0)
        Dim gradeLevel = selectedRow.Cells("Grade").Value.ToString()
        Dim schoolYear = selectedRow.Cells("SchoolYear").Value.ToString()
        Dim section = selectedRow.Cells("Section").Value.ToString()
        Dim adviser = selectedRow.Cells("Adviser").Value.ToString()

        ' Show cases for the selected school year
        ShowCasesForSchoolYear(schoolYear, gradeLevel, section, adviser)
    End Sub

    ' --- Double-Click to View Details ---
    Private Sub DataGridView1_CellDoubleClick(sender As Object, e As DataGridViewCellEventArgs) Handles DataGridView1.CellDoubleClick
        If e.RowIndex < 0 Then Return ' Header click

        Select Case ComboBox1.SelectedItem.ToString()
            Case "Academic History"
                ViewAcademicDetails(e.RowIndex)
            Case "Case Records"
                ViewCaseDetailsDirect(e.RowIndex)
        End Select
    End Sub

    Private Sub ViewAcademicDetails(rowIndex As Integer)
        Dim row = DataGridView1.Rows(rowIndex)
        Dim grade = row.Cells("Grade").Value?.ToString()
        Dim schoolYear = row.Cells("SchoolYear").Value?.ToString()
        Dim section = row.Cells("Section").Value?.ToString()
        Dim adviser = row.Cells("Adviser").Value?.ToString()

        If grade IsNot Nothing AndAlso schoolYear IsNot Nothing Then
            ShowCasesForSchoolYear(schoolYear, grade, section, adviser)
        End If
    End Sub

    Private Sub ViewCaseDetailsDirect(rowIndex As Integer)
        Dim row = DataGridView1.Rows(rowIndex)
        Dim caseId = row.Cells("CaseID").Value?.ToString()

        If caseId IsNot Nothing Then
            Dim caseDetails = GetCaseDetails(caseId)
            If caseDetails IsNot Nothing Then
                Using caseForm As New CaseDetails(currentStudent, caseDetails)
                    If caseForm.ShowDialog() = DialogResult.OK Then
                        ' Refresh the cases view if any changes were made
                        LoadCases()
                    End If
                End Using
            End If
        End If
    End Sub

    Private Sub ShowCasesForSchoolYear(schoolYear As String, gradeLevel As String, section As String, adviser As String)
        Dim yearPart As String = schoolYear.Substring(0, 4) ' Get the first year (e.g., "2024" from "2024-2025")

        Dim cases As New List(Of CaseRecord)()
        Dim query As String = "SELECT * FROM CaseRecords 
                          WHERE LRN = @LRN AND Date LIKE @YearPattern
                          ORDER BY Date DESC"

        Using cmd As New SqliteCommand(query, conn)
            cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
            cmd.Parameters.AddWithValue("@YearPattern", $"{yearPart}%")
            Using reader As SqliteDataReader = cmd.ExecuteReader()
                While reader.Read()
                    cases.Add(New CaseRecord With {
                    .CaseID = reader("CaseID").ToString(),
                    .Date = reader("Date").ToString(),
                    .Time = reader("Time").ToString(),
                    .Location = reader("Location").ToString(),
                    .IncidentDescription = reader("IncidentDescription").ToString(),
                    .Witnesses = reader("Witnesses").ToString(),
                    .Injured = reader("Injured").ToString(),
                    .InjuryDescription = reader("InjuryDescription").ToString(),
                    .MedicalTreatment = reader("MedicalTreatment").ToString(),
                    .PoliceNotified = reader("PoliceNotified").ToString(),
                    .Resolution = reader("Resolution").ToString(),
                    .Finalized = Convert.ToInt32(reader("Finalized"))
                })
                End While
            End Using
        End Using

        ' Display cases in a message box
        If cases.Count > 0 Then
            Dim caseDetails As New StringBuilder()
            caseDetails.AppendLine($"Cases for {currentStudent.FirstName} {currentStudent.Surname}")
            caseDetails.AppendLine($"School Year: {schoolYear} | Grade: {gradeLevel} | Section: {section}")
            caseDetails.AppendLine($"Adviser: {adviser}")
            caseDetails.AppendLine()
            caseDetails.AppendLine($"Total Cases: {cases.Count}")
            caseDetails.AppendLine()

            For Each caseRecord In cases
                caseDetails.AppendLine($"Date: {caseRecord.Date}")
                caseDetails.AppendLine($"Incident: {caseRecord.IncidentDescription}")
                caseDetails.AppendLine($"Location: {caseRecord.Location}")
                caseDetails.AppendLine($"Status: {If(caseRecord.Finalized = 1, "Resolved", "Ongoing")}")
                If Not String.IsNullOrEmpty(caseRecord.Resolution) Then
                    caseDetails.AppendLine($"Resolution: {caseRecord.Resolution}")
                End If
                caseDetails.AppendLine("---")
            Next

            MessageBox.Show(caseDetails.ToString(), $"Cases for {schoolYear}", MessageBoxButtons.OK, MessageBoxIcon.Information)
        Else
            MessageBox.Show($"No cases found for {currentStudent.FirstName} {currentStudent.Surname} in school year {schoolYear}.", "No Cases", MessageBoxButtons.OK, MessageBoxIcon.Information)
        End If
    End Sub

    Private Function GetCaseDetails(caseId As String) As CaseRecord
        Dim query As String = "SELECT * FROM CaseRecords WHERE CaseID = @CaseID"

        Using cmd As New SqliteCommand(query, conn)
            cmd.Parameters.AddWithValue("@CaseID", caseId)
            Using reader As SqliteDataReader = cmd.ExecuteReader()
                If reader.Read() Then
                    Return New CaseRecord With {
                        .CaseID = reader("CaseID").ToString(),
                        .LRN = reader("LRN").ToString(),
                        .FirstName = reader("FirstName").ToString(),
                        .MiddleName = reader("MiddleName").ToString(),
                        .LastName = reader("LastName").ToString(),
                        .Date = reader("Date").ToString(),
                        .Time = reader("Time").ToString(),
                        .PoliceNotified = reader("PoliceNotified").ToString(),
                        .Location = reader("Location").ToString(),
                        .IncidentDescription = reader("IncidentDescription").ToString(),
                        .Witnesses = reader("Witnesses").ToString(),
                        .Injured = reader("Injured").ToString(),
                        .InjuryDescription = reader("InjuryDescription").ToString(),
                        .MedicalTreatment = reader("MedicalTreatment").ToString(),
                        .InjuryLocation = reader("InjuryLocation").ToString(),
                        .Resolution = reader("Resolution").ToString(),
                        .GuidanceCouncilor = reader("GuidanceCouncilor").ToString(),
                        .Finalized = Convert.ToInt32(reader("Finalized"))
                    }
                End If
            End Using
        End Using
        Return Nothing
    End Function

    ' --- Delete Functionality ---
    Private Sub DeleteAcademicRecord()
        Dim selectedRow = DataGridView1.SelectedRows(0)
        Dim gradeLevel = selectedRow.Cells("Grade").Value?.ToString()
        Dim schoolYear = selectedRow.Cells("SchoolYear").Value?.ToString()
        Dim section = selectedRow.Cells("Section").Value?.ToString()
        Dim adviser = selectedRow.Cells("Adviser").Value?.ToString()

        If String.IsNullOrEmpty(gradeLevel) OrElse String.IsNullOrEmpty(schoolYear) Then
            MessageBox.Show("Unable to identify the academic record to delete.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return
        End If

        Dim result As DialogResult = MessageBox.Show(
            $"Are you sure you want to delete this academic record?{vbCrLf}{vbCrLf}" &
            $"Grade: {gradeLevel}{vbCrLf}" &
            $"School Year: {schoolYear}{vbCrLf}" &
            $"Section: {section}{vbCrLf}" &
            $"Adviser: {adviser}{vbCrLf}{vbCrLf}" &
            "This action cannot be undone!",
            "Confirm Delete Academic Record",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Warning)

        If result = DialogResult.Yes Then
            Try
                Using cmd As New SqliteCommand()
                    cmd.Connection = conn
                    cmd.CommandText = "DELETE FROM AcademicHistory WHERE LRN = @LRN AND Grade = @Grade AND SchoolYear = @SchoolYear"
                    cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
                    cmd.Parameters.AddWithValue("@Grade", gradeLevel)
                    cmd.Parameters.AddWithValue("@SchoolYear", schoolYear)

                    Dim rowsAffected As Integer = cmd.ExecuteNonQuery()

                    If rowsAffected > 0 Then
                        MessageBox.Show("Academic record deleted successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
                        LoadAcademicHistory() ' Refresh the grid
                    Else
                        MessageBox.Show("Academic record not found!", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    End If
                End Using

            Catch ex As Exception
                MessageBox.Show("Error deleting academic record: " & ex.Message, "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            End Try
        End If
    End Sub

    Private Sub DeleteCaseRecord()
        Dim selectedRow = DataGridView1.SelectedRows(0)
        Dim caseId = selectedRow.Cells("CaseID").Value?.ToString()
        Dim dateValue = selectedRow.Cells("Date").Value?.ToString()
        Dim status = selectedRow.Cells("Status").Value?.ToString()

        If String.IsNullOrEmpty(caseId) Then
            MessageBox.Show("Unable to identify the case record to delete.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return
        End If

        Dim result As DialogResult = MessageBox.Show(
            $"Are you sure you want to delete this case record?{vbCrLf}{vbCrLf}" &
            $"Case ID: {caseId}{vbCrLf}" &
            $"Date: {dateValue}{vbCrLf}" &
            $"Status: {status}{vbCrLf}" &
            "This action cannot be undone!",
            "Confirm Delete Case Record",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Warning)

        If result = DialogResult.Yes Then
            Try
                Using cmd As New SqliteCommand()
                    cmd.Connection = conn
                    cmd.CommandText = "DELETE FROM CaseRecords WHERE CaseID = @CaseID AND LRN = @LRN"
                    cmd.Parameters.AddWithValue("@CaseID", caseId)
                    cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)

                    Dim rowsAffected As Integer = cmd.ExecuteNonQuery()

                    If rowsAffected > 0 Then
                        MessageBox.Show("Case record deleted successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
                        LoadCases() ' Refresh the grid
                    Else
                        MessageBox.Show("Case record not found!", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    End If
                End Using

            Catch ex As Exception
                MessageBox.Show("Error deleting case record: " & ex.Message, "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            End Try
        End If
    End Sub

    ' --- Grade Validation Function ---
    Private Function ValidateGrade(grade As String) As Boolean
        Try
            Dim gradeInt As Integer = Integer.Parse(grade)
            If gradeInt >= 7 AndAlso gradeInt <= 10 Then
                Return True
            Else
                MessageBox.Show("Grade must be between 7 and 10 (Junior High School only)", "Invalid Grade", MessageBoxButtons.OK, MessageBoxIcon.Error)
                Return False
            End If
        Catch ex As Exception
            MessageBox.Show("Grade must be a number between 7 and 10", "Invalid Grade", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return False
        End Try
    End Function

#Region "Add Academic Record Functionality"
    Private Sub AddAcademicRecord()
        ' Create input dialog
        Using inputForm As New Form()
            inputForm.Text = "Add Academic Record"
            inputForm.Size = New Size(350, 250)
            inputForm.FormBorderStyle = FormBorderStyle.FixedDialog
            inputForm.StartPosition = FormStartPosition.CenterScreen
            inputForm.MaximizeBox = False
            inputForm.MinimizeBox = False

            ' Create controls
            Dim lblGrade As New Label With {.Text = "Grade Level:", .Location = New Point(20, 20), .Width = 100}
            Dim txtGrade As New TextBox With {.Location = New Point(120, 17), .Width = 150}

            Dim lblSection As New Label With {.Text = "Section:", .Location = New Point(20, 50), .Width = 100}
            Dim txtSection As New TextBox With {.Location = New Point(120, 47), .Width = 150}

            Dim lblAdviser As New Label With {.Text = "Adviser:", .Location = New Point(20, 80), .Width = 100}
            Dim txtAdviser As New TextBox With {.Location = New Point(120, 77), .Width = 150}

            Dim lblSchoolYear As New Label With {.Text = "School Year:", .Location = New Point(20, 110), .Width = 100}
            Dim txtSchoolYear As New TextBox With {.Location = New Point(120, 107), .Width = 150, .Text = "2024-2025"}

            Dim btnOK As New Button With {.Text = "Add", .Location = New Point(80, 150), .Width = 80}
            Dim btnCancel As New Button With {.Text = "Cancel", .Location = New Point(170, 150), .Width = 80}

            ' Add controls to form
            inputForm.Controls.AddRange({lblGrade, txtGrade, lblSection, txtSection, lblAdviser, txtAdviser, lblSchoolYear, txtSchoolYear, btnOK, btnCancel})

            ' Event handlers
            AddHandler btnOK.Click, Sub(s, ev)
                                        If ValidateAcademicInput(txtGrade.Text, txtSection.Text, txtAdviser.Text, txtSchoolYear.Text) Then
                                            If AddAcademicRecordToDB(txtGrade.Text, txtSection.Text, txtAdviser.Text, txtSchoolYear.Text) Then
                                                inputForm.DialogResult = DialogResult.OK
                                                inputForm.Close()
                                            End If
                                        End If
                                    End Sub

            AddHandler btnCancel.Click, Sub(s, ev)
                                            inputForm.DialogResult = DialogResult.Cancel
                                            inputForm.Close()
                                        End Sub

            If inputForm.ShowDialog() = DialogResult.OK Then
                ' Refresh the academic history view
                LoadAcademicHistory()
            End If
        End Using
    End Sub

    Private Function ValidateAcademicInput(grade As String, section As String, adviser As String, schoolYear As String) As Boolean
        If String.IsNullOrWhiteSpace(grade) Then
            MessageBox.Show("Please enter grade level.", "Missing Information", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If

        ' Validate grade (7-10 only)
        If Not ValidateGrade(grade) Then
            Return False
        End If

        If String.IsNullOrWhiteSpace(section) Then
            MessageBox.Show("Please enter section.", "Missing Information", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If

        If String.IsNullOrWhiteSpace(adviser) Then
            MessageBox.Show("Please enter adviser name.", "Missing Information", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If

        If String.IsNullOrWhiteSpace(schoolYear) Then
            MessageBox.Show("Please enter school year.", "Missing Information", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If

        ' Validate school year format (should be like 2024-2025)
        If Not System.Text.RegularExpressions.Regex.IsMatch(schoolYear, "^\d{4}-\d{4}$") Then
            MessageBox.Show("School year should be in format: YYYY-YYYY (e.g., 2024-2025)", "Invalid Format", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If

        Return True
    End Function

    Private Function AddAcademicRecordToDB(grade As String, section As String, adviser As String, schoolYear As String) As Boolean
        Try
            ' Check if academic record already exists for this student with same grade and school year
            Dim checkQuery As String = "SELECT COUNT(*) FROM AcademicHistory WHERE LRN = @LRN AND Grade = @Grade AND SchoolYear = @SchoolYear"
            Using checkCmd As New SqliteCommand(checkQuery, conn)
                checkCmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
                checkCmd.Parameters.AddWithValue("@Grade", grade)
                checkCmd.Parameters.AddWithValue("@SchoolYear", schoolYear)

                Dim existingCount As Integer = Convert.ToInt32(checkCmd.ExecuteScalar())

                If existingCount > 0 Then
                    MessageBox.Show($"Academic record for Grade {grade} in School Year {schoolYear} already exists for this student.", "Duplicate Record", MessageBoxButtons.OK, MessageBoxIcon.Warning)
                    Return False
                End If
            End Using

            ' Insert new academic record
            Dim insertQuery As String = "INSERT INTO AcademicHistory (LRN, Grade, Section, SchoolYear, Adviser) VALUES (@LRN, @Grade, @Section, @SchoolYear, @Adviser)"
            Using insertCmd As New SqliteCommand(insertQuery, conn)
                insertCmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
                insertCmd.Parameters.AddWithValue("@Grade", grade)
                insertCmd.Parameters.AddWithValue("@Section", section)
                insertCmd.Parameters.AddWithValue("@SchoolYear", schoolYear)
                insertCmd.Parameters.AddWithValue("@Adviser", adviser)

                insertCmd.ExecuteNonQuery()
            End Using

            MessageBox.Show("Academic record added successfully!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
            Return True

        Catch ex As Exception
            MessageBox.Show($"Error adding academic record: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return False
        End Try
    End Function

    ' --- Mouse Events for Dragging ---
    Private Sub Panel1_MouseDown(sender As Object, e As MouseEventArgs) Handles Panel5.MouseDown
        drag = True
        mouseX = Cursor.Position.X - Me.Left
        mouseY = Cursor.Position.Y - Me.Top
    End Sub

    Private Sub Panel1_MouseMove(sender As Object, e As MouseEventArgs) Handles Panel5.MouseMove
        If drag Then
            Me.Left = Cursor.Position.X - mouseX
            Me.Top = Cursor.Position.Y - mouseY
        End If
    End Sub

    Private Sub Panel1_MouseUp(sender As Object, e As MouseEventArgs) Handles Panel5.MouseUp
        drag = False
    End Sub
#End Region

#Region "Form Events"
    Private Sub ViewRec_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        Me.FormBorderStyle = FormBorderStyle.None
        Me.StartPosition = FormStartPosition.CenterScreen
        Me.MaximumSize = New Size(900, Screen.PrimaryScreen.WorkingArea.Height - 50)
        Dim Uipanels As New List(Of Panel) From {
            Panel6, Panel7, Panel8, Panel9, Panel22
        }
        For Each pnl As Panel In Uipanels
            UiTheme.Round(pnl, 15)
        Next
    End Sub

    Private Sub ViewRec_Shown(sender As Object, e As EventArgs) Handles Me.Shown
        Dim screenBounds As Rectangle = Screen.PrimaryScreen.WorkingArea
        Dim x As Integer = (screenBounds.Width - Me.Width) \ 2
        Dim y As Integer = (screenBounds.Height - Me.Height) \ 2
        Me.Location = New Point(x, y)
    End Sub

    Private Sub ViewRec_FormClosing(sender As Object, e As FormClosingEventArgs) Handles MyBase.FormClosing
        conn?.Close()
        conn?.Dispose()
    End Sub

    Private Sub Button4_Click(sender As Object, e As EventArgs) Handles Button4.Click
        Close()
    End Sub
#End Region

#Region "Editting"
    ' Constructor for View mode
    Public Sub New(student As StudentRecord)
        Me.New(student, False) ' Chain to edit mode constructor with False
    End Sub

    ' Main constructor that handles both modes
    Public Sub New(student As StudentRecord, Optional editMode As Boolean = False)
        InitializeComponent()
        currentStudent = student
        isEditMode = editMode
        InitializeDatabase()
        LoadStudentInfo()
        InitializeComboBox()
        UpdateButtonStates()
        SetEditMode(isEditMode) ' This is the key line that was missing
    End Sub


    Private Sub SetEditMode(editMode As Boolean)
        isEditMode = editMode
        TextBox1.ReadOnly = Not isEditMode
        TextBox2.ReadOnly = True
        TextBox3.ReadOnly = Not isEditMode
        TextBox4.ReadOnly = Not isEditMode
        TextBox5.ReadOnly = Not isEditMode
        TextBox6.ReadOnly = Not isEditMode
        TextBox7.ReadOnly = Not isEditMode
        TextBox8.ReadOnly = Not isEditMode
        TextBox9.ReadOnly = Not isEditMode
        TextBox10.ReadOnly = Not isEditMode
        btnSave.Visible = editMode
        Panel22.Visible = editMode ' Hide any extra panels if not in edit mode
    End Sub



#End Region

#Region "Border Design"
    Private Sub Popupform_Paint(sender As Object, e As PaintEventArgs) Handles MyBase.Paint
        Dim borderColor As Color = Color.Black
        Dim borderWidth As Integer = 3
        Using pen As New Pen(borderColor, borderWidth)
            e.Graphics.DrawRectangle(pen, 0, 0, Me.ClientSize.Width - 1, Me.ClientSize.Height - 1)
        End Using
    End Sub

    Private Sub btnSave_Click(sender As Object, e As EventArgs) Handles btnSave.Click
        Try
            If ValidateStudentFields() Then
                If UpdateStudentInDatabase() Then
                    MessageBox.Show("Record updated!", "Success", MessageBoxButtons.OK, MessageBoxIcon.Information)
                    SetEditMode(False)
                    Me.DialogResult = DialogResult.OK
                    Me.Close()
                Else
                    AppLogger.WriteLog("Failed to update student record for LRN: " & TextBox2.Text)
                    MessageBox.Show("Failed to update record.", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                End If
            End If
        Catch ex As Exception
            AppLogger.WriteLog($"Error in btnSave_Click for LRN {TextBox2.Text}: {ex.Message}")
            AppLogger.WriteLog($"Stack trace: {ex.StackTrace}")
            MessageBox.Show($"An error occurred while saving: {ex.Message}", "Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
        End Try
    End Sub

    Private Function ValidateStudentFields() As Boolean
        If String.IsNullOrWhiteSpace(TextBox1.Text) Then
            MessageBox.Show("Name required.", "Missing Info")
            Return False
        End If

        ' Age validation (optional)
        If Not Integer.TryParse(TextBox5.Text, Nothing) OrElse Convert.ToInt32(TextBox5.Text) <= 0 Then
            MessageBox.Show("Age must be a positive number.", "Invalid Input")
            Return False
        End If

        ' Email validation – allow empty, else must contain "@"
        If Not String.IsNullOrEmpty(TextBox3.Text) AndAlso Not TextBox3.Text.Contains("@") Then
            MessageBox.Show("Email address must contain '@'.", "Invalid Email")
            Return False
        End If

        ' Contact number validation – allow empty, else must start with '09' and be 11 digits
        If Not String.IsNullOrEmpty(TextBox6.Text) Then
            If TextBox6.Text.Length <> 11 OrElse Not TextBox6.Text.StartsWith("09") OrElse Not TextBox6.Text.All(AddressOf Char.IsDigit) Then
                MessageBox.Show("Contact Number must be 11 digits starting with '09'.", "Invalid Contact Number")
                Return False
            End If
        End If

        ' Guardian contact validation – similar rules (optional, if you want)
        If Not String.IsNullOrEmpty(TextBox9.Text) Then
            If TextBox9.Text.Length <> 11 OrElse Not TextBox9.Text.StartsWith("09") OrElse Not TextBox9.Text.All(AddressOf Char.IsDigit) Then
                MessageBox.Show("Guardian Contact Number must be 11 digits starting with '09'.", "Invalid Guardian Contact Number")
                Return False
            End If
        End If

        Return True
    End Function


    Private Function UpdateStudentInDatabase() As Boolean
        If Not TextBox1.Text.Contains(",") Then
            MessageBox.Show("Enter the name as ""Surname, First Middle"".", "Invalid name", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return False
        End If
        Using transaction As SqliteTransaction = conn.BeginTransaction()
            Try
                ' Parse name into surname and firstname/middleinitial as in your logic
                Dim parts = TextBox1.Text.Split(","c)
                Dim surname = parts(0).Trim()
                Dim firstAndMiddle = parts(1).Trim().Split(" "c)
                Dim firstName = firstAndMiddle(0).Trim()
                Dim middleInitial = If(firstAndMiddle.Length > 1, firstAndMiddle(1).Trim(), "")

                Dim lrn As String = currentStudent.LRN  ' DO NOT EDIT

                ' --- 1. UPDATE STUDENTS ---
                Dim studentUpdated As Boolean = False
                Using cmd As New SqliteCommand("UPDATE Students SET Surname=@Surname, FirstName=@FirstName, MiddleInitial=@MiddleInitial, Age=@Age, Birthday=@Birthday, Address=@Address, ContactNumber=@ContactNumber, Email=@Email WHERE LRN=@LRN", conn, transaction)
                    cmd.Parameters.AddWithValue("@Surname", surname)
                    cmd.Parameters.AddWithValue("@FirstName", firstName)
                    cmd.Parameters.AddWithValue("@MiddleInitial", middleInitial)
                    cmd.Parameters.AddWithValue("@Age", Convert.ToInt32(TextBox5.Text))
                    cmd.Parameters.AddWithValue("@Birthday", TextBox4.Text)
                    cmd.Parameters.AddWithValue("@Address", TextBox7.Text)
                    cmd.Parameters.AddWithValue("@ContactNumber", TextBox6.Text)
                    cmd.Parameters.AddWithValue("@Email", TextBox3.Text)
                    cmd.Parameters.AddWithValue("@LRN", lrn)
                    studentUpdated = (cmd.ExecuteNonQuery() > 0)
                End Using

                ' Check if guardian exists for this LRN
                Dim guardianExists As Boolean = False
                Using checkCmd As New SqliteCommand("SELECT COUNT(*) FROM Guardians WHERE LRN=@LRN", conn, transaction)
                    checkCmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
                    guardianExists = (Convert.ToInt32(checkCmd.ExecuteScalar()) > 0)
                End Using

                If guardianExists Then
                    Using cmd As New SqliteCommand("UPDATE Guardians SET Name=@Name, ContactInfo=@ContactInfo, Relationship=@Relationship WHERE LRN=@LRN", conn, transaction)
                        cmd.Parameters.AddWithValue("@Name", TextBox8.Text)
                        cmd.Parameters.AddWithValue("@ContactInfo", TextBox9.Text)
                        cmd.Parameters.AddWithValue("@Relationship", TextBox10.Text)
                        cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
                        cmd.ExecuteNonQuery()
                    End Using
                Else
                    Using cmd As New SqliteCommand("INSERT INTO Guardians (LRN, Name, ContactInfo, Relationship) VALUES (@LRN, @Name, @ContactInfo, @Relationship)", conn, transaction)
                        cmd.Parameters.AddWithValue("@LRN", currentStudent.LRN)
                        cmd.Parameters.AddWithValue("@Name", TextBox8.Text)
                        cmd.Parameters.AddWithValue("@ContactInfo", TextBox9.Text)
                        cmd.Parameters.AddWithValue("@Relationship", TextBox10.Text)
                        cmd.ExecuteNonQuery()
                    End Using
                End If

                If studentUpdated Then
                    transaction.Commit()
                    Return True
                Else
                    transaction.Rollback()
                    Return False
                End If
            Catch ex As Exception
                AppLogger.WriteLog($"UpdateStudentInDatabase failed: {ex.Message}")
                transaction.Rollback()
                Return False
            End Try
        End Using
    End Function



    Private Sub Panel5_Paint(sender As Object, e As PaintEventArgs) Handles Panel5.Paint
        e.Graphics.SmoothingMode = Drawing2D.SmoothingMode.AntiAlias
        Dim rect As New System.Drawing.Rectangle(0, 0, Panel5.Width, Panel5.Height)
        Using brush As New Drawing2D.LinearGradientBrush(rect, UiTheme.Accent, UiTheme.PrimaryDark, Drawing2D.LinearGradientMode.Horizontal)
            e.Graphics.FillRectangle(brush, rect)
        End Using
    End Sub

#End Region
End Class

