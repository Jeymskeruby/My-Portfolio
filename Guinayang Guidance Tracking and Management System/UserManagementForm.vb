Imports Microsoft.Data.Sqlite

Public Class UserManagementForm

#Region "Fields & Constructor"
    Private loginForm As LoginForm
    Private Shadows parentForm As Form1

    Public Sub New(parent As Form1, lf As LoginForm)
        InitializeComponent()
        UiTheme.Apply(Me)
        parentForm = parent
        loginForm = lf
        LoadUsers()
        SetupAccessControls()
    End Sub
#End Region

#Region "Access Control & UI"
    Private Sub SetupAccessControls()
        ' Demo build: click-to-login accounts have no stored password, so self-service
        ' password change is not meaningful — drop that tab.
        If TabControl1.TabPages.Contains(TabPage2) Then TabControl1.TabPages.Remove(TabPage2)

        If parentForm.CurrentRole <> "admin" Then
            If TabControl1.TabPages.Contains(TabPage1) Then TabControl1.TabPages.Remove(TabPage1)
        End If
    End Sub
#End Region

#Region "User List"
    Private Sub LoadUsers()
        If parentForm.CurrentRole <> "admin" Then
            Return
        End If
        Try
            Using conn As New SqliteConnection(loginForm.dbConnStr)
                conn.Open()
                Using cmd As New SqliteCommand("SELECT username, role FROM users ORDER BY username", conn)
                    Using rdr = cmd.ExecuteReader()
                        DataGridView1.Rows.Clear()
                        While rdr.Read()
                            DataGridView1.Rows.Add(rdr.GetString(0), rdr.GetString(1))
                        End While
                    End Using
                End Using
            End Using
        Catch ex As Exception
            AppLogger.WriteLog($"Error loading users: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Error", MessageBoxButtons.OK)
        End Try
    End Sub
#End Region

#Region "Admin Functions"
    Private Sub btnAddUser_Click(sender As Object, e As EventArgs) Handles btnAddUser.Click
        Using addForm As New AddEditUserForm(loginForm, Nothing)
            If addForm.ShowDialog() = DialogResult.OK Then
                LoadUsers()
                LogAudit(parentForm.CurrentUser, "user_added", $"Added user: {addForm.Username}")
            End If
        End Using
    End Sub

    Private Sub btnEditUser_Click(sender As Object, e As EventArgs) Handles btnEditUser.Click
        If DataGridView1.SelectedRows.Count = 0 Then
            MessageBox.Show("Please select a user to edit.")
            Return
        End If
        Dim username = DataGridView1.SelectedRows(0).Cells("colUsername").Value.ToString()
        Using editForm As New AddEditUserForm(loginForm, username)
            If editForm.ShowDialog() = DialogResult.OK Then
                LoadUsers()
                LogAudit(parentForm.CurrentUser, "user_edited", $"Edited user: {username}")
            End If
        End Using
    End Sub

    Private Sub btnDeleteUser_Click(sender As Object, e As EventArgs) Handles btnDeleteUser.Click
        If DataGridView1.SelectedRows.Count = 0 Then
            MessageBox.Show("Please select a user to delete.")
            Return
        End If
        Dim username = DataGridView1.SelectedRows(0).Cells("colUsername").Value.ToString()
        If username = parentForm.CurrentUser Then
            MessageBox.Show("You cannot delete your own account.")
            Return
        End If
        If MessageBox.Show($"Are you sure you want to delete user '{username}'?", "Confirm Delete",
                         MessageBoxButtons.YesNo, MessageBoxIcon.Warning) = DialogResult.Yes Then
            Try
                Using conn As New SqliteConnection(loginForm.dbConnStr)
                    conn.Open()
                    Using cmd As New SqliteCommand("DELETE FROM users WHERE username = @username", conn)
                        cmd.Parameters.AddWithValue("@username", username)
                        cmd.ExecuteNonQuery()
                    End Using
                End Using
                LoadUsers()
                LogAudit(parentForm.CurrentUser, "user_deleted", $"Deleted user: {username}")
                MessageBox.Show("User deleted successfully.")
            Catch ex As Exception
                AppLogger.WriteLog($"Error deleting user: {ex.Message}")
                MessageBox.Show("Something went wrong. Please contact admin.", "Error", MessageBoxButtons.OK)
            End Try
        End If
    End Sub
#End Region

#Region "Change Password"
    Private Sub btnChangePassword_Click(sender As Object, e As EventArgs) Handles btnChangePassword.Click
        If String.IsNullOrEmpty(txtCurrentPassword.Text) OrElse
           String.IsNullOrEmpty(txtNewPassword.Text) OrElse
           String.IsNullOrEmpty(txtConfirmPassword.Text) Then
            MessageBox.Show("Please fill in all password fields.")
            Return
        End If
        If txtNewPassword.Text <> txtConfirmPassword.Text Then
            MessageBox.Show("New password and confirmation do not match.")
            Return
        End If
        If txtNewPassword.Text.Length < 6 Then
            MessageBox.Show("New password must be at least 6 characters long.")
            Return
        End If
        If Not VerifyCurrentPassword(txtCurrentPassword.Text) Then
            MessageBox.Show("Current password is incorrect.")
            Return
        End If
        If UpdatePassword(txtNewPassword.Text) Then
            MessageBox.Show("Password changed successfully.")
            txtCurrentPassword.Clear()
            txtNewPassword.Clear()
            txtConfirmPassword.Clear()
            LogAudit(parentForm.CurrentUser, "password_changed", "User changed their own password")
        Else
            MessageBox.Show("Error changing password.")
        End If
    End Sub

    Private Function VerifyCurrentPassword(currentPassword As String) As Boolean
        Try
            Using conn As New SqliteConnection(loginForm.dbConnStr)
                conn.Open()
                Using cmd As New SqliteCommand("SELECT hash, salt FROM users WHERE username = @username", conn)
                    cmd.Parameters.AddWithValue("@username", parentForm.CurrentUser)
                    Using rdr = cmd.ExecuteReader()
                        If rdr.Read() Then
                            Dim storedHash = rdr.GetString(0)
                            Dim storedSalt = rdr.GetString(1)
                            Dim enteredHash = PasswordHasher.Hash(currentPassword, storedSalt)
                            Return storedHash = enteredHash
                        End If
                    End Using
                End Using
            End Using
        Catch ex As Exception
            AppLogger.WriteLog($"Error verifying current password: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Verify Error", MessageBoxButtons.OK)
        End Try
        Return False
    End Function

    Private Function UpdatePassword(newPassword As String) As Boolean
        Try
            Dim record = PasswordHasher.Create(newPassword)
            Using conn As New SqliteConnection(loginForm.dbConnStr)
                conn.Open()
                Using cmd As New SqliteCommand("UPDATE users SET hash = @hash, salt = @salt WHERE username = @username", conn)
                    cmd.Parameters.AddWithValue("@hash", record.Hash)
                    cmd.Parameters.AddWithValue("@salt", record.Salt)
                    cmd.Parameters.AddWithValue("@username", parentForm.CurrentUser)
                    cmd.ExecuteNonQuery()
                End Using
            End Using
            Return True
        Catch ex As Exception
            AppLogger.WriteLog($"Error update password: {ex.Message}")
            MessageBox.Show("Something went wrong. Please contact admin.", "Update Error", MessageBoxButtons.OK)
            Return False
        End Try
    End Function
#End Region

    Private Sub LogAudit(username As String, action As String, details As String)
        AuditLog.Write(loginForm.dbConnStr, username, action, details)
    End Sub

#Region "Selection Event"
    Private Sub DataGridView1_SelectionChanged(sender As Object, e As EventArgs) Handles DataGridView1.SelectionChanged
        btnEditUser.Enabled = (DataGridView1.SelectedRows.Count > 0)
        btnDeleteUser.Enabled = (DataGridView1.SelectedRows.Count > 0)
    End Sub

#End Region

End Class
