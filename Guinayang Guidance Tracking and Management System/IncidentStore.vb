Imports System.Text.Json
Imports Microsoft.Data.Sqlite

''' <summary>
''' Local replacement for the Firestore "incidents" collection used by the demo build.
''' Backed by an Incidents table in student_records.db so it shares the same file,
''' connection idiom and "Reset Demo" path as the rest of the app.
''' </summary>
Public Module IncidentStore

    Private ReadOnly connStr As String = "Data Source=student_records.db"

    Public ReadOnly CreateTableSql As String =
        "CREATE TABLE IF NOT EXISTS Incidents (" &
        "ownerId TEXT PRIMARY KEY, incidentType TEXT, status TEXT, urgencyLevel TEXT, " &
        "contactInfo TEXT, description TEXT, incidentDate TEXT, location TEXT, timestamp TEXT, " &
        "email TEXT, attachments TEXT, message TEXT, lastMessageTimestamp TEXT, " &
        "isManualMessage INTEGER DEFAULT 0, isDeleted INTEGER DEFAULT 0);"

    ''' <summary>Create the Incidents table on an already-open connection.</summary>
    Public Sub EnsureTable(conn As SqliteConnection)
        Using cmd As New SqliteCommand(CreateTableSql, conn)
            cmd.ExecuteNonQuery()
        End Using
    End Sub


    Private Function MapRow(r As SqliteDataReader) As IncidentReport
        Dim rep As New IncidentReport() With {
            .ownerId = SafeStr(r, "ownerId"),
            .IncidentType = SafeStr(r, "incidentType"),
            .status = SafeStr(r, "status"),
            .UrgencyLevel = SafeStr(r, "urgencyLevel"),
            .contactInfo = SafeStr(r, "contactInfo"),
            .description = SafeStr(r, "description"),
            .incidentDate = SafeStr(r, "incidentDate"),
            .location = SafeStr(r, "location"),
            .timestamp = SafeStr(r, "timestamp"),
            .Email = SafeStr(r, "email"),
            .Message = SafeStr(r, "message"),
            .LastMessageTimestamp = SafeStr(r, "lastMessageTimestamp"),
            .IsManualMessage = SafeInt(r, "isManualMessage") <> 0,
            .attachments = ParseAttachments(SafeStr(r, "attachments"))
        }
        rep.IsComplete = True
        Return rep
    End Function

    Private Function SafeStr(r As SqliteDataReader, col As String) As String
        Dim i = r.GetOrdinal(col)
        Return If(r.IsDBNull(i), String.Empty, r.GetValue(i).ToString())
    End Function

    Private Function SafeInt(r As SqliteDataReader, col As String) As Integer
        Dim i = r.GetOrdinal(col)
        Return If(r.IsDBNull(i), 0, Convert.ToInt32(r.GetValue(i)))
    End Function

    Public Function ParseAttachments(json As String) As List(Of String)
        Dim result As New List(Of String)
        If String.IsNullOrWhiteSpace(json) Then Return result
        Try
            Dim arr = JsonSerializer.Deserialize(Of List(Of String))(json)
            If arr IsNot Nothing Then result.AddRange(arr)
        Catch
            ' tolerate malformed data — treat as no attachments
        End Try
        Return result
    End Function

    Public Function GetAll() As List(Of IncidentReport)
        Dim list As New List(Of IncidentReport)
        Using conn As New SqliteConnection(connStr)
            conn.Open()
            EnsureTable(conn)
            Using cmd As New SqliteCommand("SELECT * FROM Incidents WHERE isDeleted = 0", conn)
                Using r = cmd.ExecuteReader()
                    While r.Read()
                        list.Add(MapRow(r))
                    End While
                End Using
            End Using
        End Using
        Return list
    End Function

    Public Function GetById(id As String) As IncidentReport
        Using conn As New SqliteConnection(connStr)
            conn.Open()
            EnsureTable(conn)
            Using cmd As New SqliteCommand("SELECT * FROM Incidents WHERE ownerId = @id AND isDeleted = 0", conn)
                cmd.Parameters.AddWithValue("@id", id)
                Using r = cmd.ExecuteReader()
                    If r.Read() Then Return MapRow(r)
                End Using
            End Using
        End Using
        Return Nothing
    End Function

    Public Sub SetStatusAndMessage(id As String, status As String, message As String)
        Using conn As New SqliteConnection(connStr)
            conn.Open()
            EnsureTable(conn)
            Using cmd As New SqliteCommand(
                "UPDATE Incidents SET status = @s, message = @m, lastMessageTimestamp = @t WHERE ownerId = @id", conn)
                cmd.Parameters.AddWithValue("@s", If(CObj(status), DBNull.Value))
                cmd.Parameters.AddWithValue("@m", If(CObj(message), DBNull.Value))
                cmd.Parameters.AddWithValue("@t", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"))
                cmd.Parameters.AddWithValue("@id", id)
                cmd.ExecuteNonQuery()
            End Using
        End Using
    End Sub

    Public Sub SetMessage(id As String, message As String, isManual As Boolean)
        Using conn As New SqliteConnection(connStr)
            conn.Open()
            EnsureTable(conn)
            Using cmd As New SqliteCommand(
                "UPDATE Incidents SET message = @m, lastMessageTimestamp = @t, isManualMessage = @im WHERE ownerId = @id", conn)
                cmd.Parameters.AddWithValue("@m", If(CObj(message), DBNull.Value))
                cmd.Parameters.AddWithValue("@t", DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"))
                cmd.Parameters.AddWithValue("@im", If(isManual, 1, 0))
                cmd.Parameters.AddWithValue("@id", id)
                cmd.ExecuteNonQuery()
            End Using
        End Using
    End Sub

    Public Sub Delete(id As String)
        Using conn As New SqliteConnection(connStr)
            conn.Open()
            EnsureTable(conn)
            Using cmd As New SqliteCommand("UPDATE Incidents SET isDeleted = 1 WHERE ownerId = @id", conn)
                cmd.Parameters.AddWithValue("@id", id)
                cmd.ExecuteNonQuery()
            End Using
        End Using
    End Sub

End Module
