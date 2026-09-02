Imports Microsoft.Data.Sqlite
Imports OfficeOpenXml
Imports System.IO

Public Class Records
    Public Sub New()
        ' This call is required by the Windows Form Designer.
        InitializeComponent()

    End Sub

#Region "Database Fields"
    Private dbFilePath As String = "student_records.db"
    Private selectedRecordId As String = Nothing
#End Region

#Region "Form Load and Initialization"
    Private Async Sub Records_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        Me.BackColor = UiTheme.AppBg
        TextBox1.BackColor = Panel1.BackColor
        UiTheme.CircleRegion(Panel10)
        UiTheme.CircleRegion(Panel11)
        UiTheme.CircleRegion(Panel12)
        Try
            InitializeDatabase()
            LoadStudents()
        Catch ex As Exception
            AppLogger.WriteLog($"Records load failed: {ex.Message}")
            MessageBox.Show("Could not load student records. See the log for details.", "Records", MessageBoxButtons.OK, MessageBoxIcon.Warning)
        End Try
        Await Task.Delay(100)
        Dim Uipanels As New List(Of Panel) From {
            Panel1, Panel2, Panel3, Panel4, Panel8
        }
        For Each pnl As Panel In Uipanels
            UiTheme.Round(pnl, 20)
        Next
    End Sub

    Private Sub InitializeDatabase()
        Using conn As New SqliteConnection("Data Source=" & dbFilePath)
            conn.Open()
            DemoSeeder.EnsureSchema(conn)
        End Using
    End Sub
#End Region

#Region "Load and Search Students"
    Private Sub LoadStudents(Optional searchTerm As String = "")
        DataGridView1.Rows.Clear()

        Using conn As New SqliteConnection("Data Source=" & dbFilePath)
            conn.Open()
            Dim query As String

            If String.IsNullOrWhiteSpace(searchTerm) Then
                query = "SELECT LRN, Surname, FirstName, MiddleInitial, Age, ContactNumber, Email FROM Students"
            Else
                query = "SELECT LRN, Surname, FirstName, MiddleInitial, Age, ContactNumber, Email FROM Students " &
                    "WHERE LRN LIKE @Search OR Surname LIKE @Search OR FirstName LIKE @Search OR MiddleInitial LIKE @Search OR Email LIKE @Search"
            End If

            Using cmd As New SqliteCommand(query, conn)
                If Not String.IsNullOrWhiteSpace(searchTerm) Then
                    cmd.Parameters.AddWithValue("@Search", "%" & searchTerm & "%")
                End If
                Using reader = cmd.ExecuteReader()
                    While reader.Read()
                        Dim fullName As String = $"{reader("Surname")}, {reader("FirstName")} {reader("MiddleInitial")}"
                        DataGridView1.Rows.Add(reader("LRN"), fullName, reader("Age"), reader("ContactNumber"), reader("Email"))
                    End While
                End Using
            End Using
        End Using
        UpdateStatistics()
    End Sub

    Private Sub TextBox1_TextChanged(sender As Object, e As EventArgs) Handles TextBox1.TextChanged
        LoadStudents(TextBox1.Text.Trim)
    End Sub

    Private Sub TextBox1_KeyDown(sender As Object, e As KeyEventArgs) Handles TextBox1.KeyDown
        If e.KeyCode = Keys.Enter Then
            LoadStudents(TextBox1.Text.Trim)
            e.Handled = True
            e.SuppressKeyPress = True
        End If
    End Sub
#End Region

#Region "CRUD Functions"
    Private Function GetStudentByLRN(lrn As String) As StudentRecord
        Using conn As New SqliteConnection("Data Source=" & dbFilePath)
            conn.Open()
            Dim query As String = "
            SELECT s.LRN, s.Surname, s.FirstName, s.MiddleInitial, s.Age,
                   s.Birthday, s.Address, s.ContactNumber, s.Email, g.GuardianID AS GuardianID,
                   g.Name AS GuardianName, g.ContactInfo AS GuardianContactNo, g.Relationship AS GuardianRelationship
            FROM Students s
            LEFT JOIN Guardians g ON s.LRN = g.LRN
            WHERE s.LRN = @LRN"
            Using cmd As New SqliteCommand(query, conn)
                cmd.Parameters.AddWithValue("@LRN", lrn)
                Using reader = cmd.ExecuteReader()
                    If reader.Read() Then
                        Return New StudentRecord With {
                        .LRN = reader("LRN").ToString(),
                        .Surname = reader("Surname").ToString(),
                        .FirstName = reader("FirstName").ToString(),
                        .MiddleInitial = reader("MiddleInitial").ToString(),
                        .Age = Convert.ToInt32(reader("Age")),
                        .Birthday = reader("Birthday").ToString(),
                        .Address = reader("Address").ToString(),
                        .ContactNumber = reader("ContactNumber").ToString(),
                        .Email = reader("Email").ToString(),
                        .GuardianID = reader("GuardianID").ToString(),
                        .GuardianName = reader("GuardianName").ToString(),
                        .GuardianContactNo = reader("GuardianContactNo").ToString(),
                        .GuardianRelationship = reader("GuardianRelationship").ToString()
                    }
                    End If
                End Using
            End Using
        End Using
        Return Nothing
    End Function
#End Region

#Region "Delete Student"
    Private Sub DeleteStudent()
        If DataGridView1.SelectedRows.Count = 0 Then
            MessageBox.Show("Please Select a record To delete.")
            Return
        End If

        Dim lrnToDelete As String = DataGridView1.SelectedRows(0).Cells("LRN").Value.ToString()
        Dim confirmation = MessageBox.Show($"Delete record For {lrnToDelete}?", "Confirm Delete", MessageBoxButtons.YesNo, MessageBoxIcon.Warning)

        If confirmation = DialogResult.Yes Then
            Try
                Using conn As New SqliteConnection("Data Source=" & dbFilePath)
                    conn.Open()
                    Using trans = conn.BeginTransaction()
                        Using cmd As New SqliteCommand("", conn)
                            cmd.Transaction = trans
                            cmd.CommandText = "DELETE FROM AcademicHistory WHERE LRN=@L; DELETE FROM CaseRecords WHERE LRN=@L; DELETE FROM Guardians WHERE LRN=@L; DELETE FROM Students WHERE LRN=@L;"
                            cmd.Parameters.AddWithValue("@L", lrnToDelete)
                            cmd.ExecuteNonQuery()
                        End Using
                        trans.Commit()
                    End Using
                End Using
                MessageBox.Show("Record deleted.")
                RefreshGridPreserveSelection()
            Catch ex As Exception
                AppLogger.WriteLog($"Delete Error: {ex.Message}")
                MessageBox.Show("Something went wrong.")
            End Try
        End If
    End Sub
#End Region

#Region "Add New Student"
    Private Sub Button1_Click(sender As Object, e As EventArgs) Handles Button1.Click
        ShowAddStudentForm()
    End Sub

    Private Sub ShowAddStudentForm()
        Using addForm As New Form()
            addForm.Text = "Register New Student"
            addForm.Size = New Size(500, 650)
            addForm.FormBorderStyle = FormBorderStyle.FixedDialog
            addForm.StartPosition = FormStartPosition.CenterScreen
            addForm.MaximizeBox = False
            addForm.MinimizeBox = False
            addForm.BackColor = Color.White

            Dim mainPanel As New Panel With {.Dock = DockStyle.Fill, .AutoScroll = True, .Padding = New Padding(20)}

            Dim lblTitle As New Label With {.Text = "Student Registration", .Font = New Font("Segoe UI", 16, FontStyle.Bold), .ForeColor = Color.FromArgb(64, 64, 64), .AutoSize = True, .Location = New Point(0, 0)}

            Dim lblStudentInfo As New Label With {.Text = "Student Information", .Font = New Font("Segoe UI", 12, FontStyle.Bold), .ForeColor = Color.FromArgb(64, 64, 64), .AutoSize = True, .Location = New Point(0, 40)}

            ' Student input controls
            Dim lblLRN As New Label With {.Text = "LRN *:", .Location = New Point(0, 80), .Width = 120}
            Dim txtLRN As New TextBox With {.Location = New Point(120, 77), .Width = 200}

            Dim lblSurname As New Label With {.Text = "Surname *:", .Location = New Point(0, 110), .Width = 120}
            Dim txtSurname As New TextBox With {.Location = New Point(120, 107), .Width = 200}

            Dim lblFirstName As New Label With {.Text = "First Name *:", .Location = New Point(0, 140), .Width = 120}
            Dim txtFirstName As New TextBox With {.Location = New Point(120, 137), .Width = 200}

            Dim lblMiddleInitial As New Label With {.Text = "Middle Initial:", .Location = New Point(0, 170)}
            Dim txtMiddleInitial As New TextBox With {.Location = New Point(120, 167), .Width = 50, .MaxLength = 1}

            Dim lblAge As New Label With {.Text = "Age *:", .Location = New Point(0, 200)}
            Dim txtAge As New TextBox With {.Location = New Point(120, 197), .Width = 60}

            Dim lblBirthday As New Label With {.Text = "Birthday (YYYY-MM-DD) *:", .Location = New Point(0, 230)}
            Dim txtBirthday As New TextBox With {.Location = New Point(180, 227), .Width = 120, .Text = "2010-01-01"}

            Dim lblAddress As New Label With {.Text = "Address *:", .Location = New Point(0, 260)}
            Dim txtAddress As New TextBox With {.Location = New Point(120, 257), .Width = 300}

            Dim lblContactNumber As New Label With {.Text = "Contact No. *:", .Location = New Point(0, 290)}
            Dim txtContactNumber As New TextBox With {.Location = New Point(120, 287), .Width = 150}

            Dim lblEmail As New Label With {.Text = "Email Address:", .Location = New Point(0, 320)}
            Dim txtEmail As New TextBox With {.Location = New Point(120, 317), .Width = 200}

            Dim lblGuardianInfo As New Label With {.Text = "Guardian Information", .Font = New Font("Segoe UI", 12, FontStyle.Bold), .ForeColor = Color.FromArgb(64, 64, 64), .AutoSize = True, .Location = New Point(0, 370)}

            Dim lblGuardianName As New Label With {.Text = "Guardian Name *:", .Location = New Point(0, 410)}
            Dim txtGuardianName As New TextBox With {.Location = New Point(150, 407), .Width = 200}

            Dim lblGuardianContact As New Label With {.Text = "Guardian No. *:", .Location = New Point(0, 440)}
            Dim txtGuardianContact As New TextBox With {.Location = New Point(150, 437), .Width = 150}

            Dim lblRelationship As New Label With {.Text = "Relationship *:", .Location = New Point(0, 470)}
            Dim txtRelationship As New TextBox With {.Location = New Point(150, 467), .Width = 150, .Text = "Parent"}

            Dim btnRegister As New Button With {.Text = "Register Student", .Location = New Point(120, 520), .Width = 120, .BackColor = Color.FromArgb(76, 175, 80), .ForeColor = Color.White, .FlatStyle = FlatStyle.Flat}
            Dim btnCancel As New Button With {.Text = "Cancel", .Location = New Point(250, 520), .Width = 80, .BackColor = Color.FromArgb(244, 67, 54), .ForeColor = Color.White, .FlatStyle = FlatStyle.Flat}

            mainPanel.Controls.AddRange({
                lblTitle, lblStudentInfo, lblLRN, txtLRN, lblSurname, txtSurname,
                lblFirstName, txtFirstName, lblMiddleInitial, txtMiddleInitial, lblAge, txtAge,
                lblBirthday, txtBirthday, lblAddress, txtAddress, lblContactNumber, txtContactNumber,
                lblEmail, txtEmail, lblGuardianInfo, lblGuardianName, txtGuardianName,
                lblGuardianContact, txtGuardianContact, lblRelationship, txtRelationship,
                btnRegister, btnCancel
            })
            addForm.Controls.Add(mainPanel)

            AddHandler btnRegister.Click, Sub(s, ev)
                                              If ValidateStudentInput(txtLRN.Text, txtSurname.Text, txtFirstName.Text, txtAge.Text, txtBirthday.Text, txtAddress.Text, txtContactNumber.Text, txtEmail.Text, txtGuardianName.Text, txtGuardianContact.Text, txtRelationship.Text) Then
                                                  If RegisterNewStudent(txtLRN.Text, txtSurname.Text, txtFirstName.Text, txtMiddleInitial.Text, txtAge.Text, txtBirthday.Text, txtAddress.Text, txtContactNumber.Text, txtEmail.Text, txtGuardianName.Text, txtGuardianContact.Text, txtRelationship.Text) Then
                                                      addForm.DialogResult = DialogResult.OK
                                                      addForm.Close()
                                                  End If
                                              End If
                                          End Sub

            AddHandler btnCancel.Click, Sub(s, ev) addForm.Close()
            addForm.ShowDialog()
            If addForm.DialogResult = DialogResult.OK Then RefreshGridPreserveSelection()
        End Using
    End Sub

    Private Function ValidateStudentInput(lrn As String, surname As String, firstName As String, age As String, birthday As String, address As String, contactNumber As String, email As String, guardianName As String, guardianContact As String, relationship As String) As Boolean
        If String.IsNullOrWhiteSpace(lrn) Then
            MessageBox.Show("Please enter LRN.", "Missing Information")
            Return False
        End If
        If lrn.Length <> 12 OrElse Not lrn.All(AddressOf Char.IsDigit) Then
            MessageBox.Show("LRN must be exactly 12 digits.", "Invalid LRN")
            Return False
        End If
        If String.IsNullOrWhiteSpace(surname) Then
            MessageBox.Show("Please enter surname.", "Missing Information")
            Return False
        End If
        If String.IsNullOrWhiteSpace(firstName) Then
            MessageBox.Show("Please enter first name.", "Missing Information")
            Return False
        End If
        If String.IsNullOrWhiteSpace(age) OrElse Not Integer.TryParse(age, Nothing) OrElse Convert.ToInt32(age) < 5 OrElse Convert.ToInt32(age) > 25 Then
            MessageBox.Show("Please enter a valid age (5-25).", "Invalid Age")
            Return False
        End If
        ' MM/DD/YYYY birthday validation
        If String.IsNullOrWhiteSpace(birthday) OrElse Not System.Text.RegularExpressions.Regex.IsMatch(birthday, "^(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])/([0-9]{4})$") Then
            MessageBox.Show("Birthday must be in format MM/DD/YYYY.", "Invalid Birthday")
            Return False
        End If
        If String.IsNullOrWhiteSpace(address) Then
            MessageBox.Show("Please enter address.", "Missing Information")
            Return False
        End If
        ' Contact number: required, must start with 09 and be 11 digits
        If String.IsNullOrWhiteSpace(contactNumber) OrElse contactNumber.Length <> 11 OrElse Not contactNumber.StartsWith("09") OrElse Not contactNumber.All(AddressOf Char.IsDigit) Then
            MessageBox.Show("Contact Number must be 11 digits and start with '09'.", "Invalid Contact Number")
            Return False
        End If
        ' Email: optional, if not empty must have '@'
        If Not String.IsNullOrWhiteSpace(email) AndAlso Not email.Contains("@") Then
            MessageBox.Show("Email address must contain '@'.", "Invalid Email")
            Return False
        End If
        If String.IsNullOrWhiteSpace(guardianName) Then
            MessageBox.Show("Please enter guardian name.", "Missing Information")
            Return False
        End If
        ' Guardian contact: required, must start with 09 and be 11 digits
        If String.IsNullOrWhiteSpace(guardianContact) OrElse guardianContact.Length <> 11 OrElse Not guardianContact.StartsWith("09") OrElse Not guardianContact.All(AddressOf Char.IsDigit) Then
            MessageBox.Show("Guardian Contact must be 11 digits and start with '09'.", "Invalid Guardian Contact Number")
            Return False
        End If
        If String.IsNullOrWhiteSpace(relationship) Then
            MessageBox.Show("Please enter relationship with guardian.", "Missing Information")
            Return False
        End If
        Return True
    End Function


    Private Function RegisterNewStudent(lrn As String, surname As String, firstName As String, middleInitial As String, age As String, birthday As String, address As String, contactNumber As String, email As String, guardianName As String, guardianContact As String, relationship As String) As Boolean
        Try
            Using conn As New SqliteConnection("Data Source=" & dbFilePath)
                conn.Open()
                ' Check duplicate LRN
                Using checkCmd As New SqliteCommand("SELECT COUNT(*) FROM Students WHERE LRN=@LRN", conn)
                    checkCmd.Parameters.AddWithValue("@LRN", lrn)
                    If Convert.ToInt32(checkCmd.ExecuteScalar()) > 0 Then
                        MessageBox.Show("A student with LRN " & lrn & " already exists.", "Duplicate LRN")
                        Return False
                    End If
                End Using
                Using trans = conn.BeginTransaction()
                    ' Ensure MM/DD/YYYY is properly stored
                    Dim parsedDate As DateTime
                    If Not DateTime.TryParseExact(birthday, "MM/dd/yyyy", Globalization.CultureInfo.InvariantCulture, Globalization.DateTimeStyles.None, parsedDate) Then
                        MessageBox.Show("Birthday format invalid. Please use MM/DD/YYYY.", "Error")
                        Return False
                    End If
                    Using cmd As New SqliteCommand("INSERT INTO Students (LRN, Surname, FirstName, MiddleInitial, Age, Birthday, Address, ContactNumber, Email) VALUES (@LRN, @SName, @FName, @MInit, @Age, @Bday, @Address, @Contact, @Email)", conn, trans)
                        cmd.Parameters.AddWithValue("@LRN", lrn)
                        cmd.Parameters.AddWithValue("@SName", surname.Trim())
                        cmd.Parameters.AddWithValue("@FName", firstName.Trim())
                        cmd.Parameters.AddWithValue("@MInit", middleInitial.Trim().ToUpper())
                        cmd.Parameters.AddWithValue("@Age", Convert.ToInt32(age))
                        cmd.Parameters.AddWithValue("@Bday", parsedDate.ToString("MM/dd/yyyy"))
                        cmd.Parameters.AddWithValue("@Address", address.Trim())
                        cmd.Parameters.AddWithValue("@Contact", contactNumber.Trim())
                        cmd.Parameters.AddWithValue("@Email", If(String.IsNullOrWhiteSpace(email), "", email.Trim()))
                        cmd.ExecuteNonQuery()
                    End Using
                    Using gcmd As New SqliteCommand("INSERT INTO Guardians (LRN, Name, ContactInfo, Relationship) VALUES (@LRN, @GName, @GContact, @Relationship)", conn, trans)
                        gcmd.Parameters.AddWithValue("@LRN", lrn)
                        gcmd.Parameters.AddWithValue("@GName", guardianName.Trim())
                        gcmd.Parameters.AddWithValue("@GContact", guardianContact.Trim())
                        gcmd.Parameters.AddWithValue("@Relationship", relationship.Trim())
                        gcmd.ExecuteNonQuery()
                    End Using
                    trans.Commit()
                End Using
            End Using
            MessageBox.Show("Student " & firstName & " " & surname & " successfully registered!", "Success")
            Return True
        Catch ex As Exception
            AppLogger.WriteLog("RegisterNewStudent Error: " & ex.Message)
            MessageBox.Show("Registration failed. Contact admin.", "Error")
            Return False
        End Try
    End Function

#End Region

#Region "Batch Import from Excel"
    Private Sub Button2_Click(sender As Object, e As EventArgs) Handles Button2.Click
        ShowBatchImportForm()
    End Sub

    Private Sub ShowBatchImportForm()
        Using openFileDialog As New OpenFileDialog()
            openFileDialog.Filter = "Excel Files|*.xlsx;*.xls"
            openFileDialog.Title = "Select Excel or CSV File for Batch Import"
            openFileDialog.RestoreDirectory = True

            If openFileDialog.ShowDialog() = DialogResult.OK Then
                ProcessExcelImport(openFileDialog.FileName)
            End If
        End Using
    End Sub

    Private Sub ProcessExcelImport(filePath As String)
        Try
            Cursor.Current = Cursors.WaitCursor

            OfficeOpenXml.ExcelPackage.License.SetNonCommercialOrganization("GuinayangNHS")

            ' Verify file exists
            If Not File.Exists(filePath) Then
                MessageBox.Show("Selected file does not exist.", "Import Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                Return
            End If

            ' Check file extension
            Dim extension As String = Path.GetExtension(filePath).ToLower()
            If extension <> ".xlsx" AndAlso extension <> ".xls" Then
                MessageBox.Show("Please select an Excel file (.xlsx or .xls).", "Invalid File Type", MessageBoxButtons.OK, MessageBoxIcon.Error)
                Return
            End If

            Dim importedCount As Integer = 0
            Dim errorCount As Integer = 0
            Dim errorMessages As New List(Of String)

            Using package As New OfficeOpenXml.ExcelPackage(New FileInfo(filePath))
                If package.Workbook.Worksheets.Count = 0 Then
                    MessageBox.Show("No worksheets found in the Excel file.", "Import Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    Return
                End If

                Dim worksheet As OfficeOpenXml.ExcelWorksheet = package.Workbook.Worksheets(0)

                ' Get row count safely
                Dim rowCount As Integer = 0
                If worksheet.Dimension IsNot Nothing Then
                    rowCount = worksheet.Dimension.Rows
                Else
                    MessageBox.Show("No data found in the worksheet.", "Import Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    Return
                End If

                If rowCount <= 1 Then
                    MessageBox.Show("No data rows found in the Excel file.", "Import Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
                    Return
                End If

                ' Process each row (skip header row)
                For row As Integer = 2 To rowCount
                    Try
                        If ImportStudentFromExcelRow(worksheet, row) Then
                            importedCount += 1
                        Else
                            errorCount += 1
                            errorMessages.Add($"Row {row}: Failed to import - missing data or invalid LRN")
                        End If
                    Catch ex As Exception
                        errorCount += 1
                        errorMessages.Add($"Row {row}: {ex.Message}")
                    End Try
                Next
            End Using

            ' Show results
            Dim resultMessage As String = $"Import completed:{vbCrLf}Successfully imported: {importedCount}{vbCrLf}Failed: {errorCount}"

            If errorCount > 0 Then
                resultMessage += $"{vbCrLf}{vbCrLf}First few errors:{vbCrLf}{String.Join(vbCrLf, errorMessages.Take(5))}"
            End If

            MessageBox.Show(resultMessage, "Import Results", MessageBoxButtons.OK,
                       If(errorCount = 0, MessageBoxIcon.Information, MessageBoxIcon.Warning))

            ' Refresh the grid
            RefreshGridPreserveSelection()

        Catch ex As Exception
            MessageBox.Show($"Error processing Excel file: {ex.Message}", "Import Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            AppLogger.WriteLog($"Excel Import Error: {ex.Message}")
        Finally
            Cursor.Current = Cursors.Default
        End Try
    End Sub

    Private Function ImportStudentFromExcelRow(ws As ExcelWorksheet, row As Integer) As Boolean
        ' Convert Excel column letters → column numbers
        Dim LRN As String = GetCellValue(ws, row, 17)  ' Q
        Dim Surname As String = GetCellValue(ws, row, 11) ' K
        Dim FirstName As String = GetCellValue(ws, row, 12) ' L
        Dim MiddleInitial As String = GetCellValue(ws, row, 13) ' M
        Dim Age As String = GetCellValue(ws, row, 20) ' T
        Dim rawBday = ws.Cells(row, 18).Value

        Dim Birthday As String = ""

        If TypeOf rawBday Is DateTime Then
            ' Format Excel datetime → MM/dd/yyyy
            Birthday = CType(rawBday, DateTime).ToString("MM/dd/yyyy")
        Else
            ' If text, use raw but clean
            Birthday = rawBday.ToString().Trim()
        End If


        ' Additional new fields
        Dim Grade As String = GetCellValue(ws, row, 2) ' B
        Dim Adviser As String = GetCellValue(ws, row, 6) ' F
        Dim Section As String = GetCellValue(ws, row, 3) ' C
        Dim SchoolYear As String = $"{DateTime.Now.Year}-{DateTime.Now.Year + 1}"

        ' Blank fields
        Dim Address As String = ""
        Dim ContactNumber As String = ""
        Dim Email As String = ""
        Dim GuardianName As String = ""
        Dim GuardianContact As String = ""
        Dim Relationship As String = ""

        ' Validate required fields
        If String.IsNullOrWhiteSpace(LRN) OrElse
       String.IsNullOrWhiteSpace(Surname) OrElse
       String.IsNullOrWhiteSpace(FirstName) OrElse
       String.IsNullOrWhiteSpace(Age) OrElse
       String.IsNullOrWhiteSpace(Birthday) Then
            Return False
        End If

        ' Basic LRN valid
        If LRN.Length <> 12 Then Return False

        Try
            Using conn As New SqliteConnection("Data Source=" & dbFilePath)
                conn.Open()

                ' Skip duplicates
                Using chk As New SqliteCommand("SELECT COUNT(*) FROM Students WHERE LRN=@LRN", conn)
                    chk.Parameters.AddWithValue("@LRN", LRN)
                    If Convert.ToInt32(chk.ExecuteScalar()) > 0 Then
                        Return False
                    End If
                End Using

                Using trans = conn.BeginTransaction()
                    ' Insert into Students
                    Using cmd As New SqliteCommand("
                    INSERT INTO Students (LRN, Surname, FirstName, MiddleInitial, Age, Birthday, Address, ContactNumber, Email)
                    VALUES (@L, @S, @F, @M, @A, @BD, @AD, @CN, @E)", conn, trans)

                        cmd.Parameters.AddWithValue("@L", LRN)
                        cmd.Parameters.AddWithValue("@S", Surname)
                        cmd.Parameters.AddWithValue("@F", FirstName)
                        cmd.Parameters.AddWithValue("@M", MiddleInitial)
                        cmd.Parameters.AddWithValue("@A", Convert.ToInt32(Age))
                        cmd.Parameters.AddWithValue("@BD", Birthday)
                        cmd.Parameters.AddWithValue("@AD", Address)
                        cmd.Parameters.AddWithValue("@CN", ContactNumber)
                        cmd.Parameters.AddWithValue("@E", Email)
                        cmd.ExecuteNonQuery()
                    End Using

                    ' Insert Academic History
                    Using hist As New SqliteCommand("
                    INSERT INTO AcademicHistory (LRN, Grade, Section, SchoolYear, Adviser)
                    VALUES (@L, @G, @Sec, @SY, @Adv)", conn, trans)

                        hist.Parameters.AddWithValue("@L", LRN)
                        hist.Parameters.AddWithValue("@G", Grade)
                        hist.Parameters.AddWithValue("@Sec", Section)
                        hist.Parameters.AddWithValue("@SY", SchoolYear)
                        hist.Parameters.AddWithValue("@Adv", Adviser)
                        hist.ExecuteNonQuery()
                    End Using

                    trans.Commit()
                End Using
            End Using

            Return True
        Catch ex As Exception
            AppLogger.WriteLog("Import Error: " & ex.Message)
            Return False
        End Try
    End Function


    Private Function GetCellValue(worksheet As ExcelWorksheet, row As Integer, col As Integer) As String
        Try
            If worksheet.Cells(row, col).Value Is Nothing Then
                Return String.Empty
            End If
            Return worksheet.Cells(row, col).Value.ToString().Trim()
        Catch
            Return String.Empty
        End Try
    End Function

#End Region

#Region "Statistics"
    Private Sub UpdateStatistics()
        Label4.Text = GetTotal("SELECT COUNT(*) FROM Students").ToString()
        Label5.Text = GetTotal("SELECT COUNT(DISTINCT s.LRN) FROM Students s INNER JOIN CaseRecords cr ON s.LRN=cr.LRN").ToString()
        Label6.Text = GetTotal("SELECT COUNT(*) FROM CaseRecords").ToString()
    End Sub

    Private Function GetTotal(query As String) As Integer
        Try
            Using conn As New SqliteConnection("Data Source=" & dbFilePath)
                conn.Open()
                Using cmd As New SqliteCommand(query, conn)
                    Return Convert.ToInt32(cmd.ExecuteScalar())
                End Using
            End Using
        Catch
            Return 0
        End Try
    End Function
#End Region

#Region "Grid Preserve Selection"
    Private Sub RefreshGridPreserveSelection()
        If DataGridView1.SelectedRows.Count > 0 Then
            selectedRecordId = DataGridView1.SelectedRows(0).Cells("LRN").Value.ToString()
        End If

        LoadStudents(TextBox1.Text.Trim())

        If Not String.IsNullOrEmpty(selectedRecordId) Then
            For Each row As DataGridViewRow In DataGridView1.Rows
                If row.Cells("LRN").Value.ToString() = selectedRecordId Then
                    row.Selected = True
                    DataGridView1.CurrentCell = row.Cells(0)
                    Exit For
                End If
            Next
        End If
    End Sub
#End Region

#Region "UI Styling"
    ' Draw icons in the ActionsSR column
    Private Sub DataGridView1_CellPainting(sender As Object, e As DataGridViewCellPaintingEventArgs) Handles DataGridView1.CellPainting
        If DataGridView1.Columns(e.ColumnIndex).Name = "ActionsSR" AndAlso e.RowIndex >= 0 Then
            e.Handled = True
            e.PaintBackground(e.CellBounds, True)

            Dim iconSize As Integer = 20
            Dim padding As Integer = 10

            Dim viewIcon = My.Resources.eye_solid   ' Replace with your "view" icon name
            Dim penIcon = My.Resources.pen_solid      ' Edit icon
            Dim trashIcon = My.Resources.trash_solid  ' Delete icon

            ' Calculate x positions for all three icons
            Dim xView = e.CellBounds.X + padding
            Dim yIcon = e.CellBounds.Y + (e.CellBounds.Height - iconSize) \ 2
            Dim xEdit = xView + iconSize + padding
            Dim xDelete = xEdit + iconSize + padding

            ' Draw all icons
            e.Graphics.DrawImage(viewIcon, New Rectangle(xView, yIcon, iconSize, iconSize))
            e.Graphics.DrawImage(penIcon, New Rectangle(xEdit, yIcon, iconSize, iconSize))
            e.Graphics.DrawImage(trashIcon, New Rectangle(xDelete, yIcon, iconSize, iconSize))

            e.Paint(e.CellBounds, DataGridViewPaintParts.Border)
        End If
    End Sub

    Private Sub DataGridView1_CellMouseClick(sender As Object, e As DataGridViewCellMouseEventArgs) Handles DataGridView1.CellMouseClick
        If DataGridView1.Columns(e.ColumnIndex).Name = "ActionsSR" AndAlso e.RowIndex >= 0 Then
            Dim iconSize As Integer = 20
            Dim padding As Integer = 10
            Dim mouseX As Integer = e.X

            ' Calculate left/right range for each icon within the cell
            Dim viewLeft = padding
            Dim viewRight = viewLeft + iconSize

            Dim editLeft = viewRight + padding
            Dim editRight = editLeft + iconSize

            Dim deleteLeft = editRight + padding
            Dim deleteRight = deleteLeft + iconSize

            If mouseX >= viewLeft AndAlso mouseX < viewRight Then
                If DataGridView1.SelectedRows.Count = 0 Then
                    MessageBox.Show("Select a student record to view.")
                    Return
                End If

                Dim lrn = DataGridView1.SelectedRows(0).Cells("LRN").Value.ToString()
                Dim student = GetStudentByLRN(lrn)
                If student IsNot Nothing Then
                    Using detailsForm As New ViewRec(student)
                        detailsForm.ShowDialog(Me)
                        RefreshGridPreserveSelection()
                    End Using
                Else
                    MessageBox.Show("Student record not found.")
                End If
            ElseIf mouseX >= editLeft AndAlso mouseX < editRight Then
                If DataGridView1.SelectedRows.Count = 0 Then
                    MessageBox.Show("Select a student record to edit.")
                    Return
                End If

                Dim lrn = DataGridView1.SelectedRows(0).Cells("LRN").Value.ToString()
                Dim student = GetStudentByLRN(lrn)
                If student IsNot Nothing Then
                    ' Pass True, or use a parameter, to tell ViewRec to load in Edit mode
                    Using editForm As New ViewRec(student, True)
                        If editForm.ShowDialog(Me) = DialogResult.OK Then
                            RefreshGridPreserveSelection()
                        End If
                    End Using
                Else
                    MessageBox.Show("Student record not found.")
                End If
            ElseIf mouseX >= deleteLeft AndAlso mouseX < deleteRight Then
                DeleteStudent()
            End If
        End If
    End Sub
#End Region

End Class