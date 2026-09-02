Imports Microsoft.Data.Sqlite

Public Class AddEditUserForm
    Private loginForm As LoginForm
    Private existingUsername As String
    Private isEditMode As Boolean

    Public Property Username As String
    Public Property Role As String

#Region "Constructor and Form Events"
    Public Sub New(parentLoginForm As LoginForm, existingUser As String)
        InitializeComponent()
        loginForm = parentLoginForm
        existingUsername = existingUser
        isEditMode = (existingUser IsNot Nothing)

        If isEditMode Then
            Text = "Edit User"
            lblPasswordHint.Visible = True
        Else
            Text = "Add User"
            lblPasswordHint.Visible = False
        End If
    End Sub

    Private Sub AddEditUserForm_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        UiTheme.Apply(Me)
        cmbRole.Items.Add("admin")
        cmbRole.Items.Add("user")
        If isEditMode Then
            LoadUserData()
        Else
            cmbRole.SelectedIndex = 0
        End If
    End Sub
#End Region

#Region "User Data Operations"
    Private Sub LoadUserData()
        Try
            Using conn As New SqliteConnection(loginForm.dbConnStr)
                conn.Open()
                Using cmd As New SqliteCommand("SELECT username, role FROM users WHERE username = @username", conn)
                    cmd.Parameters.AddWithValue("@username", existingUsername)
                    Using rdr = cmd.ExecuteReader()
                        If rdr.Read() Then
                            txtUsername.Text = rdr.GetString(0)
                            Dim roleVal = rdr.GetString(1)
                            cmbRole.SelectedItem = roleVal
                            If cmbRole.SelectedIndex < 0 Then cmbRole.SelectedIndex = 0
                        End If
                    End Using
                End Using
            End Using
        Catch ex As Exception
            AppLogger.WriteLog($"Error loading user data: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Error")
        End Try
    End Sub

    Private Sub CreateUser()
        Try
            loginForm.AddUserToDB(txtUsername.Text, txtPassword.Text, cmbRole.Text)
            Username = txtUsername.Text
            Role = cmbRole.Text
            DialogResult = DialogResult.OK
            Me.Close()
        Catch ex As Exception
            AppLogger.WriteLog($"Error creating user: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Error")
        End Try
    End Sub

    Private Sub UpdateUser()
        Try
            Using conn As New SqliteConnection(loginForm.dbConnStr)
                conn.Open()

                If String.IsNullOrEmpty(txtPassword.Text) Then
                    Using cmd As New SqliteCommand("UPDATE users SET username = @newUsername, role = @role WHERE username = @oldUsername", conn)
                        cmd.Parameters.AddWithValue("@newUsername", txtUsername.Text)
                        cmd.Parameters.AddWithValue("@role", cmbRole.Text)
                        cmd.Parameters.AddWithValue("@oldUsername", existingUsername)
                        cmd.ExecuteNonQuery()
                    End Using
                Else
                    Dim record = PasswordHasher.Create(txtPassword.Text)
                    Using cmd As New SqliteCommand("UPDATE users SET username = @newUsername, hash = @hash, salt = @salt, role = @role WHERE username = @oldUsername", conn)
                        cmd.Parameters.AddWithValue("@newUsername", txtUsername.Text)
                        cmd.Parameters.AddWithValue("@hash", record.Hash)
                        cmd.Parameters.AddWithValue("@salt", record.Salt)
                        cmd.Parameters.AddWithValue("@role", cmbRole.Text)
                        cmd.Parameters.AddWithValue("@oldUsername", existingUsername)
                        cmd.ExecuteNonQuery()
                    End Using
                End If
            End Using

            Username = txtUsername.Text
            Role = cmbRole.Text
            DialogResult = DialogResult.OK
            Me.Close()
        Catch ex As Exception
            AppLogger.WriteLog($"Error updating user: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Error")
        End Try
    End Sub
#End Region

#Region "Button Event Handlers"
    Private Sub btnSave_Click(sender As Object, e As EventArgs) Handles btnSave.Click
        If String.IsNullOrEmpty(txtUsername.Text) Then
            MessageBox.Show("Please enter a username.")
            Return
        End If

        If String.IsNullOrEmpty(cmbRole.Text) Then
            MessageBox.Show("Please select a role.")
            Return
        End If

        If Not isEditMode AndAlso String.IsNullOrEmpty(txtPassword.Text) Then
            MessageBox.Show("Please enter a password for new user.")
            Return
        End If

        If isEditMode Then
            UpdateUser()
        Else
            CreateUser()
        End If
    End Sub

    Private Sub btnCancel_Click(sender As Object, e As EventArgs) Handles btnCancel.Click
        DialogResult = DialogResult.Cancel
        Me.Close()
    End Sub
#End Region

End Class
