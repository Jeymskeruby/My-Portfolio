Imports Microsoft.Data.Sqlite

''' <summary>
''' Single implementation of the audit_logs INSERT that used to be copy-pasted across
''' LoginForm / Form1 / UserManagementForm. Best-effort — never throws to the caller.
''' </summary>
Public Module AuditLog

    Public Sub Write(connStr As String, username As String, action As String, details As String)
        Try
            Using conn As New SqliteConnection(connStr)
                conn.Open()
                Using cmd As New SqliteCommand("INSERT INTO audit_logs (username, action, details, log_time) VALUES (@u, @a, @d, @t)", conn)
                    cmd.Parameters.AddWithValue("@u", If(CObj(username), DBNull.Value))
                    cmd.Parameters.AddWithValue("@a", If(CObj(action), DBNull.Value))
                    cmd.Parameters.AddWithValue("@d", If(CObj(details), DBNull.Value))
                    cmd.Parameters.AddWithValue("@t", DateTime.UtcNow)
                    cmd.ExecuteNonQuery()
                End Using
            End Using
        Catch ex As Exception
            AppLogger.WriteLog($"Audit write failed ({action}): {ex.Message}")
        End Try
    End Sub

End Module
